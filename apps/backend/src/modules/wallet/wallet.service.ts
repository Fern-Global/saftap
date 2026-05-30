import { CdpClient } from "@coinbase/cdp-sdk";
import {
  createPublicClient,
  createWalletClient,
  http,
  isAddress,
  parseUnits,
  type Address,
  type Hex,
} from "viem";
import { privateKeyToAccount } from "viem/accounts";
import { baseSepolia } from "viem/chains";
import { getOptionalEnv, getRequiredEnv } from "../../config/env.js";
import { AppError, wrapExternalError } from "../../lib/app-error.js";
import { prisma } from "../../lib/prisma.js";

/**
 * Result data returned when a new wallet is created for a merchant or tourist.
 */
export interface CreateWalletResult {
  address: Address;
  cdpWalletId: string;
}

/**
 * Formatted USDC balance string returned by wallet balance lookups.
 */
export type UsdcBalanceResult = string;

/**
 * Transaction hash returned when funding a wallet from treasury.
 */
export type FundFromTreasuryResult = Hex;

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
] as const;

/**
 * Public blockchain client for Sepolia read-only operations.
 */
export const publicClient = createPublicClient({
  chain: baseSepolia,
  transport: http(getOptionalEnv("BASE_SEPOLIA_RPC_URL", baseSepolia.rpcUrls.default.http[0])),
});

function getTreasuryAccount() {
  const privateKey = getRequiredEnv("TREASURY_PRIVATE_KEY");

  return privateKeyToAccount(privateKey.startsWith("0x") ? (privateKey as Hex) : `0x${privateKey}`);
}

/**
 * Creates a wallet client using the treasury account for sending funds.
 */
export function getWalletClient() {
  return createWalletClient({
    account: getTreasuryAccount(),
    chain: baseSepolia,
    transport: http(getOptionalEnv("BASE_SEPOLIA_RPC_URL", baseSepolia.rpcUrls.default.http[0])),
  });
}

const cdp = new CdpClient();

type CdpEvmAccount = {
  address: Address;
  id?: string;
  walletId?: string;
  cdpWalletId?: string;
};

function assertAddress(address: string, label: string): asserts address is Address {
  if (!isAddress(address)) {
    throw new AppError(`${label} must be a valid EVM address`, 400, "INVALID_ADDRESS");
  }
}

function getCdpWalletId(account: CdpEvmAccount): string {
  return account.cdpWalletId ?? account.walletId ?? account.id ?? account.address;
}

function formatUsdcBalance(balance: bigint): string {
  const decimals = 6n;
  const divisor = 10n ** decimals;
  const whole = balance / divisor;
  const fractional = balance % divisor;
  const trimmedFractional = fractional
    .toString()
    .padStart(Number(decimals), "0")
    .replace(/0+$/, "");
  const displayFractional = trimmedFractional.padEnd(2, "0");

  return `${whole.toString()}.${displayFractional}`;
}

function toUsdcAmount(amountUSDC: number): bigint {
  const normalizedAmount = amountUSDC.toFixed(6).replace(/\.?0+$/, "");
  const amount = parseUnits(normalizedAmount, 6);

  if (amount === 0n) {
    throw new AppError("amountUSDC is below the minimum USDC unit", 400, "INVALID_AMOUNT");
  }

  return amount;
}

export async function createWallet(userId: string): Promise<CreateWalletResult> {
  if (!userId.trim()) {
    throw new AppError("userId is required", 400, "INVALID_USER_ID");
  }

  try {
    const account = (await cdp.evm.createAccount()) as CdpEvmAccount;
    assertAddress(account.address, "CDP account address");

    const cdpWalletId = getCdpWalletId(account);

    await prisma.wallet.create({
      data: {
        userId,
        baseAddress: account.address,
        cdpWalletId,
      },
    });

    return {
      address: account.address,
      cdpWalletId,
    };
  } catch (error) {
    throw wrapExternalError("Failed to create CDP wallet", "WALLET_CREATE_FAILED", error);
  }
}

export async function getUsdcBalance(walletAddress: string): Promise<UsdcBalanceResult> {
  assertAddress(walletAddress, "walletAddress");

  try {
    const balance = await publicClient.readContract({
      address: BASE_SEPOLIA_USDC_ADDRESS,
      abi: usdcAbi,
      functionName: "balanceOf",
      args: [walletAddress],
    });

    return formatUsdcBalance(balance);
  } catch (error) {
    throw wrapExternalError("Failed to fetch USDC balance", "USDC_BALANCE_FAILED", error);
  }
}

export async function fundFromTreasury(
  walletAddress: string,
  amountUSDC: number
): Promise<FundFromTreasuryResult> {
  assertAddress(walletAddress, "walletAddress");

  if (!Number.isFinite(amountUSDC) || amountUSDC <= 0) {
    throw new AppError("amountUSDC must be greater than zero", 400, "INVALID_AMOUNT");
  }

  try {
    const treasuryAddress = getRequiredEnv("TREASURY_WALLET_ADDRESS");
    assertAddress(treasuryAddress, "TREASURY_WALLET_ADDRESS");

    const walletClient = getWalletClient();
    const treasuryAccount = getTreasuryAccount();

    if (treasuryAccount.address.toLowerCase() !== treasuryAddress.toLowerCase()) {
      throw new AppError(
        "TREASURY_PRIVATE_KEY does not match TREASURY_WALLET_ADDRESS",
        500,
        "TREASURY_ADDRESS_MISMATCH"
      );
    }

    const amount = toUsdcAmount(amountUSDC);

    return await walletClient.writeContract({
      address: BASE_SEPOLIA_USDC_ADDRESS,
      abi: usdcAbi,
      functionName: "transfer",
      args: [walletAddress, amount],
      chain: baseSepolia,
    });
  } catch (error) {
    throw wrapExternalError("Failed to fund wallet from treasury", "TREASURY_FUND_FAILED", error);
  }
}

/**
 * Builds a Coinbase onramp URL for funding the user wallet with USDC.
 */
export function getOnrampUrl(walletAddress: string, amountUSD: number): string {
  assertAddress(walletAddress, "walletAddress");

  if (!Number.isFinite(amountUSD) || amountUSD <= 0) {
    throw new AppError("amountUSD must be greater than zero", 400, "INVALID_AMOUNT");
  }

  const appId = getRequiredEnv("CDP_APP_ID");
  const url = new URL("https://pay.coinbase.com/buy/select-asset");

  url.searchParams.set("appId", appId);
  url.searchParams.set(
    "destinationWallets",
    JSON.stringify([
      {
        address: walletAddress,
        assets: ["USDC"],
        supportedNetworks: ["base"],
      },
    ])
  );
  url.searchParams.set("defaultAsset", "USDC");
  url.searchParams.set("defaultNetwork", "base");
  url.searchParams.set("fiatCurrency", "USD");
  url.searchParams.set("presetFiatAmount", amountUSD.toString());

  url.searchParams.sort();

  return url.toString();
}
