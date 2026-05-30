import type { Prisma, PrismaClient, User, Wallet } from "@prisma/client";

type UserWithWallet = User & {
  wallet: Wallet;
};

/**
 * Input shape for creating a user together with a wallet record in the database.
 */
export type CreateUserWithWalletInput = {
  email: string;
  phone: string;
  passwordHash: string;
  role?: string;
  baseAddress: string;
  encryptedKey?: string | null;
  cdpWalletId?: string | null;
  usdcBalance?: Prisma.Decimal | number | string;
};

type TransactionClient = Omit<
  PrismaClient,
  "$connect" | "$disconnect" | "$on" | "$transaction" | "$use" | "$extends"
>;

export async function createUserWithWallet(
  prisma: PrismaClient,
  input: CreateUserWithWalletInput
): Promise<UserWithWallet> {
  return prisma.$transaction(async (tx: TransactionClient) => {
    const user = await tx.user.create({
      data: {
        email: input.email,
        phone: input.phone,
        passwordHash: input.passwordHash,
        role: input.role ?? "TOURIST",
      },
    });

    const wallet = await tx.wallet.create({
      data: {
        userId: user.id,
        baseAddress: input.baseAddress,
        encryptedKey: input.encryptedKey ?? null,
        cdpWalletId: input.cdpWalletId ?? null,
        usdcBalance: input.usdcBalance ?? 0,
      },
    });

    return {
      ...user,
      wallet,
    };
  });
}
