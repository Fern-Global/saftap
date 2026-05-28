import { formatUnits, isAddress, parseUnits, type Address, type Hex } from "viem";
import { privateKeyToAccount } from "viem/accounts";
import { baseSepolia } from "viem/chains";
import { getOptionalEnv, getRequiredEnv } from "../config/env.js";
import { AppError, wrapExternalError } from "../lib/app-error.js";
import { publicClient, walletClient } from "./client.js";

/**
 * On-chain USDC contract address used for Sepolia network operations.
 */
export const BASE_SEPOLIA_USDC_ADDRESS = getOptionalEnv(
  "BASE_SEPOLIA_USDC_ADDRESS",
  "0x036CbD53842c5426634e7929541eC2318f3dCF7e"
) as Address;

/**
 * Minimal ERC-20 ABI used for USDC balance and transfer contract calls.
 */
export const usdcAbi = [
  {
    type: "function",
    name: "balanceOf",
    stateMutability: "view",
    inputs: [{ name: "account", type: "address" }],
    outputs: [{ name: "balance", type: "uint256" }],
  },
  {
    type: "function",
    name: "transfer",
    stateMutability: "nonpayable",
    inputs: [
      { name: "to", type: "address" },
      { name: "amount", type: "uint256" },
    ],
    outputs: [{ name: "success", type: "bool" }],
  },
  {
    type: "function",
    name: "decimals",
    stateMutability: "view",
    inputs: [],
    outputs: [{ name: "decimals", type: "uint8" }],
  },
  {
    type: "function",
    name: "symbol",
    stateMutability: "view",
    inputs: [],
    outputs: [{ name: "symbol", type: "string" }],
  },
  {
    type: "event",
    name: "Transfer",
    inputs: [
      { name: "from", type: "address", indexed: true },
      { name: "to", type: "address", indexed: true },
      { name: "value", type: "uint256", indexed: false },
    ],
  },
] as const;

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
      address: BASE_SEPOLIA_USDC_ADDRESS,
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
      address: BASE_SEPOLIA_USDC_ADDRESS,
      abi: usdcAbi,
      functionName: "transfer",
      args: [to, amount],
      chain: baseSepolia,
    });
  } catch (error) {
    throw wrapExternalError("Failed to transfer USDC", "USDC_TRANSFER_FAILED", error);
  }
}

export async function waitForTransfer(txHash: string): Promise<void> {
  await publicClient.waitForTransactionReceipt({ hash: txHash as Hex });
}
