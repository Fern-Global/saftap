/**
 * Payment controller methods for the backend.
 */

import type { Request, Response } from "express";
import { prisma } from "../../lib/prisma.js";
import { AppError } from "../../lib/app-error.js";
import { paymentService } from "./payment.service.js";

function getUserId(request: Request): string {
  if (!request.user?.userId) {
    throw new AppError("Unauthorized", 401);
  }

  return request.user.userId;
}

export async function getRate(_request: Request, response: Response): Promise<void> {
  const rate = await paymentService.getExchangeRate();
  response.status(200).json({ rate });
}

export async function initiatePayment(request: Request, response: Response): Promise<void> {
  const userId = getUserId(request);
  const { destinationPhone, destinationTill, paybillNumber, accountRef, amountUsdc, savedPayeeId } =
    request.body;

  const transaction = await paymentService.initiatePayment({
    touristId: userId,
    destinationPhone,
    destinationTill,
    paybillNumber,
    accountRef,
    amountUsdc,
    savedPayeeId,
  });

  response.status(201).json(transaction);
}

export async function getPaymentHistory(request: Request, response: Response): Promise<void> {
  const userId = getUserId(request);
  const history = await paymentService.getTransactionHistory(userId);
  response.status(200).json(history);
}

export async function getPaymentById(request: Request, response: Response): Promise<void> {
  const userId = getUserId(request);
  const { id } = request.params;

  if (!id) {
    throw new AppError("Transaction ID is required", 400);
  }

  const transaction = await prisma.transaction.findUnique({
    where: { id },
    include: { savedPayee: true },
  });

  if (!transaction || transaction.userId !== userId) {
    throw new AppError("Transaction not found", 404);
  }

  response.status(200).json(transaction);
}
