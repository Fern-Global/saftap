import type { Request, Response } from "express";
import { prisma } from "../../lib/prisma.js";
import { AppError } from "../../shared/errors.js";
import { fundFromTreasury } from "./wallet.service.js";

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

  response.status(200).json({ balanceUsdc: wallet.usdcBalance.toString() });
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
  const updatedWallet = await prisma.wallet.update({
    where: { id: wallet.id },
    data: {
      usdcBalance: {
        increment: amountUsdc,
      },
    },
  });

  response.status(200).json({
    txHash,
    balanceUsdc: updatedWallet.usdcBalance.toString(),
  });
}
