import { app } from "./app.js";
import { env } from "./config/env.js";
import { startAnvilProcess, type ManagedAnvil } from "./lib/anvil-process.js";
import { prisma } from "./lib/prisma.js";

async function main(): Promise<void> {
  let managedAnvil: ManagedAnvil | null = null;

  if (env.APP_ENV === "demo") {
    managedAnvil = await startAnvilProcess();
  }

  const server = app.listen(env.PORT, () => {
    console.log(`Backend listening on http://localhost:${env.PORT}`);
    console.log(
      `Environment: ${env.APP_ENV}; wallet provider: ${
        env.APP_ENV === "production" ? "CDP" : "Anvil"
      }`
    );
  });
  let shuttingDown = false;

  const shutdown = async (signal: string): Promise<void> => {
    if (shuttingDown) {
      return;
    }

    shuttingDown = true;
    console.log(`Received ${signal}; shutting down.`);

    await new Promise<void>((resolve) => {
      server.close(() => resolve());
    });
    await prisma.$disconnect();
    await managedAnvil?.stop();
  };

  process.once("SIGINT", () => void shutdown("SIGINT"));
  process.once("SIGTERM", () => void shutdown("SIGTERM"));
}

main().catch((error: unknown) => {
  console.error(error);
  process.exitCode = 1;
});
