import type { Wallet } from "@prisma/client";
import type { Address, Hex } from "viem";

export type WalletCredentials = Pick<Wallet, "baseAddress" | "cdpWalletId" | "encryptedKey">;

export type CreatedWallet = {
  address: Address;
  cdpWalletId?: string;
  encryptedKey?: string;
};

export type SignTransferParams = {
  amount: bigint;
  recipient: Address;
  wallet: WalletCredentials;
};

export interface WalletProvider {
  readonly kind: "anvil" | "cdp";
  createWallet(): Promise<CreatedWallet>;
  fundWallet(address: Address, amount: bigint): Promise<Hex>;
  getUsdcBalance(address: Address): Promise<bigint>;
  signTransfer(params: SignTransferParams): Promise<Hex>;
}
