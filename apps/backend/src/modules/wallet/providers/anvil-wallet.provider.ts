import { createWalletClient, http, type Address, type Hex } from "viem";
import { generatePrivateKey, privateKeyToAccount } from "viem/accounts";
import { fundFromImpersonatedWhale } from "../../../blockchain/anvil.js";
import { createRuntimePublicClient, getRuntimeNetwork } from "../../../blockchain/network.js";
import { usdcAbi } from "../../../blockchain/usdc-contract.js";
import { AppError } from "../../../lib/app-error.js";
import { decryptPrivateKey, encryptPrivateKey } from "./key-encryption.js";
import type { CreatedWallet, SignTransferParams, WalletProvider } from "./wallet-provider.types.js";

export class AnvilWalletProvider implements WalletProvider {
  readonly kind = "anvil" as const;

  async createWallet(): Promise<CreatedWallet> {
    const privateKey = generatePrivateKey();
    const account = privateKeyToAccount(privateKey);

    return {
      address: account.address,
      encryptedKey: encryptPrivateKey(privateKey),
    };
  }

  async getUsdcBalance(address: Address): Promise<bigint> {
    const network = getRuntimeNetwork();
    return createRuntimePublicClient().readContract({
      address: network.usdcAddress,
      abi: usdcAbi,
      functionName: "balanceOf",
      args: [address],
    });
  }

  async signTransfer({ amount, recipient, wallet }: SignTransferParams): Promise<Hex> {
    if (!wallet.encryptedKey) {
      throw new AppError(
        "Local wallet is missing encrypted signing credentials",
        500,
        "WALLET_KEY_MISSING"
      );
    }

    const network = getRuntimeNetwork();
    const account = privateKeyToAccount(decryptPrivateKey(wallet.encryptedKey));

    if (account.address.toLowerCase() !== wallet.baseAddress.toLowerCase()) {
      throw new AppError(
        "Encrypted wallet key does not match its address",
        500,
        "WALLET_ADDRESS_MISMATCH"
      );
    }

    const walletClient = createWalletClient({
      account,
      chain: network.chain,
      transport: http(network.rpcUrl),
    });
    const hash = await walletClient.writeContract({
      address: network.usdcAddress,
      abi: usdcAbi,
      functionName: "transfer",
      args: [recipient, amount],
      chain: network.chain,
    });

    await createRuntimePublicClient().waitForTransactionReceipt({ hash });
    return hash;
  }

  async fundWallet(address: Address, amount: bigint): Promise<Hex> {
    return fundFromImpersonatedWhale(address, amount);
  }
}
