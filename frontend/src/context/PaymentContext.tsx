import React, { createContext, useCallback, useEffect, useMemo, useRef, useState } from "react";
import { Alert } from "react-native";

import { API_BASE_URL } from "../config/api";
import { useAuth } from "../hooks/useAuth";
import { useWallet } from "../hooks/useWallet";
import type { Transaction } from "../types/models";
import { mapApiTransaction } from "../utils/transactions";

const PAYMENT_POLL_INTERVAL_MS = 2_000;
const PAYMENT_POLL_ATTEMPTS = 30;

class DarajaPaymentFailedError extends Error {}

type PaymentContextValue = {
  accountNumber: string;
  amount: string;
  bizNumber: string;
  isProcessing: boolean;
  isHistoryLoading: boolean;
  historyError: string | null;
  phoneNumber: string;
  showRateConfirm: boolean;
  showSuccessModal: boolean;
  tillNumber: string;
  transactions: Transaction[];
  completedTransaction: Transaction | null;
  confirmRequest: (onComplete: () => void) => void;
  fetchPaymentHistory: () => Promise<void>;
  hideSuccessModal: () => void;
  processPayment: (onComplete: () => void) => Promise<void>;
  resetPaymentForm: () => void;
  setAccountNumber: React.Dispatch<React.SetStateAction<string>>;
  setAmount: React.Dispatch<React.SetStateAction<string>>;
  setBizNumber: React.Dispatch<React.SetStateAction<string>>;
  setPhoneNumber: React.Dispatch<React.SetStateAction<string>>;
  setShowRateConfirm: React.Dispatch<React.SetStateAction<boolean>>;
  setTillNumber: React.Dispatch<React.SetStateAction<string>>;
};

export const PaymentContext = createContext<PaymentContextValue | undefined>(undefined);

type PaymentProviderProps = {
  children: React.ReactNode;
};

export const PaymentProvider = ({ children }: PaymentProviderProps) => {
  const { authToken } = useAuth();
  const { deductKesAmount, marketRate, refreshWalletData } = useWallet();
  const [phoneNumber, setPhoneNumber] = useState("");
  const [amount, setAmount] = useState("");
  const [bizNumber, setBizNumber] = useState("");
  const [accountNumber, setAccountNumber] = useState("");
  const [tillNumber, setTillNumber] = useState("");
  const [isProcessing, setIsProcessing] = useState(false);
  const [isHistoryLoading, setIsHistoryLoading] = useState(false);
  const [historyError, setHistoryError] = useState<string | null>(null);
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [completedTransaction, setCompletedTransaction] = useState<Transaction | null>(null);
  const [showRateConfirm, setShowRateConfirm] = useState(false);
  const [showSuccessModal, setShowSuccessModal] = useState(false);
  const processingTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const autoCloseTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(
    () => () => {
      if (processingTimerRef.current) {
        clearTimeout(processingTimerRef.current);
      }

      if (autoCloseTimerRef.current) {
        clearTimeout(autoCloseTimerRef.current);
      }
    },
    []
  );

  const resetPaymentForm = useCallback(() => {
    setAmount("");
    setPhoneNumber("");
    setBizNumber("");
    setAccountNumber("");
    setTillNumber("");
    setShowRateConfirm(false);
  }, []);

  const hideSuccessModal = useCallback(() => {
    setShowSuccessModal(false);
    setCompletedTransaction(null);
  }, []);

  const upsertTransaction = useCallback((transaction: Transaction) => {
    setTransactions((current) => [
      transaction,
      ...current.filter((item) => item.id !== transaction.id),
    ]);
  }, []);

  const pollTransaction = useCallback(
    async (transactionId: string): Promise<Transaction | null> => {
      for (let attempt = 0; attempt < PAYMENT_POLL_ATTEMPTS; attempt += 1) {
        const response = await fetch(`${API_BASE_URL}/mpesa/status/${transactionId}`, {
          headers: { Authorization: `Bearer ${authToken}` },
        });
        const data = await response.json().catch(() => null);

        if (!response.ok) {
          const message =
            data && typeof data === "object"
              ? String(
                  (data as { error?: unknown; message?: unknown }).error ??
                    (data as { message?: unknown }).message ??
                    "Could not check payment status"
                )
              : "Could not check payment status";

          throw new Error(message);
        }

        const transaction = mapApiTransaction(data);
        upsertTransaction(transaction);

        if (transaction.status === "COMPLETED") {
          return transaction;
        }

        if (transaction.status === "FAILED") {
          throw new DarajaPaymentFailedError("M-Pesa could not complete the payment.");
        }

        await new Promise((resolve) => setTimeout(resolve, PAYMENT_POLL_INTERVAL_MS));
      }

      return null;
    },
    [authToken, upsertTransaction]
  );

  const fetchPaymentHistory = useCallback(async () => {
    if (!authToken) {
      setTransactions([]);
      setHistoryError(null);
      return;
    }

    setIsHistoryLoading(true);
    setHistoryError(null);

    try {
      const response = await fetch(`${API_BASE_URL}/payment/history`, {
        headers: { Authorization: `Bearer ${authToken}` },
      });
      const data = await response.json().catch(() => null);

      if (!response.ok) {
        const message =
          data && typeof data === "object"
            ? String(
                (data as { error?: unknown; message?: unknown }).error ??
                  (data as { message?: unknown }).message ??
                  "Failed to load payment history"
              )
            : "Failed to load payment history";

        throw new Error(message);
      }

      if (!Array.isArray(data)) {
        throw new Error("Payment history response was invalid");
      }

      setTransactions(data.map(mapApiTransaction));
    } catch (error) {
      setHistoryError(error instanceof Error ? error.message : "Failed to load payment history");
    } finally {
      setIsHistoryLoading(false);
    }
  }, [authToken]);

  useEffect(() => {
    const historyFetchTimer = setTimeout(() => {
      void fetchPaymentHistory();
    }, 0);

    return () => clearTimeout(historyFetchTimer);
  }, [fetchPaymentHistory]);

  const processPayment = useCallback(
    async (onComplete: () => void) => {
      if (!authToken) {
        Alert.alert("Payment Failed", "Please log in before making a payment.");
        return;
      }

      const amountKes = Number.parseFloat(amount);

      if (!Number.isFinite(amountKes) || amountKes <= 0 || marketRate <= 0) {
        Alert.alert("Payment Failed", "Please enter a valid payment amount.");
        return;
      }

      const destination =
        bizNumber.trim() && accountNumber.trim()
          ? {
              paybillNumber: bizNumber.trim(),
              accountRef: accountNumber.trim(),
            }
          : tillNumber.trim()
            ? { destinationTill: tillNumber.trim() }
            : phoneNumber.trim()
              ? { destinationPhone: phoneNumber.trim() }
              : null;

      if (!destination) {
        Alert.alert("Payment Failed", "Please enter the payment destination.");
        return;
      }

      setIsProcessing(true);
      let paymentAccepted = false;

      try {
        const response = await fetch(`${API_BASE_URL}/payment/initiate`, {
          method: "POST",
          headers: {
            Authorization: `Bearer ${authToken}`,
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            ...destination,
            amountUsdc: amountKes / marketRate,
          }),
        });
        const data = await response.json().catch(() => null);

        if (!response.ok) {
          const message =
            data && typeof data === "object"
              ? String(
                  (data as { error?: unknown; message?: unknown }).error ??
                    (data as { message?: unknown }).message ??
                    "Payment could not be completed"
                )
              : "Payment could not be completed";

          throw new Error(message);
        }

        if (
          !data ||
          typeof data !== "object" ||
          typeof (data as { id?: unknown }).id !== "string"
        ) {
          throw new Error("Payment response was invalid");
        }

        const pendingTransaction = mapApiTransaction(data);
        paymentAccepted = true;
        upsertTransaction(pendingTransaction);
        deductKesAmount(amount);
        void refreshWalletData();
        const settledTransaction = await pollTransaction(pendingTransaction.id);

        if (!settledTransaction) {
          Alert.alert(
            "Payment Processing",
            "M-Pesa is still processing this payment. Its receipt will appear in your history."
          );
          void fetchPaymentHistory();
          return;
        }

        setCompletedTransaction(settledTransaction);
        setShowSuccessModal(true);
        void fetchPaymentHistory();

        if (autoCloseTimerRef.current) {
          clearTimeout(autoCloseTimerRef.current);
        }

        autoCloseTimerRef.current = setTimeout(() => {
          setShowSuccessModal(false);
          setCompletedTransaction(null);
          resetPaymentForm();
          onComplete();
        }, 2500);
      } catch (error) {
        if (paymentAccepted && !(error instanceof DarajaPaymentFailedError)) {
          Alert.alert(
            "Payment Processing",
            "The payment was accepted, but its latest M-Pesa status could not be loaded. Check your history shortly."
          );
          void fetchPaymentHistory();
        } else {
          Alert.alert(
            "Payment Failed",
            error instanceof Error ? error.message : "Payment could not be completed"
          );
        }
      } finally {
        setIsProcessing(false);
      }
    },
    [
      accountNumber,
      amount,
      authToken,
      bizNumber,
      deductKesAmount,
      fetchPaymentHistory,
      marketRate,
      phoneNumber,
      pollTransaction,
      refreshWalletData,
      resetPaymentForm,
      tillNumber,
      upsertTransaction,
    ]
  );

  const confirmRequest = useCallback((onComplete: () => void) => {
    setIsProcessing(true);
    processingTimerRef.current = setTimeout(() => {
      setIsProcessing(false);
      setShowRateConfirm(false);
      onComplete();
    }, 2000);
  }, []);

  const value = useMemo(
    () => ({
      accountNumber,
      amount,
      bizNumber,
      completedTransaction,
      confirmRequest,
      fetchPaymentHistory,
      hideSuccessModal,
      historyError,
      isHistoryLoading,
      isProcessing,
      phoneNumber,
      processPayment,
      resetPaymentForm,
      setAccountNumber,
      setAmount,
      setBizNumber,
      setPhoneNumber,
      setShowRateConfirm,
      setTillNumber,
      showRateConfirm,
      showSuccessModal,
      tillNumber,
      transactions,
    }),
    [
      accountNumber,
      amount,
      bizNumber,
      completedTransaction,
      confirmRequest,
      fetchPaymentHistory,
      hideSuccessModal,
      historyError,
      isHistoryLoading,
      isProcessing,
      phoneNumber,
      processPayment,
      resetPaymentForm,
      showRateConfirm,
      showSuccessModal,
      tillNumber,
      transactions,
    ]
  );

  return <PaymentContext.Provider value={value}>{children}</PaymentContext.Provider>;
};
