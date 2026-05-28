import { PrismaClient } from "@prisma/client";

const globalForPrisma = globalThis as {
  prisma?: PrismaClient;
};

/**
 * Singleton Prisma client instance for database access.
 */
export const prisma =
  globalForPrisma.prisma ??
  new PrismaClient({
    log: process.env.NODE_ENV === "development" ? ["query", "info", "warn", "error"] : ["error"],
  });

if (process.env.NODE_ENV !== "production") {
  globalForPrisma.prisma = prisma;
}
