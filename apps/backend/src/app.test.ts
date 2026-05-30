import request from "supertest";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

const handleCallbackMock = vi.fn(async () => undefined);

vi.mock("./modules/mpesa/daraja.service.js", () => ({
  darajaService: {
    handleCallback: handleCallbackMock,
  },
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
        status: "ok",
        version: expect.any(String),
      })
    );
  });

  it("returns 404 for unknown routes", async () => {
    const response = await request(app).get("/does-not-exist");

    expect(response.status).toBe(404);
    expect(response.body).toEqual({ success: false, error: "Not Found" });
  });

  it("accepts M-Pesa webhook callback and processes it asynchronously", async () => {
    const callbackBody = {
      Result: {
        ResultCode: 0,
        ResultDesc: "Success",
        OriginatorConversationID: "tx-123",
        ConversationID: "conv-123",
        TransactionID: "trans-123",
      },
    };

    const response = await request(app).post("/webhooks/callback").send(callbackBody);

    expect(response.status).toBe(200);
    expect(response.body).toEqual({ message: "Callback received" });
    expect(handleCallbackMock).toHaveBeenCalledWith(callbackBody);
  });
});
