import { createPublicClient, http, type Address, type Chain } from "viem";
import { base, baseSepolia } from "viem/chains";
import { env } from "../config/env.js";

export const BASE_SEPOLIA_USDC_ADDRESS = "0x036CbD53842c5426634e7929541eC2318f3dCF7e" as Address;
export const BASE_USDC_ADDRESS = "0x833589fCD6eDb6E08f4c7C32D4f71b54bdA02913" as Address;

export type RuntimeNetwork = {
  cdpNetwork: "base" | "base-sepolia";
  chain: Chain;
  rpcUrl: string;
  usdcAddress: Address;
};

export function isAnvilEnvironment(): boolean {
  return env.APP_ENV === "local" || env.APP_ENV === "demo";
}

export function getRuntimeNetwork(): RuntimeNetwork {
  if (isAnvilEnvironment()) {
    return {
      cdpNetwork: "base-sepolia",
      chain: baseSepolia,
      rpcUrl: env.ANVIL_RPC_URL,
      usdcAddress: BASE_SEPOLIA_USDC_ADDRESS,
    };
  }

  return {
    cdpNetwork: "base",
    chain: base,
    rpcUrl: env.BASE_RPC_URL ?? base.rpcUrls.default.http[0],
    usdcAddress: BASE_USDC_ADDRESS,
  };
}

export function createRuntimePublicClient() {
  const network = getRuntimeNetwork();

  return createPublicClient({
    chain: network.chain,
    transport: http(network.rpcUrl),
  });
}
