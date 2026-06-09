import { spawn, type ChildProcess } from "node:child_process";
import { env } from "../config/env.js";
import { startAnvilProcess } from "../lib/anvil-process.js";

function runCommand(command: string, args: string[]): Promise<void> {
  return new Promise((resolve, reject) => {
    const child = spawn(command, args, { stdio: "inherit" });
    child.once("error", reject);
    child.once("exit", (code) => {
      if (code === 0) {
        resolve();
      } else {
        reject(new Error(`${command} exited with code ${code}`));
      }
    });
  });
}

async function stopChild(child: ChildProcess | null): Promise<void> {
  if (!child || child.exitCode !== null) {
    return;
  }

  child.kill("SIGTERM");
  await Promise.race([
    new Promise<void>((resolve) => child.once("exit", () => resolve())),
    new Promise<void>((resolve) => {
      setTimeout(() => {
        child.kill("SIGKILL");
        resolve();
      }, 5_000);
    }),
  ]);
}

async function main(): Promise<void> {
  if (env.APP_ENV === "production") {
    throw new Error("The local development runner cannot use APP_ENV=production");
  }

  const clean = process.argv.includes("--clean");
  const anvil = await startAnvilProcess();
  let backend: ChildProcess | null = null;
  let shuttingDown = false;

  const shutdown = async (): Promise<void> => {
    if (shuttingDown) {
      return;
    }

    shuttingDown = true;
    await stopChild(backend);
    await anvil.stop();
  };

  process.once("SIGINT", () => void shutdown());
  process.once("SIGTERM", () => void shutdown());

  try {
    if (clean) {
      await runCommand("prisma", ["migrate", "reset", "--force", "--skip-seed"]);
      await runCommand("tsx", ["prisma/seed.ts"]);
    }

    backend = spawn("tsx", ["watch", "src/index.ts"], { stdio: "inherit" });
    const exitCode = await new Promise<number>((resolve, reject) => {
      backend?.once("error", reject);
      backend?.once("exit", (code) => resolve(code ?? 0));
    });
    process.exitCode = exitCode;
  } finally {
    await shutdown();
  }
}

main().catch((error: unknown) => {
  console.error(error instanceof Error ? error.message : error);
  process.exitCode = 1;
});
