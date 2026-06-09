import { CdpClient } from "@coinbase/cdp-sdk";
import { encodeFunctionData, type Address, type Hex } from "viem";
import { createRuntimePublicClient, getRuntimeNetwork } from "../../../blockchain/network.js";
import { usdcAbi } from "../../../blockchain/usdc-contract.js";
import { AppError, wrapExternalError } from "../../../lib/app-error.js";
import type { CreatedWallet, SignTransferParams, WalletProvider } from "./wallet-provider.types.js";

type CdpEvmAccount = {
  address: Address;
  cdpWalletId?: string;
  id?: string;
  walletId?: string;
};

let cdp: CdpClient | null = null;

function getCdpClient(): CdpClient {
  cdp ??= new CdpClient();
  return cdp;
}

function getWalletId(account: CdpEvmAccount): string {
  return account.cdpWalletId ?? account.walletId ?? account.id ?? account.address;
}

export class CdpWalletProvider implements WalletProvider {
  readonly kind = "cdp" as const;

  async createWallet(): Promise<CreatedWallet> {
    try {
      const account = (await getCdpClient().evm.createAccount()) as CdpEvmAccount;

      return {
        address: account.address,
        cdpWalletId: getWalletId(account),
      };
    } catch (error) {
      throw wrapExternalError("Failed to create CDP wallet", "WALLET_CREATE_FAILED", error);
    }
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
    const network = getRuntimeNetwork();

    try {
      const account = await getCdpClient().evm.getAccount({
        address: wallet.baseAddress as Address,
      });
      const data = encodeFunctionData({
        abi: usdcAbi,
        functionName: "transfer",
        args: [recipient, amount],
      });
      const result = await getCdpClient().evm.sendTransaction({
        address: account.address,
        network: network.cdpNetwork,
        transaction: {
          to: network.usdcAddress,
          data,
        },
      });
      const hash = result.transactionHash as Hex;

      await createRuntimePublicClient().waitForTransactionReceipt({ hash });
      return hash;
    } catch (error) {
      throw wrapExternalError(
        "Failed to sign USDC transfer with CDP",
        "USDC_TRANSFER_FAILED",
        error
      );
    }
  }

  async fundWallet(_address: Address, _amount: bigint): Promise<Hex> {
    throw new AppError(
      "Direct test funding is unavailable in production",
      403,
      "PRODUCTION_FUNDING_DISABLED"
    );
  }
}
