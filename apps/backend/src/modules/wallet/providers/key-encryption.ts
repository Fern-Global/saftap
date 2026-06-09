import { createCipheriv, createDecipheriv, createHash, randomBytes } from "node:crypto";
import type { Hex } from "viem";
import { env } from "../../../config/env.js";
import { AppError } from "../../../lib/app-error.js";

const ENCRYPTION_VERSION = "v1";
const IV_BYTES = 12;

function getEncryptionKey(): Buffer {
  return createHash("sha256")
    .update(env.WALLET_ENCRYPTION_KEY ?? env.JWT_SECRET)
    .digest();
}

export function encryptPrivateKey(privateKey: Hex): string {
  const iv = randomBytes(IV_BYTES);
  const cipher = createCipheriv("aes-256-gcm", getEncryptionKey(), iv);
  const ciphertext = Buffer.concat([cipher.update(privateKey, "utf8"), cipher.final()]);
  const authTag = cipher.getAuthTag();

  return [
    ENCRYPTION_VERSION,
    iv.toString("base64"),
    authTag.toString("base64"),
    ciphertext.toString("base64"),
  ].join(":");
}

export function decryptPrivateKey(payload: string): Hex {
  const [version, encodedIv, encodedAuthTag, encodedCiphertext] = payload.split(":");

  if (version !== ENCRYPTION_VERSION || !encodedIv || !encodedAuthTag || !encodedCiphertext) {
    throw new AppError("Wallet key payload is invalid", 500, "WALLET_KEY_INVALID");
  }

  try {
    const decipher = createDecipheriv(
      "aes-256-gcm",
      getEncryptionKey(),
      Buffer.from(encodedIv, "base64")
    );
    decipher.setAuthTag(Buffer.from(encodedAuthTag, "base64"));
    const privateKey = Buffer.concat([
      decipher.update(Buffer.from(encodedCiphertext, "base64")),
      decipher.final(),
    ]).toString("utf8");

    if (!/^0x[a-fA-F0-9]{64}$/.test(privateKey)) {
      throw new Error("Decrypted value is not an EVM private key");
    }

    return privateKey as Hex;
  } catch (error) {
    const appError = new AppError(
      "Wallet key could not be decrypted",
      500,
      "WALLET_KEY_DECRYPTION_FAILED"
    );
    appError.cause = error;
    throw appError;
  }
}
