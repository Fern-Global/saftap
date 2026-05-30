import { Prisma } from "@prisma/client";
import type { PrismaClient, User, Wallet } from "@prisma/client";
import { describe, expect, it, vi } from "vitest";
import { createUserWithWallet } from "../db/user-wallet.repository.js";

describe("database layer", () => {
  it("instantiates PrismaClient class from @prisma/client", async () => {
    const { PrismaClient: PrismaClientClass } = await import("@prisma/client");
    const client = new PrismaClientClass();

    expect(client).toBeInstanceOf(PrismaClientClass);

    await client.$disconnect();
  });

  it("creates and links user and wallet through one transaction", async () => {
    const mockUser: User = {
      id: "7ab52f4e-4ac8-4bb8-8190-af6b6026de09",
      email: "tourist@example.com",
      phone: "+254700000001",
      passwordHash: "hashed-password",
      role: "TOURIST",
      createdAt: new Date("2026-01-01T10:00:00.000Z"),
      updatedAt: new Date("2026-01-01T10:00:00.000Z"),
    };

    const mockWallet: Wallet = {
      id: "a5de7f5d-2c8b-447a-88f8-07c2f9327e8e",
      userId: mockUser.id,
      baseAddress: "0x742d35Cc6634C0532925a3b844Bc454e4438f44e",
      encryptedKey: "encrypted-key",
      cdpWalletId: "cdp-wallet-sepolia-demo-001",
      usdcBalance: new Prisma.Decimal("100.250000"),
      createdAt: new Date("2026-01-01T10:00:00.000Z"),
      updatedAt: new Date("2026-01-01T10:00:00.000Z"),
    };

    const txMock = {
      user: {
        create: vi.fn().mockResolvedValue(mockUser),
      },
      wallet: {
        create: vi.fn().mockResolvedValue(mockWallet),
      },
    };

    const prismaMock = {
      $transaction: vi
        .fn()
        .mockImplementation(async (callback: (tx: typeof txMock) => Promise<unknown>) => {
          return callback(txMock);
        }),
    } as unknown as PrismaClient;

    const result = await createUserWithWallet(prismaMock, {
      email: mockUser.email,
      phone: mockUser.phone,
      passwordHash: mockUser.passwordHash,
      baseAddress: mockWallet.baseAddress,
      encryptedKey: mockWallet.encryptedKey,
      cdpWalletId: mockWallet.cdpWalletId,
      usdcBalance: "100.250000",
    });

    expect(prismaMock.$transaction).toHaveBeenCalledTimes(1);
    expect(txMock.user.create).toHaveBeenCalledWith({
      data: {
        email: mockUser.email,
        phone: mockUser.phone,
        passwordHash: mockUser.passwordHash,
        role: "TOURIST",
      },
    });
    expect(txMock.wallet.create).toHaveBeenCalledWith({
      data: {
        userId: mockUser.id,
        baseAddress: mockWallet.baseAddress,
        encryptedKey: mockWallet.encryptedKey,
        cdpWalletId: mockWallet.cdpWalletId,
        usdcBalance: "100.250000",
      },
    });
    expect(result.id).toBe(mockUser.id);
    expect(result.wallet.userId).toBe(mockUser.id);
    expect(result.wallet.baseAddress).toBe(mockWallet.baseAddress);
  });
});
