import { describe, expect, it } from "vitest";

import { validateEmail, validatePassword, validatePhone, validateTotpCode } from "./validation";

describe("auth validation", () => {
  it("accepts syntactically valid email addresses", () => {
    expect(validateEmail("traveler@example.com")).toBe(true);
  });

  it("rejects invalid email addresses", () => {
    expect(validateEmail("traveler")).toBe(false);
    expect(validateEmail("traveler@")).toBe(false);
  });

  it("enforces minimum password length", () => {
    expect(validatePassword("1234567")).toBe(false);
    expect(validatePassword("12345678")).toBe(true);
  });

  it("validates phone and two-factor code lengths", () => {
    expect(validatePhone("123456")).toBe(false);
    expect(validatePhone("1234567")).toBe(true);
    expect(validateTotpCode("12345")).toBe(false);
    expect(validateTotpCode("123456")).toBe(true);
    expect(validateTotpCode("ABC123")).toBe(false);
  });
});
