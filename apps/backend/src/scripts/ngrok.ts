import { readFile, writeFile } from "node:fs/promises";
import { fileURLToPath } from "node:url";
import { config as loadEnv } from "dotenv";
import ngrok from "@ngrok/ngrok";

const envPath = fileURLToPath(new URL("../../.env", import.meta.url));

loadEnv({ path: envPath });

function setEnvValue(contents: string, name: string, value: string): string {
  const line = `${name}=${value}`;
  const pattern = new RegExp(`^${name}=.*$`, "m");

  if (pattern.test(contents)) {
    return contents.replace(pattern, line);
  }

  return `${contents.trimEnd()}\n${line}\n`;
}

async function main(): Promise<void> {
  if (!process.env.NGROK_AUTHTOKEN?.trim()) {
    throw new Error(
      "NGROK_AUTHTOKEN is missing. Add it to apps/backend/.env before starting the tunnel."
    );
  }

  const port = Number(process.env.PORT ?? "4000");

  if (!Number.isInteger(port) || port <= 0) {
    throw new Error("PORT must be a positive integer.");
  }

  const listener = await ngrok.forward({
    addr: `localhost:${port}`,
    authtoken_from_env: true,
  });
  const publicUrl = listener.url();

  if (!publicUrl) {
    await listener.close();
    throw new Error("Ngrok did not return a public URL.");
  }

  const envContents = await readFile(envPath, "utf8");
  await writeFile(envPath, setEnvValue(envContents, "WEBHOOK_BASE_URL", publicUrl));

  console.log(`Ngrok tunnel: ${publicUrl} -> http://localhost:${port}`);
  console.log(`Daraja callback: ${publicUrl}/webhooks/callback`);
  console.log("WEBHOOK_BASE_URL was updated in apps/backend/.env.");
  console.log("Start or restart the backend now, and keep this process running.");

  const close = async (): Promise<void> => {
    await listener.close();
    process.exit(0);
  };

  process.once("SIGINT", () => void close());
  process.once("SIGTERM", () => void close());

  await new Promise(() => undefined);
}

main().catch((error: unknown) => {
  console.error(error instanceof Error ? error.message : error);
  process.exit(1);
});
