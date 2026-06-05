import React, { createContext, useCallback, useEffect, useMemo, useState } from "react";

import { calculateUsdcDeduction } from "../utils/currency";

type WalletContextValue = {
  intlPayments: boolean;
  marketRate: number;
  onlinePurchases: boolean;
  usdcBalance: number;
  deductKesAmount: (amountKes: string) => void;
  setIntlPayments: React.Dispatch<React.SetStateAction<boolean>>;
  setOnlinePurchases: React.Dispatch<React.SetStateAction<boolean>>;
  setUsdcBalance: React.Dispatch<React.SetStateAction<number>>;
};

export const WalletContext = createContext<WalletContextValue | undefined>(undefined);

type WalletProviderProps = {
  children: React.ReactNode;
};

export const WalletProvider = ({ children }: WalletProviderProps) => {
  const [intlPayments, setIntlPayments] = useState(true);
  const [onlinePurchases, setOnlinePurchases] = useState(true);
  const [usdcBalance, setUsdcBalance] = useState(2480.5);
  const [marketRate, setMarketRate] = useState(128.84);

  useEffect(() => {
    const interval = setInterval(() => {
      setMarketRate((previousRate) => previousRate + (Math.random() * 0.1 - 0.05));
    }, 5000);

    return () => clearInterval(interval);
  }, []);

  const deductKesAmount = useCallback((amountKes: string) => {
    const deduction = calculateUsdcDeduction(amountKes);

    if (deduction > 0) {
      setUsdcBalance((previousBalance) => previousBalance - deduction);
    }
  }, []);

  const value = useMemo(
    () => ({
      deductKesAmount,
      intlPayments,
      marketRate,
      onlinePurchases,
      setIntlPayments,
      setOnlinePurchases,
      setUsdcBalance,
      usdcBalance,
    }),
    [deductKesAmount, intlPayments, marketRate, onlinePurchases, usdcBalance]
  );

  return <WalletContext.Provider value={value}>{children}</WalletContext.Provider>;
};
