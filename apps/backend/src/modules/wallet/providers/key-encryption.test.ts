import { describe, expect, it } from "vitest";
import { decryptPrivateKey, encryptPrivateKey } from "./key-encryption.js";

const privateKey = `0x${"12".repeat(32)}` as const;

describe("wallet key encryption", () => {
  it("round-trips a private key without storing it as plaintext", () => {
    const encrypted = encryptPrivateKey(privateKey);

    expect(encrypted).not.toContain(privateKey);
    expect(decryptPrivateKey(encrypted)).toBe(privateKey);
  });

  it("rejects a tampered encrypted key", () => {
    const encrypted = encryptPrivateKey(privateKey);
    const tampered = `${encrypted.slice(0, -1)}${encrypted.endsWith("A") ? "B" : "A"}`;

    expect(() => decryptPrivateKey(tampered)).toThrow("Wallet key could not be decrypted");
  });
});
