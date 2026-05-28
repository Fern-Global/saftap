import { CdpClient } from "@coinbase/cdp-sdk";
import { Prisma, TransactionStatus, type Transaction } from "@prisma/client";
import {
  createPublicClient,
  encodeFunctionData,
  http,
  isAddress,
  parseUnits,
  type Address,
  type Hex,
} from "viem";
import { baseSepolia } from "viem/chains";
import { prisma } from "../../lib/prisma.js";
import { AppError, BadRequestError, InsufficientFundsError } from "../../shared/errors.js";
import { darajaService } from "../mpesa/daraja.service.js";
import type { InitiatePaymentParams } from "./payment.types.js";

const DEFAULT_EXCHANGE_RATE_URL = "https://open.er-api.com/v6/latest/USD";
const DEFAULT_BASE_SEPOLIA_USDC_ADDRESS = "0x036CbD53842c5426634e7929541eC2318f3dCF7e";
const USDC_DECIMALS = 6;

const usdcTransferAbi = [
  {
    name: "transfer",
    type: "function",
    stateMutability: "nonpayable",
    inputs: [
      { name: "to", type: "address" },
      { name: "amount", type: "uint256" },
    ],
    outputs: [{ name: "success", type: "bool" }],
  },
] as const;

const cdp = new CdpClient();

const publicClient = createPublicClient({
  chain: baseSepolia,
  transport: http(process.env.BASE_SEPOLIA_RPC_URL ?? baseSepolia.rpcUrls.default.http[0]),
});

function getRequiredEnv(name: string): string {
  const value = process.env[name];

  if (!value) {
    throw new AppError(`${name} is required`, 500);
  }

  return value;
}

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

function getDarajaReceiptId(response: unknown): string | undefined {
  if (typeof response !== "object" || response === null) {
    return undefined;
  }

  const result = response as Record<string, unknown>;
  const receipt = result.receiptId ?? result.ReceiptNumber ?? result.CheckoutRequestID;

  return typeof receipt === "string" ? receipt : undefined;
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
    const response = await fetch(url);

    if (!response.ok) {
      throw new AppError(`Exchange rate API returned ${response.status}`, 502);
    }

    return extractKesRate(await response.json());
  } catch (error) {
    if (error instanceof AppError) {
      throw error;
    }

    throw new AppError("Failed to fetch USD/KES exchange rate", 502);
  }
}

async function executeUsdcTransferImpl(
  fromAddress: string,
  toAddress: string,
  amountUSDC: number
): Promise<string> {
  assertAddress(fromAddress, "fromAddress");
  assertAddress(toAddress, "toAddress");

  const usdcContractAddress =
    process.env.USDC_CONTRACT_ADDRESS ?? DEFAULT_BASE_SEPOLIA_USDC_ADDRESS;
  assertAddress(usdcContractAddress, "USDC_CONTRACT_ADDRESS");

  try {
    const account = await cdp.evm.getAccount({ address: fromAddress });
    const data = encodeFunctionData({
      abi: usdcTransferAbi,
      functionName: "transfer",
      args: [toAddress, parseUnits(normalizeUsdcAmount(amountUSDC), USDC_DECIMALS)],
    });

    const result = await cdp.evm.sendTransaction({
      address: account.address,
      network: "base-sepolia",
      transaction: {
        to: usdcContractAddress,
        data,
      },
    });

    await publicClient.waitForTransactionReceipt({ hash: result.transactionHash as Hex });

    return result.transactionHash;
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
    throw new BadRequestError("Tourist wallet was not found");
  }

  const requestedAmount = new Prisma.Decimal(params.amountUsdc);

  if (wallet.usdcBalance.lt(requestedAmount)) {
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
    const settlementAddress = getRequiredEnv("TREASURY_WALLET_ADDRESS");
    const txHash = await paymentService.executeUsdcTransfer(
      wallet.baseAddress,
      settlementAddress,
      params.amountUsdc
    );

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
          usdcBalance: {
            decrement: requestedAmount,
          },
        },
      }),
    ]);

    const darajaResponse =
      params.destinationTill || params.paybillNumber
        ? await darajaService.sendToTill({
            amountKes: amountKes.toNumber(),
            tillNumber: params.destinationTill ?? params.paybillNumber ?? "",
            accountRef: params.accountRef,
            transactionId: transaction.id,
          })
        : await darajaService.sendToMpesa({
            amountKes: amountKes.toNumber(),
            phoneNumber: params.destinationPhone ?? "",
            recipientLabel: params.destinationPhone ?? "Tourist payout",
            transactionId: transaction.id,
          });

    return await prisma.transaction.update({
      where: { id: transaction.id },
      data: {
        darajaReceiptId: getDarajaReceiptId(darajaResponse),
        status: TransactionStatus.COMPLETED,
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
