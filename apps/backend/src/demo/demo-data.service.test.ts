import { beforeEach, describe, expect, it, vi } from "vitest";

const resetAnvilForkMock = vi.hoisted(() => vi.fn(async () => undefined));
const providerMock = vi.hoisted(() => ({
  createWallet: vi.fn(),
  fundWallet: vi.fn(async (_address: string, _amount: bigint) => `0x${"ab".repeat(32)}`),
  getUsdcBalance: vi.fn(),
}));

vi.mock("../blockchain/anvil.js", () => ({
  resetAnvilFork: resetAnvilForkMock,
}));

vi.mock("../blockchain/network.js", () => ({
  isAnvilEnvironment: () => true,
}));

vi.mock("../modules/wallet/providers/index.js", () => ({
  getWalletProvider: () => providerMock,
}));

const { getDemoUserSummary, resetDemoData } = await import("./demo-data.service.js");

describe("demo data reset", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    providerMock.createWallet
      .mockResolvedValueOnce({
        address: "0x0000000000000000000000000000000000000001",
        encryptedKey: "encrypted-alice",
      })
      .mockResolvedValueOnce({
        address: "0x0000000000000000000000000000000000000002",
        encryptedKey: "encrypted-bob",
      })
      .mockResolvedValueOnce({
        address: "0x0000000000000000000000000000000000000003",
        encryptedKey: "encrypted-charlie",
      });
    providerMock.getUsdcBalance
      .mockResolvedValueOnce(500_000_000n)
      .mockResolvedValueOnce(250_000_000n)
      .mockResolvedValueOnce(50_000_000n);
  });

  it("recreates exactly three funded local wallets", async () => {
    let createdUsers = 0;
    const prisma = {
      transaction: { deleteMany: vi.fn(async () => undefined) },
      savedPayee: { deleteMany: vi.fn(async () => undefined) },
      wallet: {
        deleteMany: vi.fn(async () => undefined),
        update: vi.fn(async () => undefined),
      },
      user: {
        deleteMany: vi.fn(async () => undefined),
        create: vi.fn(async ({ data }) => {
          createdUsers += 1;
          return {
            id: `user-${createdUsers}`,
            ...data,
            wallet: { id: `wallet-${createdUsers}`, ...data.wallet.create },
          };
        }),
        count: vi.fn(async () => createdUsers),
      },
    };

    await resetDemoData(prisma as never);

    expect(resetAnvilForkMock).toHaveBeenCalledOnce();
    expect(prisma.user.create).toHaveBeenCalledTimes(3);
    expect(providerMock.fundWallet.mock.calls.map(([, amount]) => amount)).toEqual([
      500_000_000n,
      250_000_000n,
      50_000_000n,
    ]);
    expect(getDemoUserSummary()).toEqual([
      { email: "alice.demo@saftap.local", balanceUsdc: 500 },
      { email: "bob.demo@saftap.local", balanceUsdc: 250 },
      { email: "charlie.demo@saftap.local", balanceUsdc: 50 },
    ]);
  });
});
