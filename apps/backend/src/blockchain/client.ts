import { createPublicClient, createWalletClient, http } from "viem";
import { getRuntimeNetwork } from "./network.js";

const network = getRuntimeNetwork();
export const runtimeTransport = http(network.rpcUrl);

/**
 * Public blockchain client for Sepolia read-only operations.
 */
export const publicClient = createPublicClient({
  chain: network.chain,
  transport: runtimeTransport,
});

/**
 * Wallet client used to sign transactions with the treasury account.
 */
export const walletClient = createWalletClient({
  chain: network.chain,
  transport: runtimeTransport,
});
