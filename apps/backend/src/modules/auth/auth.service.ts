import bcrypt from "bcrypt";
import jwt, { type JwtPayload } from "jsonwebtoken";
import { Prisma, type User } from "@prisma/client";
import { OTP, NobleCryptoPlugin, ScureBase32Plugin } from "otplib";
const authenticator = new OTP({
  strategy: "totp",
  crypto: new NobleCryptoPlugin(),
  base32: new ScureBase32Plugin(),
});
import qrcode from "qrcode";
import { prisma } from "../../lib/prisma.js";
import { AppError } from "../../shared/errors.js";
import * as WalletService from "../wallet/wallet.service.js";
import type {
  AuthResponse,
  AuthTokenPayload,
  LoginDto,
  RegisterTouristDto,
  TwoFactorSetupResponse,
} from "./auth.types.js";

const PASSWORD_HASH_ROUNDS = 12;
const JWT_EXPIRES_IN = "24h";

function getJwtSecret(): string {
  const secret = process.env.JWT_SECRET;

  if (!secret) {
    throw new AppError("JWT secret is not configured", 500, false);
  }

  return secret;
}

function isUniqueConstraintError(error: unknown): boolean {
  return error instanceof Prisma.PrismaClientKnownRequestError && error.code === "P2002";
}

function assertAuthTokenPayload(payload: string | JwtPayload): AuthTokenPayload {
  if (
    typeof payload === "string" ||
    typeof payload.userId !== "string" ||
    typeof payload.walletAddress !== "string"
  ) {
    throw new AppError("Invalid token payload", 401);
  }

  return {
    userId: payload.userId,
    walletAddress: payload.walletAddress,
  };
}

function buildAuthResponse(user: User, walletAddress: string): AuthResponse {
  return {
    token: generateToken(user, walletAddress),
    user: {
      id: user.id,
      email: user.email,
      phone: user.phone,
      walletAddress,
    },
  };
}

export async function registerTourist(data: RegisterTouristDto): Promise<AuthResponse> {
  const passwordHash = await bcrypt.hash(data.password, PASSWORD_HASH_ROUNDS);
  let user: User | null = null;

  try {
    user = await prisma.user.create({
      data: {
        email: data.email,
        phone: data.phone,
        passwordHash,
        role: "TOURIST",
      },
    });

    const wallet = await WalletService.createWallet(user.id);

    return buildAuthResponse(user, wallet.address);
  } catch (error) {
    if (user) {
      await prisma.user.delete({ where: { id: user.id } }).catch(() => undefined);
    }

    if (isUniqueConstraintError(error)) {
      throw new AppError("An account with this email or phone already exists", 400);
    }

    if (error instanceof AppError) {
      throw error;
    }

    throw new AppError("Failed to register tourist", 500);
  }
}

export async function login(data: LoginDto): Promise<AuthResponse> {
  const user = await prisma.user.findUnique({
    where: { email: data.email },
    include: { wallet: true },
  });

  if (!user) {
    throw new AppError("Invalid email or password", 401);
  }

  const passwordMatches = await bcrypt.compare(data.password, user.passwordHash);

  if (!passwordMatches) {
    throw new AppError("Invalid email or password", 401);
  }

  if (user.isTwoFactorEnabled) {
    if (!data.totpCode) {
      return {
        requiresTwoFactor: true,
        userId: user.id,
      };
    }

    if (!user.twoFactorSecret) {
      throw new AppError("2FA is enabled but secret is missing", 500, false);
    }

    const result = await authenticator.verify({
      token: data.totpCode,
      secret: user.twoFactorSecret,
    });

    if (!result.valid) {
      throw new AppError("Invalid 2FA code", 401);
    }
  }

  if (!user.wallet) {
    throw new AppError("Wallet not found for user", 500, false);
  }

  return buildAuthResponse(user, user.wallet.baseAddress);
}

export async function setupTwoFactor(userId: string): Promise<TwoFactorSetupResponse> {
  const user = await prisma.user.findUnique({ where: { id: userId } });
  if (!user) {
    throw new AppError("User not found", 404);
  }

  const secret = authenticator.generateSecret();
  const otpauth = authenticator.generateURI({
    issuer: "Saftap",
    label: user.email,
    secret,
  });
  const qrCodeUrl = await qrcode.toDataURL(otpauth);

  await prisma.user.update({
    where: { id: userId },
    data: { twoFactorSecret: secret },
  });

  return { secret, qrCodeUrl };
}

export async function verifyAndEnableTwoFactor(userId: string, code: string): Promise<void> {
  const user = await prisma.user.findUnique({ where: { id: userId } });
  if (!user || !user.twoFactorSecret) {
    throw new AppError("2FA setup not initiated", 400);
  }

  const result = await authenticator.verify({
    token: code,
    secret: user.twoFactorSecret,
  });

  if (!result.valid) {
    throw new AppError("Invalid 2FA code", 400);
  }

  await prisma.user.update({
    where: { id: userId },
    data: { isTwoFactorEnabled: true },
  });
}

/**
 * Function performing generateToken operations in the backend.
 */
export function generateToken(user: Pick<User, "id">, walletAddress: string): string {
  return jwt.sign(
    {
      userId: user.id,
      walletAddress,
    } satisfies AuthTokenPayload,
    getJwtSecret(),
    { expiresIn: JWT_EXPIRES_IN }
  );
}

/**
 * Function performing verifyToken operations in the backend.
 */
export function verifyToken(token: string): AuthTokenPayload {
  try {
    return assertAuthTokenPayload(jwt.verify(token, getJwtSecret()));
  } catch (error) {
    if (error instanceof AppError) {
      throw error;
    }

    throw new AppError("Invalid or expired token", 401);
  }
}
