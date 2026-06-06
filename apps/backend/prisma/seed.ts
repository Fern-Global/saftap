import "dotenv/config";
import { PrismaClient } from "@prisma/client";
import bcrypt from "bcrypt";

const prisma = new PrismaClient();
const PASSWORD_HASH_ROUNDS = 12;

async function main(): Promise<void> {
  const passwordHash = await bcrypt.hash("password123", PASSWORD_HASH_ROUNDS);

  await prisma.transaction.deleteMany();
  await prisma.savedPayee.deleteMany();
  await prisma.wallet.deleteMany();
  await prisma.user.deleteMany();

  const user = await prisma.user.create({
    data: {
      email: "tourist@example.com",
      phone: "+254700000001",
      passwordHash,
      role: "TOURIST",
      wallet: {
        create: {
          baseAddress: "0x742d35Cc6634C0532925a3b844Bc454e4438f44e",
          encryptedKey: "encrypted_dummy_private_key_payload",
          cdpWalletId: "cdp-wallet-sepolia-demo-001",
          usdcBalance: "125.500000",
        },
      },
    },
    include: {
      wallet: true,
    },
  });

  console.log("Seed complete:", {
    userId: user.id,
    email: user.email,
    walletId: user.wallet?.id,
    walletAddress: user.wallet?.baseAddress,
  });
}

main()
  .catch((error: unknown) => {
    console.error("Seed failed:", error);
    process.exitCode = 1;
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
