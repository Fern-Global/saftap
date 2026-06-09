import type { Transaction } from "../types/models";

type ApiTransaction = {
  accountRef?: string | null;
  amountKes: number | string;
  createdAt: string;
  darajaReceiptId?: string | null;
  darajaReceiverName?: string | null;
  destinationPhone?: string | null;
  destinationTill?: string | null;
  id: string;
  paybillNumber?: string | null;
  status: string;
};

const getStatusLabel = (status: string) => {
  if (["PENDING", "ON_CHAIN", "CONVERTING"].includes(status)) {
    return "Processing";
  }

  if (status === "COMPLETED") {
    return "Completed";
  }

  if (status === "FAILED") {
    return "Failed";
  }

  return status;
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
  const statusLabel = getStatusLabel(transaction.status);
  const formattedAmount = Number.isFinite(amountKes)
    ? amountKes.toLocaleString("en-US", {
        maximumFractionDigits: 2,
        minimumFractionDigits: 2,
      })
    : "0.00";

  if (transaction.destinationPhone) {
    return {
      amountKes,
      id: transaction.id,
      title: `M-Pesa ${transaction.destinationPhone}`,
      sub: `${formatTransactionDate(transaction.createdAt)} · ${statusLabel}`,
      amount: `- KES ${formattedAmount}`,
      type: "out",
      category: "Transfer",
      darajaReceiptId: transaction.darajaReceiptId ?? undefined,
      receiverName: transaction.darajaReceiverName ?? undefined,
      status: transaction.status,
    };
  }

  if (transaction.destinationTill) {
    return {
      amountKes,
      id: transaction.id,
      title: `Till ${transaction.destinationTill}`,
      sub: `${formatTransactionDate(transaction.createdAt)} · ${statusLabel}`,
      amount: `- KES ${formattedAmount}`,
      type: "out",
      category: "Buy Goods",
      darajaReceiptId: transaction.darajaReceiptId ?? undefined,
      receiverName: transaction.darajaReceiverName ?? undefined,
      status: transaction.status,
    };
  }

  const accountLabel = transaction.accountRef ? ` · ${transaction.accountRef}` : "";

  return {
    amountKes,
    id: transaction.id,
    title: `Paybill ${transaction.paybillNumber ?? "payment"}${accountLabel}`,
    sub: `${formatTransactionDate(transaction.createdAt)} · ${statusLabel}`,
    amount: `- KES ${formattedAmount}`,
    type: "out",
    category: "Pay Bill",
    darajaReceiptId: transaction.darajaReceiptId ?? undefined,
    receiverName: transaction.darajaReceiverName ?? undefined,
    status: transaction.status,
  };
};
