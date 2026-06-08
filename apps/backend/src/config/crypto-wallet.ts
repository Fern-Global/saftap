import { createHash, randomBytes } from "node:crypto";
import type { Address, Hex } from "viem";

export const MOCK_TREASURY_ADDRESS =
  "0x0000000000000000000000000000000000000001" as Address;

export function isMockCryptoWalletEnabled(): boolean {
  return process.env.CRYPTO_WALLET_MODE?.trim().toLowerCase() === "mock";
}

export function getMockWalletInitialBalance(): number {
  const balance = Number(process.env.MOCK_WALLET_INITIAL_BALANCE_USDC ?? "100");

  return Number.isFinite(balance) && balance >= 0 ? balance : 100;
}

export function createMockWalletAddress(userId: string): Address {
  const address = createHash("sha256")
    .update(`saftap-demo-wallet:${userId}`)
    .digest("hex")
    .slice(0, 40);

  return `0x${address}` as Address;
}

export function createMockTransactionHash(): Hex {
  return `0x${randomBytes(32).toString("hex")}`;
}
