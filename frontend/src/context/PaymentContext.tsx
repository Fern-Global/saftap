import React, { createContext, useCallback, useEffect, useMemo, useRef, useState } from "react";

import { useWallet } from "../hooks/useWallet";

type PaymentContextValue = {
  accountNumber: string;
  amount: string;
  bizNumber: string;
  isProcessing: boolean;
  phoneNumber: string;
  showRateConfirm: boolean;
  showSuccessModal: boolean;
  tillNumber: string;
  confirmRequest: (onComplete: () => void) => void;
  hideSuccessModal: () => void;
  processPayment: (onComplete: () => void) => void;
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
  const { deductKesAmount } = useWallet();
  const [phoneNumber, setPhoneNumber] = useState("");
  const [amount, setAmount] = useState("");
  const [bizNumber, setBizNumber] = useState("");
  const [accountNumber, setAccountNumber] = useState("");
  const [tillNumber, setTillNumber] = useState("");
  const [isProcessing, setIsProcessing] = useState(false);
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
  }, []);

  const processPayment = useCallback(
    (onComplete: () => void) => {
      setIsProcessing(true);
      processingTimerRef.current = setTimeout(() => {
        deductKesAmount(amount);
        setIsProcessing(false);
        setShowSuccessModal(true);

        autoCloseTimerRef.current = setTimeout(() => {
          setShowSuccessModal(false);
          resetPaymentForm();
          onComplete();
        }, 2500);
      }, 2500);
    },
    [amount, deductKesAmount, resetPaymentForm]
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
      confirmRequest,
      hideSuccessModal,
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
    }),
    [
      accountNumber,
      amount,
      bizNumber,
      confirmRequest,
      hideSuccessModal,
      isProcessing,
      phoneNumber,
      processPayment,
      resetPaymentForm,
      showRateConfirm,
      showSuccessModal,
      tillNumber,
    ]
  );

  return <PaymentContext.Provider value={value}>{children}</PaymentContext.Provider>;
};
