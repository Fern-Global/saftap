import { formatUnits, isAddress, parseUnits, type Address, type Hex } from "viem";
import { env } from "../../config/env.js";
import { AppError, wrapExternalError } from "../../lib/app-error.js";
import { prisma } from "../../lib/prisma.js";
import { getWalletProvider } from "./providers/index.js";
import type { WalletCredentials } from "./providers/wallet-provider.types.js";

const USDC_DECIMALS = 6;

export interface CreateWalletResult {
  address: Address;
  cdpWalletId?: string;
}

function assertAddress(address: string, label: string): asserts address is Address {
  if (!isAddress(address)) {
    throw new AppError(`${label} must be a valid EVM address`, 400, "INVALID_ADDRESS");
  }
}

function parseUsdcAmount(amountUsdc: number): bigint {
  if (!Number.isFinite(amountUsdc) || amountUsdc <= 0) {
    throw new AppError("amountUSDC must be greater than zero", 400, "INVALID_AMOUNT");
  }

  const amount = parseUnits(amountUsdc.toFixed(USDC_DECIMALS).replace(/\.?0+$/, ""), USDC_DECIMALS);

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
    const createdWallet = await getWalletProvider().createWallet();

    await prisma.wallet.create({
      data: {
        userId,
        baseAddress: createdWallet.address,
        encryptedKey: createdWallet.encryptedKey,
        cdpWalletId: createdWallet.cdpWalletId,
      },
    });

    return {
      address: createdWallet.address,
      cdpWalletId: createdWallet.cdpWalletId,
    };
  } catch (error) {
    if (error instanceof AppError) {
      throw error;
    }

    throw wrapExternalError("Failed to create wallet", "WALLET_CREATE_FAILED", error);
  }
}

export async function getUsdcBalance(walletAddress: string): Promise<string> {
  assertAddress(walletAddress, "walletAddress");

  try {
    const balance = await getWalletProvider().getUsdcBalance(walletAddress);
    const formattedBalance = formatUnits(balance, USDC_DECIMALS);

    await prisma.wallet.updateMany({
      where: { baseAddress: walletAddress },
      data: { usdcBalance: formattedBalance },
    });

    return formattedBalance;
  } catch (error) {
    if (error instanceof AppError) {
      throw error;
    }

    throw wrapExternalError("Failed to fetch USDC balance", "USDC_BALANCE_FAILED", error);
  }
}

export async function fundFromTreasury(walletAddress: string, amountUsdc: number): Promise<Hex> {
  assertAddress(walletAddress, "walletAddress");

  try {
    return await getWalletProvider().fundWallet(walletAddress, parseUsdcAmount(amountUsdc));
  } catch (error) {
    if (error instanceof AppError) {
      throw error;
    }

    throw wrapExternalError("Failed to fund wallet", "TREASURY_FUND_FAILED", error);
  }
}

export async function signUsdcTransfer(
  wallet: WalletCredentials,
  recipient: string,
  amountUsdc: number
): Promise<Hex> {
  assertAddress(wallet.baseAddress, "wallet.baseAddress");
  assertAddress(recipient, "recipient");

  return getWalletProvider().signTransfer({
    wallet,
    recipient,
    amount: parseUsdcAmount(amountUsdc),
  });
}

export function getOnrampUrl(walletAddress: string, amountUSD: number): string {
  assertAddress(walletAddress, "walletAddress");

  if (!Number.isFinite(amountUSD) || amountUSD <= 0) {
    throw new AppError("amountUSD must be greater than zero", 400, "INVALID_AMOUNT");
  }

  if (env.APP_ENV !== "production") {
    throw new AppError(
      "Coinbase onramp is only available in production",
      403,
      "ONRAMP_UNAVAILABLE"
    );
  }

  const url = new URL("https://pay.coinbase.com/buy/select-asset");

  url.searchParams.set("appId", env.CDP_APP_ID ?? "");
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
