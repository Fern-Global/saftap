import { decodeEventLog, isAddress, type Address, type Hex } from "viem";
import { getRequiredEnv } from "../config/env.js";
import { AppError } from "../lib/app-error.js";
import { prisma } from "../lib/prisma.js";
import { darajaService } from "../modules/mpesa/daraja.service.js";
import { publicClient } from "./client.js";
import { watchIncomingUsdc, type IncomingUsdcTransfer } from "./events.js";
import { BASE_SEPOLIA_USDC_ADDRESS, usdcAbi } from "./usdc.js";

const POLL_INTERVAL_MS = 5_000;
const STUCK_ON_CHAIN_MS = 30_000;

let cleanupWatcher: (() => void) | undefined;
let pollingTimer: NodeJS.Timeout | undefined;

function assertAddress(address: string, label: string): asserts address is Address {
  if (!isAddress(address)) {
    throw new AppError(`${label} must be a valid EVM address`, 500, "INVALID_ADDRESS");
  }
}

function getSettlementAddress(): Address {
  const settlementAddress = getRequiredEnv("SETTLEMENT_WALLET_ADDRESS");
  assertAddress(settlementAddress, "SETTLEMENT_WALLET_ADDRESS");

  return settlementAddress;
}

async function handleIncomingTransfer({
  from,
  amount,
  txHash,
}: IncomingUsdcTransfer): Promise<void> {
  const tx = await prisma.transaction.findFirst({
    where: {
      baseTxHash: txHash,
      status: "ON_CHAIN",
    },
  });

  if (!tx) {
    console.warn(`No ON_CHAIN transaction found for Base tx ${txHash}`);
    return;
  }

  console.log(
    `Processing incoming USDC transfer ${txHash} from ${from} for ${amount.toString()} units`
  );

  await prisma.transaction.update({
    where: { id: tx.id },
    data: { status: "CONVERTING" },
  });

  try {
    const payoutResult = tx.destinationPhone
      ? await darajaService.sendToMpesa({
          phoneNumber: tx.destinationPhone,
          amountKes: tx.amountKes.toNumber(),
          transactionId: tx.id,
          recipientLabel: "Tourist payout",
        })
      : tx.destinationTill
        ? await darajaService.sendToTill({
            tillNumber: tx.destinationTill,
            amountKes: tx.amountKes.toNumber(),
            transactionId: tx.id,
          })
        : undefined;

    if (!payoutResult) {
      throw new Error(`Transaction ${tx.id} has no payout destination`);
    }

    await prisma.transaction.update({
      where: { id: tx.id },
      data: {
        status: "COMPLETED",
        darajaReceiptId: payoutResult.ConversationID ?? payoutResult.OriginatorConversationID,
      },
    });
  } catch (error) {
    console.error(`Daraja payout failed for transaction ${tx.id}`, error);

    await prisma.transaction.update({
      where: { id: tx.id },
      data: { status: "FAILED" },
    });
  }
}

async function replayConfirmedTransfer(
  baseTxHash: string,
  settlementAddress: Address
): Promise<void> {
  const receipt = await publicClient.getTransactionReceipt({ hash: baseTxHash as Hex });

  if (receipt.status !== "success") {
    return;
  }

  const normalizedSettlementAddress = settlementAddress.toLowerCase();

  for (const log of receipt.logs) {
    if (log.address.toLowerCase() !== BASE_SEPOLIA_USDC_ADDRESS.toLowerCase()) {
      continue;
    }

    try {
      const decoded = decodeEventLog({
        abi: usdcAbi,
        data: log.data,
        topics: log.topics,
      });

      if (decoded.eventName !== "Transfer") {
        continue;
      }

      const { from, to, value } = decoded.args;

      if (to.toLowerCase() === normalizedSettlementAddress) {
        await handleIncomingTransfer({
          from,
          amount: value,
          txHash: baseTxHash as Hex,
        });
        return;
      }
    } catch {
      continue;
    }
  }
}

async function pollStuckOnChainTransactions(settlementAddress: Address): Promise<void> {
  const stuckBefore = new Date(Date.now() - STUCK_ON_CHAIN_MS);
  const transactions = await prisma.transaction.findMany({
    where: {
      status: "ON_CHAIN",
      updatedAt: {
        lt: stuckBefore,
      },
      baseTxHash: {
        not: null,
      },
    },
  });

  for (const tx of transactions) {
    if (!tx.baseTxHash) {
      continue;
    }

    try {
      await replayConfirmedTransfer(tx.baseTxHash, settlementAddress);
    } catch (error) {
      console.warn(`Failed to poll Base receipt for transaction ${tx.id}`, error);
    }
  }
}

/**
 * Starts the blockchain monitor and returns a function to stop it.
 */
export function startMonitor(): () => void {
  if (cleanupWatcher || pollingTimer) {
    return stopMonitor;
  }

  const settlementAddress = getSettlementAddress();

  cleanupWatcher = watchIncomingUsdc(settlementAddress, (transfer) => {
    void handleIncomingTransfer(transfer).catch((error) => {
      console.error(`Failed to handle incoming USDC transfer ${transfer.txHash}`, error);
    });
  });

  pollingTimer = setInterval(() => {
    void pollStuckOnChainTransactions(settlementAddress).catch((error) => {
      console.error("USDC polling fallback failed", error);
    });
  }, POLL_INTERVAL_MS);

  console.log(`Started USDC monitor for settlement wallet ${settlementAddress}`);

  return stopMonitor;
}

/**
 * Stops the blockchain monitor if it is running.
 */
export function stopMonitor(): void {
  cleanupWatcher?.();

  if (pollingTimer) {
    clearInterval(pollingTimer);
  }

  cleanupWatcher = undefined;
  pollingTimer = undefined;
}
