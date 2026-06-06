import React, { createContext, useCallback, useEffect, useMemo, useState } from "react";

import { API_BASE_URL } from "../config/api";
import { useAuth } from "../hooks/useAuth";
import { calculateUsdcDeduction } from "../utils/currency";

const MARKET_RATE_POLL_INTERVAL_MS = 30_000;

type WalletContextValue = {
  intlPayments: boolean;
  marketRate: number;
  onlinePurchases: boolean;
  usdcBalance: number;
  deductKesAmount: (amountKes: string) => void;
  fundWallet: (amountUsdc: string) => Promise<void>;
  refreshWalletData: () => Promise<void>;
  setIntlPayments: React.Dispatch<React.SetStateAction<boolean>>;
  setOnlinePurchases: React.Dispatch<React.SetStateAction<boolean>>;
  setUsdcBalance: React.Dispatch<React.SetStateAction<number>>;
};

export const WalletContext = createContext<WalletContextValue | undefined>(undefined);

type WalletProviderProps = {
  children: React.ReactNode;
};

export const WalletProvider = ({ children }: WalletProviderProps) => {
  const { authToken } = useAuth();
  const [intlPayments, setIntlPayments] = useState(true);
  const [onlinePurchases, setOnlinePurchases] = useState(true);
  const [usdcBalance, setUsdcBalance] = useState(0);
  const [marketRate, setMarketRate] = useState(128.84);

  const refreshWalletData = useCallback(async () => {
    if (!authToken) {
      setUsdcBalance(0);
      return;
    }

    try {
      const response = await fetch(`${API_BASE_URL}/wallet/balance`, {
        headers: { Authorization: `Bearer ${authToken}` },
      });
      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || data.message || "Failed to fetch wallet balance");
      }

      const balance = Number(data.balanceUsdc);

      if (!Number.isFinite(balance)) {
        throw new Error("Wallet balance response was invalid");
      }

      setUsdcBalance(balance);
    } catch (error) {
      console.warn(
        "Failed to fetch wallet balance:",
        error instanceof Error ? error.message : error
      );
    }
  }, [authToken]);

  const fundWallet = useCallback(
    async (amountUsdc: string) => {
      if (!authToken) {
        throw new Error("Please log in before funding your wallet.");
      }

      const parsedAmount = Number.parseFloat(amountUsdc);

      if (!Number.isFinite(parsedAmount) || parsedAmount <= 0) {
        throw new Error("Please enter a valid funding amount.");
      }

      const response = await fetch(`${API_BASE_URL}/wallet/fund`, {
        method: "POST",
        headers: {
          Authorization: `Bearer ${authToken}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ amountUsdc: parsedAmount }),
      });
      const data = await response.json().catch(() => null);

      if (!response.ok) {
        const message =
          data && typeof data === "object"
            ? String(
                (data as { error?: unknown; message?: unknown }).error ??
                  (data as { message?: unknown }).message ??
                  "Wallet funding failed"
              )
            : "Wallet funding failed";

        throw new Error(message);
      }

      const balance = Number((data as { balanceUsdc?: unknown } | null)?.balanceUsdc);

      if (Number.isFinite(balance)) {
        setUsdcBalance(balance);
      } else {
        await refreshWalletData();
      }
    },
    [authToken, refreshWalletData]
  );

  const fetchMarketRate = useCallback(async () => {
    try {
      const response = await fetch(`${API_BASE_URL}/payment/rate`);
      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || data.message || "Failed to fetch market rate");
      }

      const rate = Number(data.rate);

      if (!Number.isFinite(rate) || rate <= 0) {
        throw new Error("Market rate response was invalid");
      }

      setMarketRate(rate);
    } catch (error) {
      console.warn("Failed to fetch market rate:", error instanceof Error ? error.message : error);
    }
  }, []);

  useEffect(() => {
    const initialFetchTimer = setTimeout(() => {
      void fetchMarketRate();
      void refreshWalletData();
    }, 0);

    const interval = setInterval(() => {
      void fetchMarketRate();
    }, MARKET_RATE_POLL_INTERVAL_MS);

    return () => {
      clearTimeout(initialFetchTimer);
      clearInterval(interval);
    };
  }, [fetchMarketRate, refreshWalletData]);

  const deductKesAmount = useCallback(
    (amountKes: string) => {
      const deduction = calculateUsdcDeduction(amountKes, marketRate);

      if (deduction > 0) {
        setUsdcBalance((previousBalance) => previousBalance - deduction);
      }
    },
    [marketRate]
  );

  const value = useMemo(
    () => ({
      deductKesAmount,
      fundWallet,
      intlPayments,
      marketRate,
      onlinePurchases,
      refreshWalletData,
      setIntlPayments,
      setOnlinePurchases,
      setUsdcBalance,
      usdcBalance,
    }),
    [
      deductKesAmount,
      fundWallet,
      intlPayments,
      marketRate,
      onlinePurchases,
      refreshWalletData,
      usdcBalance,
    ]
  );

  return <WalletContext.Provider value={value}>{children}</WalletContext.Provider>;
};
