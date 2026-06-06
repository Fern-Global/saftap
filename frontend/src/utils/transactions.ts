import type { Transaction } from "../types/models";

type ApiTransaction = {
  accountRef?: string | null;
  amountKes: number | string;
  createdAt: string;
  destinationPhone?: string | null;
  destinationTill?: string | null;
  id: string;
  paybillNumber?: string | null;
  status: string;
};

const formatTransactionDate = (createdAt: string) => {
  const date = new Date(createdAt);

  if (Number.isNaN(date.getTime())) {
    return "Unknown date";
  }

  const dateLabel = date.toLocaleDateString("en-US", {
    day: "numeric",
    month: "short",
  });
  const timeLabel = date.toLocaleTimeString("en-US", {
    hour: "2-digit",
    minute: "2-digit",
  });

  return `${dateLabel} · ${timeLabel}`;
};

export const mapApiTransaction = (transaction: ApiTransaction): Transaction => {
  const amountKes = Number(transaction.amountKes);
  const formattedAmount = Number.isFinite(amountKes)
    ? amountKes.toLocaleString("en-US", {
        maximumFractionDigits: 2,
        minimumFractionDigits: 2,
      })
    : "0.00";

  if (transaction.destinationPhone) {
    return {
      id: transaction.id,
      title: `M-Pesa ${transaction.destinationPhone}`,
      sub: `${formatTransactionDate(transaction.createdAt)} · ${transaction.status}`,
      amount: `- KES ${formattedAmount}`,
      type: "out",
      category: "Transfer",
    };
  }

  if (transaction.destinationTill) {
    return {
      id: transaction.id,
      title: `Till ${transaction.destinationTill}`,
      sub: `${formatTransactionDate(transaction.createdAt)} · ${transaction.status}`,
      amount: `- KES ${formattedAmount}`,
      type: "out",
      category: "Buy Goods",
    };
  }

  const accountLabel = transaction.accountRef ? ` · ${transaction.accountRef}` : "";

  return {
    id: transaction.id,
    title: `Paybill ${transaction.paybillNumber ?? "payment"}${accountLabel}`,
    sub: `${formatTransactionDate(transaction.createdAt)} · ${transaction.status}`,
    amount: `- KES ${formattedAmount}`,
    type: "out",
    category: "Pay Bill",
  };
};
