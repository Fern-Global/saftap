import "dotenv/config";
import { PrismaClient } from "@prisma/client";
import { resetDemoData, getDemoUserSummary } from "../src/demo/demo-data.service.js";
import { env } from "../src/config/env.js";

const prisma = new PrismaClient();

async function main(): Promise<void> {
  if (env.APP_ENV === "production") {
    console.log("Production seed skipped.");
    return;
  }

  await resetDemoData(prisma);
  console.log("Demo seed complete:", getDemoUserSummary());
}

main()
  .catch((error: unknown) => {
    console.error("Seed failed:", error);
    process.exitCode = 1;
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
