import { Prisma, type User, type Wallet } from "@prisma/client";
import bcrypt from "bcrypt";
import { beforeEach, describe, expect, it, vi } from "vitest";

const prismaMock = vi.hoisted(() => ({
  user: {
    create: vi.fn(),
    delete: vi.fn(),
    findUnique: vi.fn(),
  },
}));

const walletServiceMock = vi.hoisted(() => ({
  createWallet: vi.fn(),
}));

vi.mock("../../lib/prisma.js", () => ({
  prisma: prismaMock,
}));

vi.mock("../wallet/wallet.service.js", () => walletServiceMock);

const { login, registerTourist } = await import("./auth.service.js");

const mockUser: User = {
  id: "7ab52f4e-4ac8-4bb8-8190-af6b6026de09",
  email: "tourist@example.com",
  phone: "+254700000001",
  passwordHash: "$2b$12$XD1ghuVQyUypTOmqyML5ju3y7IVhubCHqGbthDJMnIicM2uLYOVje",
  role: "TOURIST",
  createdAt: new Date("2026-01-01T10:00:00.000Z"),
  updatedAt: new Date("2026-01-01T10:00:00.000Z"),
};

const mockWallet: Wallet = {
  id: "a5de7f5d-2c8b-447a-88f8-07c2f9327e8e",
  userId: mockUser.id,
  baseAddress: "0x742d35Cc6634C0532925a3b844Bc454e4438f44e",
  encryptedKey: null,
  cdpWalletId: "cdp-wallet-sepolia-demo-001",
  usdcBalance: new Prisma.Decimal("0"),
  createdAt: new Date("2026-01-01T10:00:00.000Z"),
  updatedAt: new Date("2026-01-01T10:00:00.000Z"),
};

describe("auth service", () => {
  beforeEach(() => {
    process.env.JWT_SECRET = "test-jwt-secret";
    vi.clearAllMocks();
  });

  it("registers a tourist and creates a wallet", async () => {
    prismaMock.user.create.mockResolvedValue(mockUser);
    walletServiceMock.createWallet.mockResolvedValue({
      address: mockWallet.baseAddress,
      cdpWalletId: mockWallet.cdpWalletId,
    });

    const result = await registerTourist({
      email: mockUser.email,
      phone: mockUser.phone,
      password: "correct-password",
    });

    expect(prismaMock.user.create).toHaveBeenCalledWith({
      data: {
        email: mockUser.email,
        phone: mockUser.phone,
        passwordHash: expect.any(String),
        role: "TOURIST",
      },
    });
    expect(walletServiceMock.createWallet).toHaveBeenCalledWith(mockUser.id);
    expect(result.user).toEqual({
      id: mockUser.id,
      email: mockUser.email,
      phone: mockUser.phone,
      walletAddress: mockWallet.baseAddress,
    });
    expect(result.token).toEqual(expect.any(String));
  });

  it("logs in a tourist with valid credentials", async () => {
    const passwordHash = await bcrypt.hash("correct-password", 12);
    prismaMock.user.findUnique.mockResolvedValue({
      ...mockUser,
      passwordHash,
      wallet: mockWallet,
    });

    const result = await login({
      email: mockUser.email,
      password: "correct-password",
    });

    expect(prismaMock.user.findUnique).toHaveBeenCalledWith({
      where: { email: mockUser.email },
      include: { wallet: true },
    });
    expect(result.user.walletAddress).toBe(mockWallet.baseAddress);
    expect(result.token).toEqual(expect.any(String));
  });

  it("rejects invalid login credentials", async () => {
    prismaMock.user.findUnique.mockResolvedValue({
      ...mockUser,
      passwordHash: await bcrypt.hash("correct-password", 12),
      wallet: mockWallet,
    });

    await expect(
      login({
        email: mockUser.email,
        password: "wrong-password",
      })
    ).rejects.toMatchObject({
      statusCode: 401,
      message: "Invalid email or password",
    });
  });
});
