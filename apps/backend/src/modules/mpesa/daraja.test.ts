/**
 * Daraja Service Tests
 * Tests for M-Pesa integration
 */

import { TransactionStatus } from "@prisma/client";
import { beforeEach, describe, expect, it, vi } from "vitest";
import type {
  DarajaB2BResponse,
  DarajaB2CResponse,
  DarajaCallbackBody,
  DarajaTokenResponse,
  MpesaB2BParams,
  MpesaB2CParams,
} from "./mpesa.types.js";

const prismaMock = vi.hoisted(() => ({
  transaction: {
    findUnique: vi.fn(),
    update: vi.fn(),
  },
}));

const envMock = vi.hoisted(() => ({
  DARAJA_CONSUMER_KEY: "test-key",
  DARAJA_CONSUMER_SECRET: "test-secret",
  DARAJA_SHORTCODE: "600000",
  DARAJA_PASSKEY: "test-passkey-123456",
}));

vi.mock("../../lib/prisma.js", () => ({
  prisma: prismaMock,
}));

vi.mock("../../config/env.js", () => ({
  env: envMock,
}));

const fetchMock = vi.fn();
(globalThis as unknown as { fetch: typeof fetch }).fetch = fetchMock as unknown as typeof fetch;

let darajaService: {
  getAccessToken: () => Promise<string>;
  sendToMpesa: (params: MpesaB2CParams) => Promise<DarajaB2CResponse>;
  sendToTill: (params: MpesaB2BParams) => Promise<DarajaB2BResponse>;
  handleCallback: (body: DarajaCallbackBody) => Promise<void>;
  simulateCallback: (transactionId: string) => Promise<void>;
};

describe("Daraja Service", () => {
  beforeEach(async () => {
    vi.clearAllMocks();
    fetchMock.mockClear();
    vi.resetModules();

    const module = await import("./daraja.service.js");
    darajaService = module.darajaService;
  });

  describe("getAccessToken", () => {
    it("should request a new token on first call", async () => {
      const mockResponse: DarajaTokenResponse = {
        access_token: "test-token-123",
        token_type: "Bearer",
        expires_in: 3600,
      };

      fetchMock.mockResolvedValueOnce({
        ok: true,
        json: async () => mockResponse,
      });

      const token = await darajaService.getAccessToken();

      expect(token).toBe("test-token-123");
      expect(fetchMock).toHaveBeenCalledTimes(1);
      expect(fetchMock).toHaveBeenCalledWith(
        expect.stringContaining("oauth/v1/generate"),
        expect.objectContaining({
          method: "GET",
          headers: expect.objectContaining({
            Authorization: expect.stringContaining("Basic"),
          }),
        })
      );
    });

    it("should return cached token if not expired", async () => {
      const mockResponse: DarajaTokenResponse = {
        access_token: "test-token-456",
        token_type: "Bearer",
        expires_in: 3600,
      };

      fetchMock.mockResolvedValueOnce({
        ok: true,
        json: async () => mockResponse,
      });

      // First call
      const token1 = await darajaService.getAccessToken();
      expect(token1).toBe("test-token-456");

      // Second call should use cache
      const token2 = await darajaService.getAccessToken();
      expect(token2).toBe("test-token-456");

      // Should only fetch once
      expect(fetchMock).toHaveBeenCalledTimes(1);
    });

    it("should handle token request errors", async () => {
      fetchMock.mockResolvedValueOnce({
        ok: false,
        status: 401,
      });

      await expect(darajaService.getAccessToken()).rejects.toThrow(
        "Failed to obtain M-Pesa access token"
      );
    });

    it("should handle network errors", async () => {
      fetchMock.mockRejectedValueOnce(new Error("Network error"));

      await expect(darajaService.getAccessToken()).rejects.toThrow(
        "Failed to obtain M-Pesa access token"
      );
    });

    it("should include proper Basic Auth header", async () => {
      const mockResponse: DarajaTokenResponse = {
        access_token: "token",
        token_type: "Bearer",
        expires_in: 3600,
      };

      fetchMock.mockResolvedValueOnce({
        ok: true,
        json: async () => mockResponse,
      });

      await darajaService.getAccessToken();

      const call = fetchMock.mock.calls[0][1] as Record<string, unknown>;
      const authHeader = call.headers as Record<string, string>;

      // Should have Basic auth with base64 encoded credentials
      expect(authHeader.Authorization).toMatch(/^Basic /);
      const credentials = Buffer.from(authHeader.Authorization.split(" ")[1], "base64").toString();
      expect(credentials).toBe("test-key:test-secret");
    });
  });

  describe("sendToMpesa", () => {
    beforeEach(() => {
      // Mock token fetch
      const mockResponse: DarajaTokenResponse = {
        access_token: "test-token",
        token_type: "Bearer",
        expires_in: 3600,
      };

      fetchMock.mockResolvedValueOnce({
        ok: true,
        json: async () => mockResponse,
      });
    });

    it("should send B2C payment with correct format", async () => {
      const mockB2CResponse: DarajaB2CResponse = {
        OriginatorConversationID: "tx-123",
        ConversationID: "conv-123",
        ResponseDescription: "accepted",
      };

      fetchMock.mockResolvedValueOnce({
        ok: true,
        json: async () => mockB2CResponse,
      });

      const params: MpesaB2CParams = {
        phoneNumber: "+254700000001",
        amountKes: 100,
        transactionId: "tx-123",
        recipientLabel: "John Doe",
      };

      const result = await darajaService.sendToMpesa(params);

      expect(result.OriginatorConversationID).toBe("tx-123");

      // Check B2C request format
      const call = fetchMock.mock.calls[1];
      expect(call[0]).toContain("b2c/v3/paymentrequest");
      expect(call[1].method).toBe("POST");

      const body = JSON.parse(call[1].body as string) as Record<string, unknown>;
      expect(body.CommandID).toBe("BusinessPayment");
      expect(body.Amount).toBe(100);
      expect(body.PartyB).toBe("254700000001"); // Phone without +
      expect(body.PartyA).toBe("600000");
    });

    it("should remove + prefix from phone number", async () => {
      const mockB2CResponse: DarajaB2CResponse = {
        OriginatorConversationID: "tx-456",
        ConversationID: "conv-456",
        ResponseDescription: "accepted",
      };

      fetchMock.mockResolvedValueOnce({
        ok: true,
        json: async () => mockB2CResponse,
      });

      const params: MpesaB2CParams = {
        phoneNumber: "+254700000002",
        amountKes: 200,
        transactionId: "tx-456",
        recipientLabel: "Jane Smith",
      };

      await darajaService.sendToMpesa(params);

      const call = fetchMock.mock.calls[1];
      const body = JSON.parse(call[1].body as string) as Record<string, unknown>;
      expect(body.PartyB).toBe("254700000002");
    });

    it("should handle B2C API errors", async () => {
      fetchMock.mockResolvedValueOnce({
        ok: false,
        status: 500,
      });

      const params: MpesaB2CParams = {
        phoneNumber: "+254700000003",
        amountKes: 150,
        transactionId: "tx-789",
        recipientLabel: "Test User",
      };

      await expect(darajaService.sendToMpesa(params)).rejects.toThrow(
        "Failed to send payment to M-Pesa"
      );
    });
  });

  describe("sendToTill", () => {
    beforeEach(() => {
      const mockResponse: DarajaTokenResponse = {
        access_token: "test-token",
        token_type: "Bearer",
        expires_in: 3600,
      };

      fetchMock.mockResolvedValueOnce({
        ok: true,
        json: async () => mockResponse,
      });
    });

    it("should send B2B payment with BusinessBuyGoods for till", async () => {
      const mockB2BResponse: DarajaB2BResponse = {
        OriginatorConversationID: "till-123",
        ConversationID: "conv-till-123",
        ResponseDescription: "accepted",
      };

      fetchMock.mockResolvedValueOnce({
        ok: true,
        json: async () => mockB2BResponse,
      });

      const params: MpesaB2BParams = {
        tillNumber: "123456",
        amountKes: 500,
        transactionId: "till-123",
      };

      const result = await darajaService.sendToTill(params);

      expect(result.OriginatorConversationID).toBe("till-123");

      const call = fetchMock.mock.calls[1];
      expect(call[0]).toContain("b2b/v1/paymentrequest");

      const body = JSON.parse(call[1].body as string) as Record<string, unknown>;
      expect(body.CommandID).toBe("BusinessBuyGoods");
      expect(body.Amount).toBe(500);
      expect(body.PartyB).toBe("123456");
    });

    it("should use BusinessPayBill command when accountRef is provided", async () => {
      const mockB2BResponse: DarajaB2BResponse = {
        OriginatorConversationID: "paybill-123",
        ConversationID: "conv-paybill-123",
        ResponseDescription: "accepted",
      };

      fetchMock.mockResolvedValueOnce({
        ok: true,
        json: async () => mockB2BResponse,
      });

      const params: MpesaB2BParams = {
        tillNumber: "999999",
        amountKes: 1000,
        transactionId: "paybill-123",
        accountRef: "INV-2026-001",
      };

      await darajaService.sendToTill(params);

      const call = fetchMock.mock.calls[1];
      const body = JSON.parse(call[1].body as string) as Record<string, unknown>;
      expect(body.CommandID).toBe("BusinessPayBill");
      expect(body.AccountReference).toBe("INV-2026-001");
    });

    it("should handle B2B API errors", async () => {
      fetchMock.mockResolvedValueOnce({
        ok: false,
        status: 400,
      });

      const params: MpesaB2BParams = {
        tillNumber: "456789",
        amountKes: 250,
        transactionId: "till-fail",
      };

      await expect(darajaService.sendToTill(params)).rejects.toThrow(
        "Failed to send payment to Till"
      );
    });
  });

  describe("handleCallback", () => {
    it("should update transaction to COMPLETED on success (ResultCode 0)", async () => {
      prismaMock.transaction.findUnique.mockResolvedValueOnce({
        id: "tx-123",
        status: "PENDING",
      });

      const callback = {
        Result: {
          ResultCode: 0,
          ResultDesc: "Success",
          OriginatorConversationID: "tx-123",
          ConversationID: "conv-123",
          TransactionID: "trans-123",
          ReceiptNumber: "RECEIPT-123",
        },
      };

      await darajaService.handleCallback(callback);

      expect(prismaMock.transaction.update).toHaveBeenCalledWith({
        where: { id: "tx-123" },
        data: {
          status: TransactionStatus.COMPLETED,
          darajaReceiptId: "RECEIPT-123",
        },
      });
    });

    it("should update transaction to FAILED on failure (non-zero ResultCode)", async () => {
      prismaMock.transaction.findUnique.mockResolvedValueOnce({
        id: "tx-456",
        status: "PENDING",
      });

      const callback = {
        Result: {
          ResultCode: 1,
          ResultDesc: "Failed",
          OriginatorConversationID: "tx-456",
          ConversationID: "conv-456",
          TransactionID: "trans-456",
        },
      };

      await darajaService.handleCallback(callback);

      expect(prismaMock.transaction.update).toHaveBeenCalledWith({
        where: { id: "tx-456" },
        data: {
          status: TransactionStatus.FAILED,
          darajaReceiptId: undefined,
        },
      });
    });

    it("should not fail if transaction not found", async () => {
      prismaMock.transaction.findUnique.mockResolvedValueOnce(null);

      const callback = {
        Result: {
          ResultCode: 0,
          ResultDesc: "Success",
          OriginatorConversationID: "tx-unknown",
          ConversationID: "conv-unknown",
          TransactionID: "trans-unknown",
        },
      };

      // Should not throw
      await expect(darajaService.handleCallback(callback)).resolves.toBeUndefined();
    });

    it("should not fail if missing Result field", async () => {
      const callback = {
        Result: null,
      } as unknown as DarajaCallbackBody;

      // Should not throw
      await expect(darajaService.handleCallback(callback)).resolves.toBeUndefined();
    });
  });

  describe("simulateCallback", () => {
    it("should update transaction to COMPLETED after delay", async () => {
      vi.useFakeTimers();

      prismaMock.transaction.findUnique.mockResolvedValueOnce({
        id: "sim-123",
        status: "PENDING",
      });

      const promise = darajaService.simulateCallback("sim-123");

      // Advance timers by 3 seconds
      vi.advanceTimersByTime(3000);

      await promise;

      expect(prismaMock.transaction.update).toHaveBeenCalledWith({
        where: { id: "sim-123" },
        data: {
          status: TransactionStatus.COMPLETED,
          darajaReceiptId: expect.stringMatching(/^SIM-/),
        },
      });

      vi.useRealTimers();
    });

    it("should handle missing transaction gracefully", async () => {
      vi.useFakeTimers();

      prismaMock.transaction.findUnique.mockResolvedValueOnce(null);

      const promise = darajaService.simulateCallback("sim-unknown");

      vi.advanceTimersByTime(3000);

      // Should not throw
      await expect(promise).resolves.toBeUndefined();

      vi.useRealTimers();
    });
  });
});
