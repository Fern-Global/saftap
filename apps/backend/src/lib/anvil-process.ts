import { spawn, type ChildProcess } from "node:child_process";
import { mkdir } from "node:fs/promises";
import { dirname, resolve } from "node:path";
import { env } from "../config/env.js";

const RPC_START_TIMEOUT_MS = 45_000;

export type ManagedAnvil = {
  stop: () => Promise<void>;
};

async function isAnvilReady(): Promise<boolean> {
  try {
    const response = await fetch(env.ANVIL_RPC_URL, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        jsonrpc: "2.0",
        id: 1,
        method: "web3_clientVersion",
        params: [],
      }),
    });
    const payload = (await response.json()) as { result?: unknown };
    return response.ok && typeof payload.result === "string";
  } catch {
    return false;
  }
}

async function waitForAnvil(child: ChildProcess): Promise<void> {
  const deadline = Date.now() + RPC_START_TIMEOUT_MS;

  while (Date.now() < deadline) {
    if (child.exitCode !== null) {
      throw new Error(`Anvil exited before startup with code ${child.exitCode}`);
    }

    if (await isAnvilReady()) {
      return;
    }

    await new Promise((resolvePromise) => setTimeout(resolvePromise, 250));
  }

  throw new Error(`Anvil did not become ready at ${env.ANVIL_RPC_URL}`);
}

async function stopChild(child: ChildProcess): Promise<void> {
  if (child.exitCode !== null) {
    return;
  }

  child.kill("SIGTERM");

  await Promise.race([
    new Promise<void>((resolvePromise) => {
      child.once("exit", () => resolvePromise());
    }),
    new Promise<void>((resolvePromise) => {
      setTimeout(() => {
        child.kill("SIGKILL");
        resolvePromise();
      }, 5_000);
    }),
  ]);
}

export async function startAnvilProcess(): Promise<ManagedAnvil> {
  if (await isAnvilReady()) {
    console.log(`Using existing Anvil node at ${env.ANVIL_RPC_URL}`);
    return { stop: async () => undefined };
  }

  if (!env.ANVIL_FORK_URL) {
    throw new Error("ANVIL_FORK_URL is required to start Anvil");
  }

  const rpcUrl = new URL(env.ANVIL_RPC_URL);
  const statePath = resolve(env.ANVIL_STATE_PATH);
  await mkdir(dirname(statePath), { recursive: true });

  const child = spawn(
    "anvil",
    [
      "--fork-url",
      env.ANVIL_FORK_URL,
      "--host",
      "0.0.0.0",
      "--port",
      rpcUrl.port || "8545",
      "--state",
      statePath,
      "--state-interval",
      "5",
      "--silent",
    ],
    {
      stdio: "inherit",
    }
  );

  try {
    await waitForAnvil(child);
  } catch (error) {
    await stopChild(child);
    throw error;
  }

  console.log(`Started Anvil at ${env.ANVIL_RPC_URL} with state ${statePath}`);

  return {
    stop: () => stopChild(child),
  };
}
