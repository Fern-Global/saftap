import { formatUnits, isAddress, parseUnits, type Address, type Hex } from "viem";
import { privateKeyToAccount } from "viem/accounts";
import { getRequiredEnv } from "../config/env.js";
import { AppError, wrapExternalError } from "../lib/app-error.js";
import { publicClient, walletClient } from "./client.js";
import { getRuntimeNetwork } from "./network.js";
import { usdcAbi } from "./usdc-contract.js";

export { usdcAbi } from "./usdc-contract.js";

export const USDC_ADDRESS = getRuntimeNetwork().usdcAddress;

function assertAddress(address: string, label: string): asserts address is Address {
  if (!isAddress(address)) {
    throw new AppError(`${label} must be a valid EVM address`, 400, "INVALID_ADDRESS");
  }
}

function getTransferAccount(from: Address) {
  const privateKey = getRequiredEnv("SETTLEMENT_WALLET_PRIVATE_KEY");
  const normalizedPrivateKey = privateKey.startsWith("0x") ? privateKey : `0x${privateKey}`;
  const account = privateKeyToAccount(normalizedPrivateKey as Hex);

  if (account.address.toLowerCase() !== from.toLowerCase()) {
    throw new AppError(
      "SETTLEMENT_WALLET_PRIVATE_KEY does not match transfer sender",
      500,
      "SETTLEMENT_ADDRESS_MISMATCH"
    );
  }

  return account;
}

export async function getUsdcBalance(address: string): Promise<string> {
  assertAddress(address, "address");

  try {
    const balance = await publicClient.readContract({
      address: USDC_ADDRESS,
      abi: usdcAbi,
      functionName: "balanceOf",
      args: [address],
    });

    return formatUsdc(balance);
  } catch (error) {
    throw wrapExternalError("Failed to fetch USDC balance", "USDC_BALANCE_FAILED", error);
  }
}

/**
 * Formats a raw USDC value from smallest units into a display string.
 */
export function formatUsdc(amount: bigint): string {
  return formatUnits(amount, 6);
}

/**
 * Parses a decimal USDC string into smallest-unit integer representation.
 */
export function parseUsdc(amount: string): bigint {
  return parseUnits(amount, 6);
}

export async function transferUsdc(from: string, to: string, amount: bigint): Promise<string> {
  assertAddress(from, "from");
  assertAddress(to, "to");

  if (amount <= 0n) {
    throw new AppError("amount must be greater than zero", 400, "INVALID_AMOUNT");
  }

  try {
    const account = getTransferAccount(from);

    return await walletClient.writeContract({
      account,
      address: USDC_ADDRESS,
      abi: usdcAbi,
      functionName: "transfer",
      args: [to, amount],
      chain: getRuntimeNetwork().chain,
    });
  } catch (error) {
    throw wrapExternalError("Failed to transfer USDC", "USDC_TRANSFER_FAILED", error);
  }
}

export async function waitForTransfer(txHash: string): Promise<void> {
  await publicClient.waitForTransactionReceipt({ hash: txHash as Hex });
}
