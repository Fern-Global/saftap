import { config as loadEnv } from "dotenv";
import { z } from "zod";

loadEnv();

const productionCredentialNames = [
  "CDP_API_KEY_ID",
  "CDP_API_KEY_SECRET",
  "CDP_WALLET_SECRET",
  "CDP_APP_ID",
  "BASE_RPC_URL",
  "TREASURY_WALLET_ADDRESS",
] as const;

const envSchema = z
  .object({
    APP_ENV: z.enum(["local", "demo", "production"]).default("local"),
    ADMIN_API_KEY: z.string().min(32, "ADMIN_API_KEY must be at least 32 characters").optional(),
    ANVIL_FORK_URL: z.string().url("ANVIL_FORK_URL must be a valid URL").optional(),
    ANVIL_RPC_URL: z
      .string()
      .url("ANVIL_RPC_URL must be a valid URL")
      .default("http://127.0.0.1:8545"),
    ANVIL_STATE_PATH: z.string().min(1).default(".anvil/state.json"),
    ANVIL_USDC_WHALE_ADDRESS: z
      .string()
      .regex(/^0x[a-fA-F0-9]{40}$/, "ANVIL_USDC_WHALE_ADDRESS must be an EVM address")
      .optional(),
    WALLET_ENCRYPTION_KEY: z.string().min(32).optional(),
    CDP_API_KEY_ID: z.string().optional(),
    CDP_API_KEY_SECRET: z.string().optional(),
    CDP_WALLET_SECRET: z.string().optional(),
    CDP_APP_ID: z.string().optional(),
    BASE_RPC_URL: z.string().url("BASE_RPC_URL must be a valid URL").optional(),
    TREASURY_WALLET_ADDRESS: z.string().optional(),
    DARAJA_BASE_URL: z
      .string()
      .url("DARAJA_BASE_URL must be a valid URL")
      .default("https://sandbox.safaricom.co.ke"),
    DARAJA_CONSUMER_KEY: z.string().min(1, "DARAJA_CONSUMER_KEY is required"),
    DARAJA_CONSUMER_SECRET: z.string().min(1, "DARAJA_CONSUMER_SECRET is required"),
    DARAJA_SHORTCODE: z.string().min(1, "DARAJA_SHORTCODE is required"),
    DARAJA_PASSKEY: z.string().min(1, "DARAJA_PASSKEY is required"),
    DARAJA_PUBLIC_CERTIFICATE: z.string().optional(),
    DARAJA_SANDBOX_SECURITY_CREDENTIAL: z.string().optional(),
    DARAJA_SANDBOX_B2C_MSISDN: z
      .string()
      .regex(/^\d{10,15}$/, "DARAJA_SANDBOX_B2C_MSISDN must contain 10 to 15 digits")
      .optional(),
    WEBHOOK_BASE_URL: z.string().url("WEBHOOK_BASE_URL must be a valid URL").optional(),
    JWT_SECRET: z.string().min(1, "JWT_SECRET is required"),
    DATABASE_URL: z.string().min(1, "DATABASE_URL is required"),
    PORT: z.coerce.number().int().positive("PORT must be a positive integer"),
  })
  .superRefine((values, context) => {
    const isDarajaSandbox = new URL(values.DARAJA_BASE_URL).hostname.includes("sandbox");

    if (!isDarajaSandbox && !values.DARAJA_PUBLIC_CERTIFICATE?.trim()) {
      context.addIssue({
        code: z.ZodIssueCode.custom,
        message: "DARAJA_PUBLIC_CERTIFICATE is required for live Daraja APIs",
        path: ["DARAJA_PUBLIC_CERTIFICATE"],
      });
    }

    if (values.APP_ENV === "local" || values.APP_ENV === "demo") {
      if (!values.ANVIL_FORK_URL) {
        context.addIssue({
          code: z.ZodIssueCode.custom,
          message: `ANVIL_FORK_URL is required when APP_ENV=${values.APP_ENV}`,
          path: ["ANVIL_FORK_URL"],
        });
      }

      if (!values.TREASURY_WALLET_ADDRESS?.trim()) {
        context.addIssue({
          code: z.ZodIssueCode.custom,
          message: `TREASURY_WALLET_ADDRESS is required when APP_ENV=${values.APP_ENV}`,
          path: ["TREASURY_WALLET_ADDRESS"],
        });
      }
    }

    if (values.APP_ENV === "production") {
      for (const name of productionCredentialNames) {
        const value = values[name];

        if (!value?.trim() || value.startsWith("your_")) {
          context.addIssue({
            code: z.ZodIssueCode.custom,
            message: `${name} is required when APP_ENV=production`,
            path: [name],
          });
        }
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
