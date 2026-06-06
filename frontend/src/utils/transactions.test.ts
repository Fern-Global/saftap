import { describe, expect, it } from "vitest";

import { mapApiTransaction } from "./transactions";

const baseTransaction = {
  amountKes: "1290.00",
  createdAt: "2026-06-06T10:00:00.000Z",
  id: "transaction-1",
  status: "COMPLETED",
};

describe("transaction mapping", () => {
  it("maps M-Pesa phone payments", () => {
    const transaction = mapApiTransaction({
      ...baseTransaction,
      destinationPhone: "+254700000001",
    });

    expect(transaction).toMatchObject({
      title: "M-Pesa +254700000001",
      amount: "- KES 1,290.00",
      type: "out",
      category: "Transfer",
    });
    expect(transaction.sub).toContain("COMPLETED");
  });

  it("maps till payments", () => {
    expect(
      mapApiTransaction({
        ...baseTransaction,
        destinationTill: "123456",
      })
    ).toMatchObject({
      title: "Till 123456",
      category: "Buy Goods",
    });
  });

  it("maps paybill payments with their account reference", () => {
    expect(
      mapApiTransaction({
        ...baseTransaction,
        accountRef: "INV-001",
        paybillNumber: "987654",
      })
    ).toMatchObject({
      title: "Paybill 987654 · INV-001",
      category: "Pay Bill",
    });
  });
});
