/**
 * M-Pesa Types
 * TypeScript interfaces for Daraja API integration
 */

/**
 * Parameters for calling the M-Pesa B2C payment API.
 */
export interface MpesaB2CParams {
  /** Recipient phone number in format +254XXXXXXXXX */
  phoneNumber: string;
  /** Amount in KES */
  amountKes: number;
  /** Unique transaction ID from our system */
  transactionId: string;
  /** Recipient name/label */
  recipientLabel: string;
}

/**
 * Parameters for calling the M-Pesa B2B payment API.
 */
export interface MpesaB2BParams {
  /** Till number (Paybill code or Till number) */
  tillNumber: string;
  /** Amount in KES */
  amountKes: number;
  /** Unique transaction ID from our system */
  transactionId: string;
  /** Account reference (required for Paybill) */
  accountRef?: string;
}

/**
 * Daraja OAuth Token Response
 */
/**
 * Response shape returned by the Daraja OAuth token endpoint.
 */
export interface DarajaTokenResponse {
  access_token: string;
  token_type: string;
  expires_in: number;
}

/**
 * Daraja B2C Request Body
 */
/**
 * Request payload sent to the Daraja B2C payment endpoint.
 */
export interface DarajaB2CRequestBody {
  OriginatorConversationID: string;
  InitiatorName: string;
  SecurityCredential: string;
  CommandID: "BusinessPayment";
  Amount: number;
  PartyA: string;
  PartyB: string;
  Remarks: string;
  QueueTimeOutURL: string;
  ResultURL: string;
}

/**
 * Daraja B2C Response
 */
/**
 * Response payload returned by a Daraja B2C payment request.
 */
export interface DarajaB2CResponse {
  OriginatorConversationID: string;
  ConversationID: string;
  ResponseDescription: string;
}

/**
 * Daraja B2B Request Body
 */
/**
 * Request payload sent to the Daraja B2B payment endpoint.
 */
export interface DarajaB2BRequestBody {
  OriginatorConversationID: string;
  InitiatorName: string;
  SecurityCredential: string;
  CommandID: "BusinessBuyGoods" | "BusinessPayBill";
  SenderIdentifierType: number;
  ReceiverIdentifierType: number;
  Amount: number;
  PartyA: string;
  PartyB: string;
  Remarks: string;
  AccountReference?: string;
  QueueTimeOutURL: string;
  ResultURL: string;
}

/**
 * Daraja B2B Response
 */
/**
 * Response payload returned by a Daraja B2B payment request.
 */
export interface DarajaB2BResponse {
  OriginatorConversationID: string;
  ConversationID: string;
  ResponseDescription: string;
}

/**
 * Callback Result from Daraja
 */
/**
 * Parsed result object from a Daraja webhook callback.
 */
export interface DarajaCallbackResult {
  ResultCode: number;
  ResultDesc: string;
  OriginatorConversationID: string;
  ConversationID: string;
  TransactionID: string;
  ReceiptNumber?: string;
}

/**
 * Callback metadata from Daraja
 */
/**
 * Metadata field data included in a Daraja callback response.
 */
export interface DarajaCallbackMetadata {
  Item?: Array<{
    Name: string;
    Value: string | number | boolean;
  }>;
}

/**
 * Daraja Webhook Callback Body
 * This is the structure Safaricom sends to our webhook endpoint
 */
/**
 * Full Daraja callback body structure received from the webhook.
 */
export interface DarajaCallbackBody {
  Result: DarajaCallbackResult;
  Metadata?: DarajaCallbackMetadata;
}

/**
 * Cached token with expiration
 */
/**
 * Cached Daraja access token metadata for reuse across requests.
 */
export interface CachedToken {
  token: string;
  expiresAt: number;
}
