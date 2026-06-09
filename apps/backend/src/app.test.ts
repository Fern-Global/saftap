import request from "supertest";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { AppError } from "./shared/errors.js";

const handleCallbackMock = vi.fn(async () => undefined);
const getExchangeRateMock = vi.fn(async () => 129);
const findTransactionMock = vi.fn();
const verifyTokenMock = vi.fn(() => ({ userId: "user-123" }));
const resetDemoDataMock = vi.fn(async () => undefined);

vi.mock("./config/env.js", () => ({
  env: {
    ADMIN_API_KEY: "test-admin-api-key-that-is-long-enough",
    APP_ENV: "demo",
  },
}));

vi.mock("./lib/prisma.js", () => ({
  prisma: {
    transaction: {
      findFirst: findTransactionMock,
    },
  },
}));

vi.mock("./modules/auth/auth.service.js", () => ({
  verifyToken: verifyTokenMock,
}));

vi.mock("./modules/mpesa/daraja.service.js", () => ({
  darajaService: {
    handleCallback: handleCallbackMock,
  },
}));

vi.mock("./modules/payment/payment.service.js", () => ({
  paymentService: {
    executeUsdcTransfer: vi.fn(),
    getExchangeRate: getExchangeRateMock,
    getTransactionHistory: vi.fn(),
    initiatePayment: vi.fn(),
  },
}));

vi.mock("./demo/demo-data.service.js", () => ({
  resetDemoData: resetDemoDataMock,
}));

const { app } = await import("./app.js");

describe("backend app", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("serves health checks", async () => {
    const response = await request(app).get("/health");

    expect(response.status).toBe(200);
    expect(response.body).toEqual(
      expect.objectContaining({
        appEnv: "demo",
        status: "ok",
        version: expect.any(String),
        walletProvider: "anvil",
      })
    );
  });

  it("protects and runs the demo reset endpoint", async () => {
    const unauthorized = await request(app).post("/admin/demo-reset");
    const authorized = await request(app)
      .post("/admin/demo-reset")
      .set("Authorization", "Bearer test-admin-api-key-that-is-long-enough");

    expect(unauthorized.status).toBe(401);
    expect(authorized.status).toBe(200);
    expect(authorized.body).toEqual({
      success: true,
      message: "Demo data reset complete",
    });
    expect(resetDemoDataMock).toHaveBeenCalledOnce();
  });

  it("returns 404 for unknown routes", async () => {
    const response = await request(app).get("/does-not-exist");

    expect(response.status).toBe(404);
    expect(response.body).toEqual({ success: false, error: "Not Found" });
  });

  it("returns operational async route errors without terminating the app", async () => {
    getExchangeRateMock.mockRejectedValueOnce(
      new AppError("Failed to fetch USD/KES exchange rate", 502)
    );

    const failedRateResponse = await request(app).get("/api/payment/rate");
    const healthResponse = await request(app).get("/health");

    expect(failedRateResponse.status).toBe(502);
    expect(failedRateResponse.body).toEqual({
      success: false,
      error: "Failed to fetch USD/KES exchange rate",
    });
    expect(healthResponse.status).toBe(200);
  });

  it("accepts and persists an M-Pesa webhook callback", async () => {
    const callbackBody = {
      Result: {
        ResultCode: 0,
        ResultDesc: "Success",
        OriginatorConversationID: "tx-123",
        ConversationID: "conv-123",
        TransactionID: "trans-123",
      },
    };

    const response = await request(app).post("/api/mpesa/callback").send(callbackBody);

    expect(response.status).toBe(200);
    expect(response.body).toEqual({ message: "Callback received" });
    expect(handleCallbackMock).toHaveBeenCalledWith(callbackBody);
  });

  it("returns an authenticated M-Pesa transaction status", async () => {
    findTransactionMock.mockResolvedValueOnce({
      id: "tx-123",
      userId: "user-123",
      amountKes: "500.00",
      darajaReceiptId: "RECEIPT-123",
      darajaReceiverName: "254700000001 - John Doe",
      status: "COMPLETED",
    });

    const response = await request(app)
      .get("/api/mpesa/status/tx-123")
      .set("Authorization", "Bearer valid-token");

    expect(response.status).toBe(200);
    expect(response.headers["cache-control"]).toBe("no-store");
    expect(response.body).toEqual(
      expect.objectContaining({
        amountKes: "500.00",
        darajaReceiptId: "RECEIPT-123",
        darajaReceiverName: "254700000001 - John Doe",
        status: "COMPLETED",
      })
    );
    expect(findTransactionMock).toHaveBeenCalledWith({
      where: {
        id: "tx-123",
        userId: "user-123",
      },
      include: {
        savedPayee: true,
      },
    });
  });
});
