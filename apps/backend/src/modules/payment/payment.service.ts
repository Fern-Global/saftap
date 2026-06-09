import { Prisma, TransactionStatus, type Transaction } from "@prisma/client";
import { isAddress, type Address } from "viem";
import { env } from "../../config/env.js";
import { prisma } from "../../lib/prisma.js";
import { AppError, BadRequestError, InsufficientFundsError } from "../../shared/errors.js";
import { darajaService } from "../mpesa/daraja.service.js";
import { getUsdcBalance, signUsdcTransfer } from "../wallet/wallet.service.js";
import type { InitiatePaymentParams } from "./payment.types.js";

const DEFAULT_EXCHANGE_RATE_URL = "https://open.er-api.com/v6/latest/USD";
const EXCHANGE_RATE_MAX_STALE_MS = 15 * 60 * 1_000;
const EXCHANGE_RATE_TIMEOUT_MS = 5_000;
const USDC_DECIMALS = 6;

let cachedExchangeRate: { rate: number; fetchedAt: number } | null = null;

function assertAddress(address: string, label: string): asserts address is Address {
  if (!isAddress(address)) {
    throw new BadRequestError(`${label} must be a valid EVM address`);
  }
}

function normalizeUsdcAmount(amountUSDC: number): string {
  if (!Number.isFinite(amountUSDC) || amountUSDC <= 0) {
    throw new BadRequestError("amountUsdc must be greater than zero");
  }

  return amountUSDC.toFixed(USDC_DECIMALS).replace(/\.?0+$/, "");
}

function extractKesRate(payload: unknown): number {
  if (
    typeof payload === "object" &&
    payload !== null &&
    "rates" in payload &&
    typeof payload.rates === "object" &&
    payload.rates !== null &&
    "KES" in payload.rates
  ) {
    const rate = Number(payload.rates.KES);

    if (Number.isFinite(rate) && rate > 0) {
      return rate;
    }
  }

  throw new AppError("USD/KES exchange rate was not available", 502);
}

function validateDestination(params: InitiatePaymentParams): void {
  const destinationCount = [
    params.destinationPhone,
    params.destinationTill,
    params.paybillNumber,
  ].filter((value) => value !== undefined && value.trim().length > 0).length;

  if (destinationCount !== 1) {
    throw new BadRequestError(
      "Provide exactly one destination: destinationPhone, destinationTill, or paybillNumber"
    );
  }

  if (params.paybillNumber && !params.accountRef?.trim()) {
    throw new BadRequestError("accountRef is required when paybillNumber is provided");
  }
}

async function markTransactionFailed(transactionId: string): Promise<void> {
  await prisma.transaction.update({
    where: { id: transactionId },
    data: { status: TransactionStatus.FAILED },
  });
}

async function getExchangeRateImpl(): Promise<number> {
  const url = process.env.EXCHANGE_RATE_API_URL ?? DEFAULT_EXCHANGE_RATE_URL;

  try {
    const response = await fetch(url, {
      signal: AbortSignal.timeout(EXCHANGE_RATE_TIMEOUT_MS),
    });

    if (!response.ok) {
      throw new AppError(`Exchange rate API returned ${response.status}`, 502);
    }

    const rate = extractKesRate(await response.json());
    cachedExchangeRate = { rate, fetchedAt: Date.now() };

    return rate;
  } catch (error) {
    if (
      cachedExchangeRate !== null &&
      Date.now() - cachedExchangeRate.fetchedAt <= EXCHANGE_RATE_MAX_STALE_MS
    ) {
      console.warn("Exchange rate provider unavailable; using the last successful rate.");
      return cachedExchangeRate.rate;
    }

    if (error instanceof AppError) {
      throw error;
    }

    throw new AppError("Failed to fetch USD/KES exchange rate", 502);
  }
}

async function executeUsdcTransferImpl(
  wallet: {
    baseAddress: string;
    cdpWalletId: string | null;
    encryptedKey: string | null;
  },
  toAddress: string,
  amountUSDC: number
): Promise<string> {
  assertAddress(wallet.baseAddress, "wallet.baseAddress");
  assertAddress(toAddress, "toAddress");
  normalizeUsdcAmount(amountUSDC);

  try {
    return await signUsdcTransfer(wallet, toAddress, amountUSDC);
  } catch (error) {
    if (error instanceof AppError) {
      throw error;
    }

    throw new AppError("Failed to execute USDC transfer", 502);
  }
}

async function initiatePaymentImpl(params: InitiatePaymentParams): Promise<Transaction> {
  validateDestination(params);
  normalizeUsdcAmount(params.amountUsdc);

  const wallet = await prisma.wallet.findUnique({
    where: { userId: params.touristId },
  });

  if (!wallet) {
    throw new BadRequestError("Wallet was not found");
  }

  const onChainBalance = new Prisma.Decimal(await getUsdcBalance(wallet.baseAddress));
  const requestedAmount = new Prisma.Decimal(params.amountUsdc);

  if (onChainBalance.lt(requestedAmount)) {
    throw new InsufficientFundsError();
  }

  const exchangeRate = await paymentService.getExchangeRate();
  const amountKes = requestedAmount.mul(exchangeRate);

  const transaction = await prisma.transaction.create({
    data: {
      userId: params.touristId,
      destinationPhone: params.destinationPhone,
      destinationTill: params.destinationTill,
      paybillNumber: params.paybillNumber,
      accountRef: params.accountRef,
      savedPayeeId: params.savedPayeeId,
      amountUsdc: requestedAmount,
      amountKes,
      exchangeRate: new Prisma.Decimal(exchangeRate),
      status: TransactionStatus.PENDING,
    },
  });
  try {
    const settlementAddress = env.TREASURY_WALLET_ADDRESS;

    if (!settlementAddress) {
      throw new AppError("TREASURY_WALLET_ADDRESS is required", 500);
    }

    const txHash = await paymentService.executeUsdcTransfer(
      wallet,
      settlementAddress,
      params.amountUsdc
    );
    const remainingBalance = await getUsdcBalance(wallet.baseAddress);

    await prisma.$transaction([
      prisma.transaction.update({
        where: { id: transaction.id },
        data: {
          baseTxHash: txHash,
          status: TransactionStatus.ON_CHAIN,
        },
      }),
      prisma.wallet.update({
        where: { id: wallet.id },
        data: {
          usdcBalance: remainingBalance,
        },
      }),
    ]);

    await (params.destinationTill || params.paybillNumber
      ? darajaService.sendToTill({
          amountKes: amountKes.toNumber(),
          tillNumber: params.destinationTill ?? params.paybillNumber ?? "",
          accountRef: params.accountRef,
          transactionId: transaction.id,
        })
      : darajaService.sendToMpesa({
          amountKes: amountKes.toNumber(),
          phoneNumber: params.destinationPhone ?? "",
          recipientLabel: params.destinationPhone ?? "Tourist payout",
          transactionId: transaction.id,
        }));

    return await prisma.transaction.update({
      where: { id: transaction.id },
      data: {
        status: TransactionStatus.CONVERTING,
      },
    });
  } catch (error) {
    await markTransactionFailed(transaction.id);

    if (error instanceof AppError) {
      throw error;
    }

    throw new AppError("Payment initiation failed", 500);
  }
}

async function getTransactionHistoryImpl(userId: string): Promise<Transaction[]> {
  return prisma.transaction.findMany({
    where: { userId },
    orderBy: { createdAt: "desc" },
    take: 20,
    include: {
      savedPayee: true,
    },
  });
}

/**
 * Grouped payment service methods for rate lookup, transfer execution, and history retrieval.
 */
export const paymentService = {
  getExchangeRate: getExchangeRateImpl,
  executeUsdcTransfer: executeUsdcTransferImpl,
  initiatePayment: initiatePaymentImpl,
  getTransactionHistory: getTransactionHistoryImpl,
};

/**
 * Gets the current USDC/fiat exchange rate.
 */
export const getExchangeRate = paymentService.getExchangeRate;
/**
 * Executes a USDC transfer on-chain as part of payment settlement.
 */
export const executeUsdcTransfer = paymentService.executeUsdcTransfer;
/**
 * Initiates a payment flow and settles funds via USDC transfer.
 */
export const initiatePayment = paymentService.initiatePayment;
/**
 * Retrieves transaction history for a user.
 */
export const getTransactionHistory = paymentService.getTransactionHistory;
