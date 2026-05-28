import { Prisma, TransactionStatus, type Transaction, type Wallet } from "@prisma/client";
import { beforeEach, describe, expect, it, vi } from "vitest";
import type { InitiatePaymentParams } from "./payment.types.js";

const prismaMock = vi.hoisted(() => ({
  wallet: {
    findUnique: vi.fn(),
    update: vi.fn(),
  },
  transaction: {
    create: vi.fn(),
    findMany: vi.fn(),
    update: vi.fn(),
  },
  $transaction: vi.fn(),
}));

const darajaServiceMock = vi.hoisted(() => ({
  sendToMpesa: vi.fn(),
  sendToTill: vi.fn(),
}));

vi.mock("../../lib/prisma.js", () => ({
  prisma: prismaMock,
}));

vi.mock("../mpesa/daraja.service.js", () => ({
  darajaService: darajaServiceMock,
}));

vi.mock("@coinbase/cdp-sdk", () => ({
  CdpClient: vi.fn(() => ({
    evm: {
      getAccount: vi.fn(),
      sendTransaction: vi.fn(),
    },
  })),
}));

const { paymentService } = await import("./payment.service.js");

const touristId = "7ab52f4e-4ac8-4bb8-8190-af6b6026de09";
const savedPayeeId = "e412f70d-b52b-4df7-8794-ae71be95d777";

const wallet: Wallet = {
  id: "a5de7f5d-2c8b-447a-88f8-07c2f9327e8e",
  userId: touristId,
  baseAddress: "0x742d35Cc6634C0532925a3b844Bc454e4438f44e",
  encryptedKey: null,
  cdpWalletId: "cdp-wallet-sepolia-demo-001",
  usdcBalance: new Prisma.Decimal("50"),
  createdAt: new Date("2026-01-01T10:00:00.000Z"),
  updatedAt: new Date("2026-01-01T10:00:00.000Z"),
};

const baseTransaction: Transaction = {
  id: "f4e3464b-d5f8-41dd-baba-bfd4ef2e84b3",
  userId: touristId,
  destinationPhone: null,
  destinationTill: null,
  paybillNumber: null,
  accountRef: null,
  savedPayeeId: null,
  amountUsdc: new Prisma.Decimal("10"),
  amountKes: new Prisma.Decimal("1290"),
  exchangeRate: new Prisma.Decimal("129"),
  baseTxHash: null,
  darajaReceiptId: null,
  status: TransactionStatus.PENDING,
  createdAt: new Date("2026-01-01T10:00:00.000Z"),
  updatedAt: new Date("2026-01-01T10:00:00.000Z"),
};

function arrangeSuccessfulPayment(): void {
  prismaMock.wallet.findUnique.mockResolvedValue(wallet);
  prismaMock.transaction.create.mockImplementation(async ({ data }) => ({
    ...baseTransaction,
    ...data,
  }));
  prismaMock.transaction.update.mockImplementation(async ({ data }) => ({
    ...baseTransaction,
    ...data,
  }));
  prismaMock.wallet.update.mockResolvedValue(wallet);
  prismaMock.$transaction.mockImplementation(async (operations: Array<Promise<unknown>>) =>
    Promise.all(operations)
  );
  darajaServiceMock.sendToMpesa.mockResolvedValue({ receiptId: "mpesa-receipt-001" });
  darajaServiceMock.sendToTill.mockResolvedValue({ receiptId: "till-receipt-001" });
  vi.spyOn(paymentService, "getExchangeRate").mockResolvedValue(129);
  vi.spyOn(paymentService, "executeUsdcTransfer").mockResolvedValue(
    "0xabc1230000000000000000000000000000000000000000000000000000000000"
  );
}

describe("payment service", () => {
  beforeEach(() => {
    process.env.TREASURY_WALLET_ADDRESS = "0x4252e0c9A3da5A2700e7d91cb50aEf522D0C6Fe8";
    vi.restoreAllMocks();
    vi.clearAllMocks();
    arrangeSuccessfulPayment();
  });

  it.each<InitiatePaymentParams>([
    {
      touristId,
      destinationPhone: "+254700000001",
      amountUsdc: 10,
    },
    {
      touristId,
      destinationTill: "123456",
      amountUsdc: 10,
      savedPayeeId,
    },
    {
      touristId,
      paybillNumber: "987654",
      accountRef: "INV-001",
      amountUsdc: 10,
    },
  ])("accepts exactly one destination %#", async (params) => {
    const result = await paymentService.initiatePayment(params);

    expect(result.status).toBe(TransactionStatus.COMPLETED);
    expect(prismaMock.transaction.create).toHaveBeenCalledWith({
      data: expect.objectContaining({
        userId: touristId,
        destinationPhone: params.destinationPhone,
        destinationTill: params.destinationTill,
        paybillNumber: params.paybillNumber,
        accountRef: params.accountRef,
        savedPayeeId: params.savedPayeeId,
        status: TransactionStatus.PENDING,
      }),
    });
    expect(paymentService.executeUsdcTransfer).toHaveBeenCalledWith(
      wallet.baseAddress,
      process.env.TREASURY_WALLET_ADDRESS,
      params.amountUsdc
    );
  });

  it("routes phone payments to sendToMpesa", async () => {
    await paymentService.initiatePayment({
      touristId,
      destinationPhone: "+254700000001",
      amountUsdc: 10,
    });

    expect(darajaServiceMock.sendToMpesa).toHaveBeenCalledWith(
      expect.objectContaining({
        phoneNumber: "+254700000001",
      })
    );
    expect(darajaServiceMock.sendToTill).not.toHaveBeenCalled();
  });

  it.each<InitiatePaymentParams>([
    {
      touristId,
      destinationTill: "123456",
      amountUsdc: 10,
    },
    {
      touristId,
      paybillNumber: "987654",
      accountRef: "INV-001",
      amountUsdc: 10,
    },
  ])("routes till and paybill payments to sendToTill %#", async (params) => {
    await paymentService.initiatePayment(params);

    expect(darajaServiceMock.sendToTill).toHaveBeenCalledTimes(1);
    expect(darajaServiceMock.sendToMpesa).not.toHaveBeenCalled();
  });

  it.each<InitiatePaymentParams>([
    {
      touristId,
      amountUsdc: 10,
    },
    {
      touristId,
      destinationPhone: "+254700000001",
      destinationTill: "123456",
      amountUsdc: 10,
    },
    {
      touristId,
      destinationPhone: "+254700000001",
      paybillNumber: "987654",
      accountRef: "INV-001",
      amountUsdc: 10,
    },
    {
      touristId,
      destinationTill: "123456",
      paybillNumber: "987654",
      accountRef: "INV-001",
      amountUsdc: 10,
    },
  ])("rejects missing or competing destinations %#", async (params) => {
    await expect(paymentService.initiatePayment(params)).rejects.toMatchObject({
      statusCode: 400,
      message:
        "Provide exactly one destination: destinationPhone, destinationTill, or paybillNumber",
    });
    expect(prismaMock.wallet.findUnique).not.toHaveBeenCalled();
    expect(paymentService.executeUsdcTransfer).not.toHaveBeenCalled();
  });

  it("requires accountRef for paybill payments", async () => {
    await expect(
      paymentService.initiatePayment({
        touristId,
        paybillNumber: "987654",
        amountUsdc: 10,
      })
    ).rejects.toMatchObject({
      statusCode: 400,
      message: "accountRef is required when paybillNumber is provided",
    });
    expect(prismaMock.wallet.findUnique).not.toHaveBeenCalled();
    expect(paymentService.executeUsdcTransfer).not.toHaveBeenCalled();
  });
});
