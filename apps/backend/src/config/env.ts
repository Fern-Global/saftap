import { config as loadEnv } from "dotenv";
import { z } from "zod";

loadEnv();

const envSchema = z.object({
  CDP_API_KEY_ID: z.string().min(1, "CDP_API_KEY_ID is required"),
  CDP_API_KEY_SECRET: z.string().min(1, "CDP_API_KEY_SECRET is required"),
  CDP_APP_ID: z.string().min(1, "CDP_APP_ID is required"),
  BASE_SEPOLIA_RPC_URL: z.string().min(1, "BASE_SEPOLIA_RPC_URL is required"),
  USDC_CONTRACT_ADDRESS: z.string().min(1, "USDC_CONTRACT_ADDRESS is required"),
  TREASURY_WALLET_ADDRESS: z.string().min(1, "TREASURY_WALLET_ADDRESS is required"),
  TREASURY_PRIVATE_KEY: z.string().min(1, "TREASURY_PRIVATE_KEY is required"),
  DARAJA_CONSUMER_KEY: z.string().min(1, "DARAJA_CONSUMER_KEY is required"),
  DARAJA_CONSUMER_SECRET: z.string().min(1, "DARAJA_CONSUMER_SECRET is required"),
  DARAJA_SHORTCODE: z.string().min(1, "DARAJA_SHORTCODE is required"),
  DARAJA_PASSKEY: z.string().min(1, "DARAJA_PASSKEY is required"),
  JWT_SECRET: z.string().min(1, "JWT_SECRET is required"),
  DATABASE_URL: z.string().min(1, "DATABASE_URL is required"),
  PORT: z.coerce.number().int().positive("PORT must be a positive integer"),
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
