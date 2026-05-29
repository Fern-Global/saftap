/**
 * Daraja M-Pesa Service
 * Handles all M-Pesa operations via Safaricom's Daraja API
 */

import { TransactionStatus } from "@prisma/client";
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
  DarajaTokenResponse,
  MpesaB2BParams,
  MpesaB2CParams,
} from "./mpesa.types.js";

const OAUTH_URL = "https://sandbox.safaricom.co.ke/oauth/v1/generate?grant_type=client_credentials";
const B2C_URL = "https://sandbox.safaricom.co.ke/mpesa/b2c/v3/paymentrequest";
const B2B_URL = "https://sandbox.safaricom.co.ke/mpesa/b2b/v1/paymentrequest";
const TOKEN_EXPIRY_BUFFER_MS = 5 * 60 * 1000; // Refresh 5 minutes before expiry

let cachedToken: CachedToken | null = null;

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

    const response = await fetch(OAUTH_URL, {
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
 * Uses the Safaricom sandbox security credentials
 */
function encryptPassword(): string {
  // In sandbox, we use the passkey directly. In production, this would be encrypted using RSA.
  // For this implementation, we'll return the passkey as-is for sandbox
  return Buffer.from(env.DARAJA_PASSKEY).toString("base64");
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
      PartyB: params.phoneNumber.replace(/^\+/, ""), // Remove + prefix if present
      Remarks: `Payment to ${params.recipientLabel}`,
      QueueTimeOutURL: `${process.env.WEBHOOK_BASE_URL || "http://localhost:3000"}/mpesa/callback`,
      ResultURL: `${process.env.WEBHOOK_BASE_URL || "http://localhost:3000"}/mpesa/callback`,
    };

    const response = await fetch(B2C_URL, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${accessToken}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify(requestBody),
    });

    if (!response.ok) {
      throw new Error(`B2C API returned ${response.status}`);
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
      QueueTimeOutURL: `${process.env.WEBHOOK_BASE_URL || "http://localhost:3000"}/mpesa/callback`,
      ResultURL: `${process.env.WEBHOOK_BASE_URL || "http://localhost:3000"}/mpesa/callback`,
    };

    const response = await fetch(B2B_URL, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${accessToken}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify(requestBody),
    });

    if (!response.ok) {
      throw new Error(`B2B API returned ${response.status}`);
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
  try {
    if (!body.Result) {
      throw new AppError("Invalid callback body: missing Result field", 400);
    }

    const { ResultCode, OriginatorConversationID, ReceiptNumber } = body.Result;

    // Find transaction by the OriginatorConversationID (which we set to transactionId)
    const transaction = await prisma.transaction.findUnique({
      where: { id: OriginatorConversationID },
    });

    if (!transaction) {
      // Transaction not found, but don't fail - just log it
      console.warn(`Callback received for unknown transaction ID: ${OriginatorConversationID}`);
      return;
    }

    // ResultCode 0 = Success, anything else is failure
    const status = ResultCode === 0 ? TransactionStatus.COMPLETED : TransactionStatus.FAILED;

    // Update transaction status
    await prisma.transaction.update({
      where: { id: OriginatorConversationID },
      data: {
        status,
        darajaReceiptId: ReceiptNumber || undefined,
      },
    });
  } catch (error) {
    // Log error but don't throw - webhook handler must always succeed
    console.error("Error processing Daraja callback:", error);
  }
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
