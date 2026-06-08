import { config as loadEnv } from "dotenv";
import { z } from "zod";

loadEnv();

const cryptoCredentialNames = [
  "CDP_API_KEY_ID",
  "CDP_API_KEY_SECRET",
  "CDP_WALLET_SECRET",
  "CDP_APP_ID",
  "BASE_SEPOLIA_RPC_URL",
  "USDC_CONTRACT_ADDRESS",
  "TREASURY_WALLET_ADDRESS",
  "TREASURY_PRIVATE_KEY",
] as const;

const envSchema = z
  .object({
    CRYPTO_WALLET_MODE: z.enum(["real", "mock"]).default("real"),
    MOCK_WALLET_INITIAL_BALANCE_USDC: z.coerce.number().nonnegative().default(100),
    CDP_API_KEY_ID: z.string().optional(),
    CDP_API_KEY_SECRET: z.string().optional(),
    CDP_WALLET_SECRET: z.string().optional(),
    CDP_APP_ID: z.string().optional(),
    BASE_SEPOLIA_RPC_URL: z.string().optional(),
    USDC_CONTRACT_ADDRESS: z.string().optional(),
    TREASURY_WALLET_ADDRESS: z.string().optional(),
    TREASURY_PRIVATE_KEY: z.string().optional(),
    DARAJA_BASE_URL: z
      .string()
      .url("DARAJA_BASE_URL must be a valid URL")
      .default("https://sandbox.safaricom.co.ke"),
    DARAJA_CONSUMER_KEY: z.string().min(1, "DARAJA_CONSUMER_KEY is required"),
    DARAJA_CONSUMER_SECRET: z.string().min(1, "DARAJA_CONSUMER_SECRET is required"),
    DARAJA_SHORTCODE: z.string().min(1, "DARAJA_SHORTCODE is required"),
    DARAJA_PASSKEY: z.string().min(1, "DARAJA_PASSKEY is required"),
    WEBHOOK_BASE_URL: z
      .string()
      .url("WEBHOOK_BASE_URL must be a valid URL")
      .optional(),
    JWT_SECRET: z.string().min(1, "JWT_SECRET is required"),
    DATABASE_URL: z.string().min(1, "DATABASE_URL is required"),
    PORT: z.coerce.number().int().positive("PORT must be a positive integer"),
  })
  .superRefine((values, context) => {
    if (values.CRYPTO_WALLET_MODE === "mock") {
      return;
    }

    for (const name of cryptoCredentialNames) {
      const value = values[name];

      if (!value?.trim() || value.startsWith("your_")) {
        context.addIssue({
          code: z.ZodIssueCode.custom,
          message: `${name} is required when CRYPTO_WALLET_MODE=real`,
          path: [name],
        });
      }
    }
  });

const parsedEnv = envSchema.safeParse(process.env);

if (!parsedEnv.success) {
  const formattedIssues = parsedEnv.error.issues
    .map((issue) => {
      const envName = issue.path.join(".");
      return `- ${envName}: ${issue.message}`;
    })
    .join("\n");

  throw new Error(
    `Invalid environment configuration. Please check your .env or deployment env vars:\n${formattedIssues}`
  );
}

/**
 * Validated environment variables used by the backend.
 */
export const env = parsedEnv.data;

/**
 * Reads a required environment variable and throws if it is missing.
 */
export function getRequiredEnv(name: string): string {
  const value = process.env[name];

  if (!value) {
    throw new Error(`${name} is required`);
  }

  return value;
}

/**
 * Reads an optional environment variable or returns a fallback value.
 */
export function getOptionalEnv(name: string, fallback: string): string {
  return process.env[name] ?? fallback;
}
