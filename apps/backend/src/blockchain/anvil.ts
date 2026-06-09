import {
  createPublicClient,
  createTestClient,
  createWalletClient,
  http,
  parseEther,
  type Address,
  type Hex,
} from "viem";
import { baseSepolia } from "viem/chains";
import { env } from "../config/env.js";
import { AppError } from "../lib/app-error.js";
import { BASE_SEPOLIA_USDC_ADDRESS } from "./network.js";
import { usdcAbi } from "./usdc-contract.js";

export const DEFAULT_BASE_SEPOLIA_USDC_WHALE =
  "0xFaEc9cDC3Ef75713b48f46057B98BA04885e3391" as Address;

function getWhaleAddress(): Address {
  return (env.ANVIL_USDC_WHALE_ADDRESS ?? DEFAULT_BASE_SEPOLIA_USDC_WHALE) as Address;
}

function createAnvilClients() {
  const transport = http(env.ANVIL_RPC_URL);

  return {
    publicClient: createPublicClient({
      chain: baseSepolia,
      transport,
    }),
    testClient: createTestClient({
      chain: baseSepolia,
      mode: "anvil",
      transport,
    }),
  };
}

export async function resetAnvilFork(): Promise<void> {
  const { testClient } = createAnvilClients();

  await testClient.reset({
    jsonRpcUrl: env.ANVIL_FORK_URL,
  });
}

export async function fundFromImpersonatedWhale(recipient: Address, amount: bigint): Promise<Hex> {
  const whale = getWhaleAddress();
  const transport = http(env.ANVIL_RPC_URL);
  const { publicClient, testClient } = createAnvilClients();
  const whaleBalance = await publicClient.readContract({
    address: BASE_SEPOLIA_USDC_ADDRESS,
    abi: usdcAbi,
    functionName: "balanceOf",
    args: [whale],
  });

  if (whaleBalance < amount) {
    throw new AppError(
      "Configured Base Sepolia USDC whale has insufficient funds",
      503,
      "ANVIL_WHALE_INSUFFICIENT_FUNDS"
    );
  }

  await testClient.impersonateAccount({ address: whale });
  await Promise.all([
    testClient.setBalance({
      address: whale,
      value: parseEther("10"),
    }),
    testClient.setBalance({
      address: recipient,
      value: parseEther("1"),
    }),
  ]);

  try {
    const walletClient = createWalletClient({
      account: whale,
      chain: baseSepolia,
      transport,
    });
    const hash = await walletClient.writeContract({
      address: BASE_SEPOLIA_USDC_ADDRESS,
      abi: usdcAbi,
      functionName: "transfer",
      args: [recipient, amount],
      chain: baseSepolia,
    });

    await publicClient.waitForTransactionReceipt({ hash });
    return hash;
  } finally {
    await testClient.stopImpersonatingAccount({ address: whale });
  }
}
