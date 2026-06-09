import { PrismaClient } from "@prisma/client";
import bcrypt from "bcrypt";
import { formatUnits, type Address } from "viem";
import { resetAnvilFork } from "../blockchain/anvil.js";
import { isAnvilEnvironment } from "../blockchain/network.js";
import { AppError } from "../lib/app-error.js";
import { getWalletProvider } from "../modules/wallet/providers/index.js";

const PASSWORD_HASH_ROUNDS = 12;
const DEMO_PASSWORD = "password123";
const USDC_DECIMALS = 6;

const demoUsers = [
  {
    email: "alice.demo@saftap.local",
    phone: "+254700000001",
    balanceUsdc: 500,
  },
  {
    email: "bob.demo@saftap.local",
    phone: "+254700000002",
    balanceUsdc: 250,
  },
  {
    email: "charlie.demo@saftap.local",
    phone: "+254700000003",
    balanceUsdc: 50,
  },
] as const;

let resetPromise: Promise<void> | null = null;

async function resetDemoDataImpl(prisma: PrismaClient): Promise<void> {
  if (!isAnvilEnvironment()) {
    throw new AppError(
      "Demo data can only be reset in local or demo environments",
      403,
      "DEMO_RESET_UNAVAILABLE"
    );
  }

  await resetAnvilFork();
  await prisma.transaction.deleteMany();
  await prisma.savedPayee.deleteMany();
  await prisma.wallet.deleteMany();
  await prisma.user.deleteMany();

  const passwordHash = await bcrypt.hash(DEMO_PASSWORD, PASSWORD_HASH_ROUNDS);
  const provider = getWalletProvider();

  for (const demoUser of demoUsers) {
    const createdWallet = await provider.createWallet();
    const user = await prisma.user.create({
      data: {
        email: demoUser.email,
        phone: demoUser.phone,
        passwordHash,
        role: "TOURIST",
        wallet: {
          create: {
            baseAddress: createdWallet.address,
            encryptedKey: createdWallet.encryptedKey,
            cdpWalletId: createdWallet.cdpWalletId,
          },
        },
      },
      include: {
        wallet: true,
      },
    });

    if (!user.wallet) {
      throw new AppError("Seeded user wallet was not created", 500);
    }

    await provider.fundWallet(
      createdWallet.address as Address,
      BigInt(demoUser.balanceUsdc) * 10n ** BigInt(USDC_DECIMALS)
    );
    const balance = await provider.getUsdcBalance(createdWallet.address);

    await prisma.wallet.update({
      where: { id: user.wallet.id },
      data: {
        usdcBalance: formatUnits(balance, USDC_DECIMALS),
      },
    });
  }

  const userCount = await prisma.user.count();

  if (userCount !== demoUsers.length) {
    throw new AppError(
      `Demo reset expected ${demoUsers.length} users but found ${userCount}`,
      500,
      "DEMO_RESET_INCOMPLETE"
    );
  }
}

export async function resetDemoData(prisma: PrismaClient): Promise<void> {
  if (resetPromise) {
    throw new AppError("A demo reset is already in progress", 409, "DEMO_RESET_IN_PROGRESS");
  }

  resetPromise = resetDemoDataImpl(prisma);

  try {
    await resetPromise;
  } finally {
    resetPromise = null;
  }
}

export function getDemoUserSummary() {
  return demoUsers.map(({ email, balanceUsdc }) => ({ email, balanceUsdc }));
}
