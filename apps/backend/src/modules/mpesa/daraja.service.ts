/**
 * Daraja M-Pesa Service
 * Handles all M-Pesa operations via Safaricom's Daraja API
 */

import { Prisma, TransactionStatus } from "@prisma/client";
import { constants, publicEncrypt } from "node:crypto";
import { env } from "../../config/env.js";
import { AppError, wrapExternalError } from "../../lib/app-error.js";
import { prisma } from "../../lib/prisma.js";
import type {
  CachedToken,
  DarajaB2BRequestBody,
  DarajaB2BResponse,
  DarajaB2CRequestBody,
  DarajaB2CResponse,
  DarajaCallbackBody,
  DarajaErrorResponse,
  DarajaTokenResponse,
  MpesaB2BParams,
  MpesaB2CParams,
} from "./mpesa.types.js";

const TOKEN_EXPIRY_BUFFER_MS = 5 * 60 * 1000; // Refresh 5 minutes before expiry

let cachedToken: CachedToken | null = null;

type DarajaTransactionUpdate = Prisma.TransactionUncheckedUpdateInput & {
  darajaReceiverName?: string | null;
};

function isSandbox(): boolean {
  return new URL(env.DARAJA_BASE_URL).hostname.includes("sandbox");
}

function getDarajaUrl(path: string): string {
  return new URL(path, env.DARAJA_BASE_URL).toString();
}

function getCallbackUrl(): string {
  const baseUrl = env.WEBHOOK_BASE_URL ?? `http://localhost:${env.PORT}`;
  return new URL("/api/mpesa/callback", baseUrl).toString();
}

function getB2cRecipient(phoneNumber: string): string {
  const requestedRecipient = phoneNumber.replace(/^\+/, "");

  return isSandbox() && env.DARAJA_SANDBOX_B2C_MSISDN
    ? env.DARAJA_SANDBOX_B2C_MSISDN
    : requestedRecipient;
}

async function getDarajaError(response: Response): Promise<DarajaErrorResponse> {
  return (await response.json().catch(() => ({}))) as DarajaErrorResponse;
}

/**
 * Get cached access token or request a new one from Daraja
 */
async function getAccessToken(): Promise<string> {
  const now = Date.now();

  // Return cached token if valid
  if (cachedToken && cachedToken.expiresAt > now) {
    return cachedToken.token;
  }

  try {
    const credentials = Buffer.from(
      `${env.DARAJA_CONSUMER_KEY}:${env.DARAJA_CONSUMER_SECRET}`
    ).toString("base64");

    const response = await fetch(getDarajaUrl("/oauth/v1/generate?grant_type=client_credentials"), {
      method: "GET",
      headers: {
        Authorization: `Basic ${credentials}`,
      },
    });

    if (!response.ok) {
      throw new Error(`OAuth server returned ${response.status}`);
    }

    const data = (await response.json()) as DarajaTokenResponse;

    if (!data.access_token || !data.expires_in) {
      throw new Error("Invalid token response structure");
    }

    // Cache the token with buffer for refresh
    cachedToken = {
      token: data.access_token,
      expiresAt: now + data.expires_in * 1000 - TOKEN_EXPIRY_BUFFER_MS,
    };

    return data.access_token;
  } catch (error) {
    throw wrapExternalError("Failed to obtain M-Pesa access token", "DARAJA_TOKEN_ERROR", error);
  }
}

/**
 * Encrypt password for Daraja requests
 * Sandbox accepts the configured test credential. Live APIs require the
 * initiator password encrypted with Safaricom's X.509 public certificate.
 */
function encryptPassword(): string {
  if (isSandbox()) {
    return (
      env.DARAJA_SANDBOX_SECURITY_CREDENTIAL ?? Buffer.from(env.DARAJA_PASSKEY).toString("base64")
    );
  }

  const certificate = env.DARAJA_PUBLIC_CERTIFICATE?.replace(/\\n/g, "\n").trim();

  if (!certificate) {
    throw new AppError(
      "DARAJA_PUBLIC_CERTIFICATE is required for live Daraja payments",
      500,
      "DARAJA_CERTIFICATE_MISSING"
    );
  }

  try {
    return publicEncrypt(
      {
        key: certificate,
        padding: constants.RSA_PKCS1_PADDING,
      },
      Buffer.from(env.DARAJA_PASSKEY, "utf8")
    ).toString("base64");
  } catch (error) {
    throw wrapExternalError(
      "Failed to encrypt the Daraja security credential",
      "DARAJA_CREDENTIAL_ENCRYPTION_ERROR",
      error
    );
  }
}

function getResultParameter(
  result: DarajaCallbackBody["Result"],
  ...keys: string[]
): string | number | boolean | undefined {
  const parameters = result.ResultParameters?.ResultParameter ?? [];
  const keySet = new Set(keys.map((key) => key.toLowerCase()));

  return parameters.find((parameter) => keySet.has(parameter.Key.toLowerCase()))?.Value;
}

function asNonEmptyString(value: unknown): string | undefined {
  return typeof value === "string" && value.trim() ? value.trim() : undefined;
}

function asAmount(value: unknown): number | undefined {
  const amount = typeof value === "number" ? value : Number(value);
  return Number.isFinite(amount) && amount >= 0 ? amount : undefined;
}

/**
 * Send money to M-Pesa (B2C - Business to Consumer)
 */
async function sendToMpesa(params: MpesaB2CParams): Promise<DarajaB2CResponse> {
  try {
    const accessToken = await getAccessToken();

    const requestBody: DarajaB2CRequestBody = {
      OriginatorConversationID: params.transactionId,
      InitiatorName: env.DARAJA_SHORTCODE,
      SecurityCredential: encryptPassword(),
      CommandID: "BusinessPayment",
      Amount: Math.round(params.amountKes),
      PartyA: env.DARAJA_SHORTCODE,
      PartyB: getB2cRecipient(params.phoneNumber),
      Remarks: `Payment to ${params.recipientLabel}`,
      QueueTimeOutURL: getCallbackUrl(),
      ResultURL: getCallbackUrl(),
    };

    const response = await fetch(getDarajaUrl("/mpesa/b2c/v3/paymentrequest"), {
      method: "POST",
      headers: {
        Authorization: `Bearer ${accessToken}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify(requestBody),
    });

    if (!response.ok) {
      const providerError = await getDarajaError(response);
      const detail = providerError.errorMessage ?? `HTTP ${response.status}`;
      throw new AppError(
        `M-Pesa rejected the payment: ${detail}`,
        422,
        providerError.errorCode ?? "DARAJA_B2C_REJECTED"
      );
    }

    const data = (await response.json()) as DarajaB2CResponse;

    if (!data.OriginatorConversationID) {
      throw new Error("Invalid B2C response structure");
    }

    return data;
  } catch (error) {
    if (error instanceof AppError) {
      throw error;
    }
    throw wrapExternalError("Failed to send payment to M-Pesa", "DARAJA_B2C_ERROR", error);
  }
}

/**
 * Send money to Till (B2B - Business to Business)
 */
async function sendToTill(params: MpesaB2BParams): Promise<DarajaB2BResponse> {
  try {
    const accessToken = await getAccessToken();

    const commandId = params.accountRef ? "BusinessPayBill" : "BusinessBuyGoods";

    const requestBody: DarajaB2BRequestBody = {
      OriginatorConversationID: params.transactionId,
      InitiatorName: env.DARAJA_SHORTCODE,
      SecurityCredential: encryptPassword(),
      CommandID: commandId,
      SenderIdentifierType: 4, // Shortcode
      ReceiverIdentifierType: 4, // Till/Paybill
      Amount: Math.round(params.amountKes),
      PartyA: env.DARAJA_SHORTCODE,
      PartyB: params.tillNumber,
      Remarks: `Payment to Till ${params.tillNumber}`,
      AccountReference: params.accountRef,
      QueueTimeOutURL: getCallbackUrl(),
      ResultURL: getCallbackUrl(),
    };

    const response = await fetch(getDarajaUrl("/mpesa/b2b/v1/paymentrequest"), {
      method: "POST",
      headers: {
        Authorization: `Bearer ${accessToken}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify(requestBody),
    });

    if (!response.ok) {
      const providerError = await getDarajaError(response);
      const detail = providerError.errorMessage ?? `HTTP ${response.status}`;
      throw new AppError(
        `M-Pesa rejected the till payment: ${detail}`,
        422,
        providerError.errorCode ?? "DARAJA_B2B_REJECTED"
      );
    }

    const data = (await response.json()) as DarajaB2BResponse;

    if (!data.OriginatorConversationID) {
      throw new Error("Invalid B2B response structure");
    }

    return data;
  } catch (error) {
    if (error instanceof AppError) {
      throw error;
    }
    throw wrapExternalError("Failed to send payment to Till", "DARAJA_B2B_ERROR", error);
  }
}

/**
 * Handle Daraja webhook callback
 * Updates transaction status based on result code
 */
async function handleCallback(body: DarajaCallbackBody): Promise<void> {
  if (!body.Result) {
    throw new AppError("Invalid callback body: missing Result field", 400);
  }

  const { ResultCode, OriginatorConversationID, ReceiptNumber, TransactionID } = body.Result;

  const transaction = await prisma.transaction.findUnique({
    where: { id: OriginatorConversationID },
  });

  if (!transaction) {
    console.warn(`Callback received for unknown transaction ID: ${OriginatorConversationID}`);
    return;
  }

  const isSuccessful = ResultCode === 0;
  const receiptNumber =
    asNonEmptyString(getResultParameter(body.Result, "TransactionReceipt", "ReceiptNumber")) ??
    asNonEmptyString(ReceiptNumber) ??
    asNonEmptyString(TransactionID);
  const transactionAmount = asAmount(
    getResultParameter(body.Result, "TransactionAmount", "Amount")
  );
  const receiverName = asNonEmptyString(
    getResultParameter(body.Result, "ReceiverPartyPublicName", "ReceiverRegisteredCustomerName")
  );

  const updateData: DarajaTransactionUpdate = isSuccessful
    ? {
        status: TransactionStatus.COMPLETED,
        ...(receiptNumber ? { darajaReceiptId: receiptNumber } : {}),
        ...(transactionAmount !== undefined ? { amountKes: transactionAmount } : {}),
        ...(receiverName ? { darajaReceiverName: receiverName } : {}),
      }
    : {
        status: TransactionStatus.FAILED,
        darajaReceiptId: null,
        darajaReceiverName: null,
      };

  await prisma.transaction.update({
    where: { id: OriginatorConversationID },
    data: updateData,
  });
}

/**
 * Simulate callback for testing/demo purposes
 * Updates a transaction to COMPLETED after a delay
 */
async function simulateCallback(transactionId: string): Promise<void> {
  try {
    // Wait 3 seconds before marking as completed
    await new Promise((resolve) => setTimeout(resolve, 3000));

    const transaction = await prisma.transaction.findUnique({
      where: { id: transactionId },
    });

    if (!transaction) {
      console.warn(`Simulation: transaction not found: ${transactionId}`);
      return;
    }

    // Update transaction status to COMPLETED
    await prisma.transaction.update({
      where: { id: transactionId },
      data: {
        status: TransactionStatus.COMPLETED,
        darajaReceiptId: `SIM-${Date.now()}`,
      },
    });

    console.log(`Simulated callback for transaction ${transactionId}`);
  } catch (error) {
    console.error("Error simulating callback:", error);
  }
}

/**
 * Daraja service methods for token acquisition, B2B and B2C payments, and callbacks.
 */
export const darajaService = {
  getAccessToken,
  sendToMpesa,
  sendToTill,
  handleCallback,
  simulateCallback,
};
