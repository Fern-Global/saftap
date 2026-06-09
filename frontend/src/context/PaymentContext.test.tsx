import { Alert } from "react-native";
import { act } from "react-test-renderer";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import { useAuth } from "../hooks/useAuth";
import { useWallet } from "../hooks/useWallet";
import { renderContext } from "../test/renderContext";
import { PaymentContext, PaymentProvider } from "./PaymentContext";

vi.mock("../hooks/useAuth", () => ({
  useAuth: vi.fn(),
}));

vi.mock("../hooks/useWallet", () => ({
  useWallet: vi.fn(),
}));

const response = (body: unknown, ok = true) =>
  ({
    json: vi.fn().mockResolvedValue(body),
    ok,
  }) as unknown as Response;

describe("PaymentProvider", () => {
  const deductKesAmount = vi.fn();
  const refreshWalletData = vi.fn().mockResolvedValue(undefined);

  beforeEach(() => {
    vi.useFakeTimers();
    vi.clearAllMocks();
    vi.mocked(useAuth).mockReturnValue({ authToken: "payment-token" } as ReturnType<
      typeof useAuth
    >);
    vi.mocked(useWallet).mockReturnValue({
      deductKesAmount,
      marketRate: 100,
      refreshWalletData,
    } as unknown as ReturnType<typeof useWallet>);
  });

  afterEach(() => {
    vi.useRealTimers();
    vi.unstubAllGlobals();
  });

  it("submits an M-Pesa payment and completes after the success delay", async () => {
    const pendingTransaction = {
      amountKes: "500.00",
      createdAt: "2026-06-09T10:00:00.000Z",
      destinationPhone: "0712345678",
      id: "payment-1",
      status: "CONVERTING",
    };
    const completedTransaction = {
      ...pendingTransaction,
      darajaReceiptId: "RECEIPT-123",
      darajaReceiverName: "254712345678 - Jane Doe",
      status: "COMPLETED",
    };
    const fetchMock = vi
      .fn()
      .mockResolvedValueOnce(response(pendingTransaction))
      .mockResolvedValueOnce(response(completedTransaction))
      .mockResolvedValue(response([]));
    vi.stubGlobal("fetch", fetchMock);
    const payments = renderContext(PaymentContext, PaymentProvider);
    const onComplete = vi.fn();

    act(() => {
      payments.current.setPhoneNumber("0712345678");
      payments.current.setAmount("500");
    });

    await act(async () => {
      await payments.current.processPayment(onComplete);
    });

    expect(fetchMock.mock.calls[0]?.[0]).toBe("http://localhost:4000/api/payment/initiate");
    const request = fetchMock.mock.calls[0]?.[1] as RequestInit;
    expect(request.method).toBe("POST");
    expect(JSON.parse(String(request.body))).toEqual({
      amountUsdc: 5,
      destinationPhone: "0712345678",
    });
    expect(deductKesAmount).toHaveBeenCalledWith("500");
    expect(refreshWalletData).toHaveBeenCalled();
    expect(payments.current.showSuccessModal).toBe(true);
    expect(payments.current.completedTransaction?.darajaReceiptId).toBe("RECEIPT-123");
    expect(onComplete).not.toHaveBeenCalled();

    await act(async () => {
      await vi.advanceTimersByTimeAsync(2500);
    });

    expect(payments.current.showSuccessModal).toBe(false);
    expect(payments.current.amount).toBe("");
    expect(payments.current.phoneNumber).toBe("");
    expect(onComplete).toHaveBeenCalledOnce();
    payments.unmount();
  });

  it("shows the server error and leaves the payment flow in place", async () => {
    vi.stubGlobal(
      "fetch",
      vi.fn().mockResolvedValue(response({ error: "Insufficient wallet balance" }, false))
    );
    const payments = renderContext(PaymentContext, PaymentProvider);
    const onComplete = vi.fn();

    act(() => {
      payments.current.setTillNumber("123456");
      payments.current.setAmount("1000");
    });

    await act(async () => {
      await payments.current.processPayment(onComplete);
    });

    expect(Alert.alert).toHaveBeenCalledWith("Payment Failed", "Insufficient wallet balance");
    expect(deductKesAmount).not.toHaveBeenCalled();
    expect(onComplete).not.toHaveBeenCalled();
    expect(payments.current.isProcessing).toBe(false);
    payments.unmount();
  });

  it("does not contact the server when the payment destination is missing", async () => {
    const fetchMock = vi.fn();
    vi.stubGlobal("fetch", fetchMock);
    const payments = renderContext(PaymentContext, PaymentProvider);

    act(() => {
      payments.current.setAmount("500");
    });

    await act(async () => {
      await payments.current.processPayment(vi.fn());
    });

    expect(Alert.alert).toHaveBeenCalledWith(
      "Payment Failed",
      "Please enter the payment destination."
    );
    expect(fetchMock).not.toHaveBeenCalled();
    payments.unmount();
  });

  it("stores payment history errors for retry rendering", async () => {
    vi.stubGlobal(
      "fetch",
      vi.fn().mockResolvedValue(response({ message: "History service unavailable" }, false))
    );
    const payments = renderContext(PaymentContext, PaymentProvider);

    await act(async () => {
      await payments.current.fetchPaymentHistory();
    });

    expect(payments.current.historyError).toBe("History service unavailable");
    expect(payments.current.isHistoryLoading).toBe(false);
    payments.unmount();
  });
});
