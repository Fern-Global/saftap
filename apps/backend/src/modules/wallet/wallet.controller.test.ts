import { Prisma, type Wallet } from "@prisma/client";
import type { Request, Response } from "express";
import { beforeEach, describe, expect, it, vi } from "vitest";

const prismaMock = vi.hoisted(() => ({
  wallet: {
    findUnique: vi.fn(),
    update: vi.fn(),
  },
}));

const walletServiceMock = vi.hoisted(() => ({
  fundFromTreasury: vi.fn(),
  getUsdcBalance: vi.fn(),
}));

vi.mock("../../lib/prisma.js", () => ({
  prisma: prismaMock,
}));

vi.mock("./wallet.service.js", () => walletServiceMock);

const { fundWallet, getWalletBalance } = await import("./wallet.controller.js");

const userId = "7ab52f4e-4ac8-4bb8-8190-af6b6026de09";
const wallet: Wallet = {
  id: "a5de7f5d-2c8b-447a-88f8-07c2f9327e8e",
  userId,
  baseAddress: "0x742d35Cc6634C0532925a3b844Bc454e4438f44e",
  encryptedKey: null,
  cdpWalletId: "cdp-wallet-sepolia-demo-001",
  usdcBalance: new Prisma.Decimal("125.5"),
  createdAt: new Date("2026-01-01T10:00:00.000Z"),
  updatedAt: new Date("2026-01-01T10:00:00.000Z"),
};

function createResponse(): Response {
  const response = {
    json: vi.fn(),
    status: vi.fn(),
  } as unknown as Response;

  vi.mocked(response.status).mockReturnValue(response);
  return response;
}

describe("wallet controller", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    prismaMock.wallet.findUnique.mockResolvedValue(wallet);
    walletServiceMock.getUsdcBalance.mockResolvedValue("125.5");
  });

  it("returns the on-chain balance", async () => {
    const request = {
      user: { userId, walletAddress: wallet.baseAddress },
    } as Request;
    const response = createResponse();

    await getWalletBalance(request, response);

    expect(response.json).toHaveBeenCalledWith({ balanceUsdc: "125.5" });
    expect(walletServiceMock.getUsdcBalance).toHaveBeenCalledWith(wallet.baseAddress);
    expect(walletServiceMock.fundFromTreasury).not.toHaveBeenCalled();
  });

  it("funds the wallet and returns the refreshed chain balance", async () => {
    const request = {
      body: { amountUsdc: 20 },
      user: { userId, walletAddress: wallet.baseAddress },
    } as Request;
    const response = createResponse();
    walletServiceMock.fundFromTreasury.mockResolvedValue("0xabc123");
    walletServiceMock.getUsdcBalance.mockResolvedValue("145.5");

    await fundWallet(request, response);

    expect(walletServiceMock.fundFromTreasury).toHaveBeenCalledWith(wallet.baseAddress, 20);
    expect(walletServiceMock.getUsdcBalance).toHaveBeenCalledWith(wallet.baseAddress);
    expect(response.status).toHaveBeenCalledWith(200);
    expect(response.json).toHaveBeenCalledWith({
      txHash: "0xabc123",
      balanceUsdc: "145.5",
    });
  });
});
