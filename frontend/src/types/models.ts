export type TransactionType = "in" | "out";

export type Transaction = {
  amountKes: number;
  id: string;
  title: string;
  sub: string;
  amount: string;
  type: TransactionType;
  category: string;
  darajaReceiptId?: string;
  receiverName?: string;
  status: string;
};

export type AuthUser = {
  id?: string;
  email?: string;
  phone?: string;
  walletAddress?: string;
};

export type AuthDestination = "home" | "verify_2fa";
