import { createPublicClient, createWalletClient, http } from "viem";
import { baseSepolia } from "viem/chains";
import { getOptionalEnv } from "../config/env.js";

/**
 * HTTP transport used for Sepolia blockchain RPC requests.
 */
export const baseSepoliaTransport = http(
  getOptionalEnv("BASE_SEPOLIA_RPC_URL", baseSepolia.rpcUrls.default.http[0])
);

/**
 * Public blockchain client for Sepolia read-only operations.
 */
export const publicClient = createPublicClient({
  chain: baseSepolia,
  transport: baseSepoliaTransport,
});

/**
 * Wallet client used to sign transactions with the treasury account.
 */
export const walletClient = createWalletClient({
  chain: baseSepolia,
  transport: baseSepoliaTransport,
});
