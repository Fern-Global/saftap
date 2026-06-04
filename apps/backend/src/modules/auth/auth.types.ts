import { z } from "zod";

/**
 * Zod schema validating tourist registration payloads.
 */
export const registerTouristSchema = z
  .object({
    email: z.string().trim().email("Email must be a valid email address").toLowerCase(),
    phone: z.string().trim().min(7, "Phone number must be at least 7 characters"),
    password: z.string().min(8, "Password must be at least 8 characters"),
  })
  .strict();

/**
 * Zod schema validating login payloads.
 */
export const loginSchema = z
  .object({
    email: z.string().trim().email("Email must be a valid email address").toLowerCase(),
    password: z.string().min(1, "Password is required"),
    totpCode: z.string().length(6).optional(),
  })
  .strict();

/**
 * Zod schema for verifying and enabling 2FA.
 */
export const verifyTwoFactorSchema = z
  .object({
    code: z.string().length(6, "Code must be 6 digits"),
  })
  .strict();

/**
 * DTO representing tourist registration request data.
 */
export type RegisterTouristDto = z.infer<typeof registerTouristSchema>;
/**
 * DTO representing login request data.
 */
export type LoginDto = z.infer<typeof loginSchema>;
/**
 * DTO representing 2FA verification request data.
 */
export type VerifyTwoFactorDto = z.infer<typeof verifyTwoFactorSchema>;

/**
 * Authenticated user details returned by auth endpoints.
 */
export interface AuthUser {
  id: string;
  email: string;
  phone: string;
  walletAddress: string;
}

/**
 * JWT payload shape containing authenticated user identity and wallet address.
 */
export interface AuthTokenPayload {
  userId: string;
  walletAddress: string;
}

/**
 * Authentication response returned from login and registration calls.
 */
export type AuthResponse = 
  | {
      token: string;
      user: AuthUser;
    }
  | {
      requiresTwoFactor: true;
      userId: string;
    };

/**
 * Response for 2FA setup.
 */
export interface TwoFactorSetupResponse {
  secret: string;
  qrCodeUrl: string;
}
