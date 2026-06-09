import { beforeEach, describe, expect, it, vi } from "vitest";

const prismaMock = vi.hoisted(() => ({
  wallet: {
    create: vi.fn(),
    updateMany: vi.fn(),
  },
}));

const providerMock = vi.hoisted(() => ({
  createWallet: vi.fn(),
  fundWallet: vi.fn(),
  getUsdcBalance: vi.fn(),
  signTransfer: vi.fn(),
}));

vi.mock("../../lib/prisma.js", () => ({
  prisma: prismaMock,
}));

vi.mock("./providers/index.js", () => ({
  getWalletProvider: () => providerMock,
}));

vi.mock("../../config/env.js", () => ({
  env: {
    APP_ENV: "local",
    CDP_APP_ID: undefined,
  },
}));

const { createWallet, fundFromTreasury, getUsdcBalance, signUsdcTransfer } =
  await import("./wallet.service.js");

const userId = "7ab52f4e-4ac8-4bb8-8190-af6b6026de09";
const walletAddress = "0x742d35Cc6634C0532925a3b844Bc454e4438f44e";

describe("wallet service", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    prismaMock.wallet.create.mockResolvedValue({});
    prismaMock.wallet.updateMany.mockResolvedValue({ count: 1 });
  });

  it("persists credentials returned by the active wallet provider", async () => {
    providerMock.createWallet.mockResolvedValue({
      address: walletAddress,
      encryptedKey: "v1:iv:tag:ciphertext",
    });

    const result = await createWallet(userId);

    expect(result).toEqual({
      address: walletAddress,
      cdpWalletId: undefined,
    });
    expect(prismaMock.wallet.create).toHaveBeenCalledWith({
      data: {
        userId,
        baseAddress: walletAddress,
        encryptedKey: "v1:iv:tag:ciphertext",
        cdpWalletId: undefined,
      },
    });
  });

  it("funds test wallets using six-decimal USDC units", async () => {
    providerMock.fundWallet.mockResolvedValue(`0x${"a".repeat(64)}`);

    const txHash = await fundFromTreasury(walletAddress, 20.5);

    expect(providerMock.fundWallet).toHaveBeenCalledWith(
      walletAddress,
      20_500_000n
    );
    expect(txHash).toBe(`0x${"a".repeat(64)}`);
  });

  it("reads the chain balance and synchronizes the database cache", async () => {
    providerMock.getUsdcBalance.mockResolvedValue(125_500_000n);

    await expect(getUsdcBalance(walletAddress)).resolves.toBe("125.5");
    expect(prismaMock.wallet.updateMany).toHaveBeenCalledWith({
      where: { baseAddress: walletAddress },
      data: { usdcBalance: "125.5" },
    });
  });

  it("delegates signing with the stored wallet credentials", async () => {
    const wallet = {
      baseAddress: walletAddress,
      encryptedKey: "encrypted-key",
      cdpWalletId: null,
    };
    providerMock.signTransfer.mockResolvedValue(`0x${"b".repeat(64)}`);

    await signUsdcTransfer(
      wallet,
      "0x4252e0c9A3da5A2700e7d91cb50aEf522D0C6Fe8",
      10
    );

    expect(providerMock.signTransfer).toHaveBeenCalledWith({
      wallet,
      recipient: "0x4252e0c9A3da5A2700e7d91cb50aEf522D0C6Fe8",
      amount: 10_000_000n,
    });
  });
});
