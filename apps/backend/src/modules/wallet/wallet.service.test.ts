import { beforeEach, describe, expect, it, vi } from "vitest";

const prismaMock = vi.hoisted(() => ({
  wallet: {
    create: vi.fn(),
  },
}));

const cdpMock = vi.hoisted(() => ({
  createAccount: vi.fn(),
}));

vi.mock("../../lib/prisma.js", () => ({
  prisma: prismaMock,
}));

vi.mock("@coinbase/cdp-sdk", () => ({
  CdpClient: vi.fn(() => ({
    evm: {
      createAccount: cdpMock.createAccount,
    },
  })),
}));

const { createWallet, fundFromTreasury } = await import("./wallet.service.js");

const userId = "7ab52f4e-4ac8-4bb8-8190-af6b6026de09";

describe("mock wallet service", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    process.env.CRYPTO_WALLET_MODE = "mock";
    process.env.MOCK_WALLET_INITIAL_BALANCE_USDC = "250";
    prismaMock.wallet.create.mockResolvedValue({});
  });

  it("creates a local wallet with a demo balance without contacting CDP", async () => {
    const result = await createWallet(userId);

    expect(result.address).toMatch(/^0x[0-9a-f]{40}$/);
    expect(result.cdpWalletId).toBe(`mock-wallet-${userId}`);
    expect(prismaMock.wallet.create).toHaveBeenCalledWith({
      data: {
        userId,
        baseAddress: result.address,
        cdpWalletId: result.cdpWalletId,
        usdcBalance: 250,
      },
    });
    expect(cdpMock.createAccount).not.toHaveBeenCalled();
  });

  it("returns a mock transaction hash when funding", async () => {
    const txHash = await fundFromTreasury(
      "0x742d35Cc6634C0532925a3b844Bc454e4438f44e",
      20
    );

    expect(txHash).toMatch(/^0x[0-9a-f]{64}$/);
  });
});
