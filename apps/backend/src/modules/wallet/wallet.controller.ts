import type { Request, Response } from "express";
import { prisma } from "../../lib/prisma.js";
import { AppError } from "../../shared/errors.js";
import { fundFromTreasury, getUsdcBalance } from "./wallet.service.js";

function getUserId(request: Request): string {
  const userId = request.user?.userId;

  if (!userId) {
    throw new AppError("Unauthorized", 401);
  }

  return userId;
}

export async function getWalletBalance(request: Request, response: Response): Promise<void> {
  const userId = getUserId(request);
  const wallet = await prisma.wallet.findUnique({ where: { userId } });

  if (!wallet) {
    throw new AppError("Wallet not found", 404);
  }

  const balanceUsdc = await getUsdcBalance(wallet.baseAddress);

  response.status(200).json({ balanceUsdc });
}

export async function fundWallet(request: Request, response: Response): Promise<void> {
  const userId = getUserId(request);
  const { amountUsdc } = request.body;

  if (typeof amountUsdc !== "number" || Number.isNaN(amountUsdc) || amountUsdc <= 0) {
    throw new AppError("amountUsdc must be a positive number", 400);
  }

  const wallet = await prisma.wallet.findUnique({ where: { userId } });

  if (!wallet) {
    throw new AppError("Wallet not found", 404);
  }

  const txHash = await fundFromTreasury(wallet.baseAddress, amountUsdc);

  response.status(200).json({ txHash });
}
