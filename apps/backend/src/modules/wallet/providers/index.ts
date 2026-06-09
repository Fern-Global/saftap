import { isAnvilEnvironment } from "../../../blockchain/network.js";
import { AnvilWalletProvider } from "./anvil-wallet.provider.js";
import { CdpWalletProvider } from "./cdp-wallet.provider.js";
import type { WalletProvider } from "./wallet-provider.types.js";

let provider: WalletProvider | null = null;

export function getWalletProvider(): WalletProvider {
  provider ??= isAnvilEnvironment() ? new AnvilWalletProvider() : new CdpWalletProvider();

  return provider;
}
