export type TransactionType = "in" | "out";

export type Transaction = {
  id: string;
  title: string;
  sub: string;
  amount: string;
  type: TransactionType;
  category: string;
};

export type AuthUser = {
  id?: string;
  email?: string;
  phone?: string;
  walletAddress?: string;
};

export type AuthDestination = "home" | "verify_2fa";
