/**
 * M-Pesa Webhook Routes
 * Handles Daraja callbacks from Safaricom
 */

import {
  Router,
  type Request,
  type Response,
  type NextFunction,
  type Router as ExpressRouter,
} from "express";
import { prisma } from "../../lib/prisma.js";
import { AppError } from "../../shared/errors.js";
import { authenticateJWT } from "../auth/auth.middleware.js";
import { asyncHandler } from "../../shared/async-handler.js";
import { darajaService } from "./daraja.service.js";
import type { DarajaCallbackBody } from "./mpesa.types.js";

/**
 * Webhook router for handling Daraja callback requests.
 */
export const mpesaRouter: ExpressRouter = Router();

/**
 * POST /api/mpesa/callback
 *
 * Webhook endpoint for Daraja callbacks from Safaricom.
 * This endpoint:
 * 1. Persists the callback result
 * 2. Responds with HTTP 200 so Safaricom does not retry a completed update
 *
 * Note: This route is NOT protected with JWT authentication,
 * as Safaricom needs to be able to POST to it directly.
 */
mpesaRouter.post(
  "/callback",
  async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const callbackBody = req.body as DarajaCallbackBody;
      await darajaService.handleCallback(callbackBody);
      res.status(200).json({ message: "Callback received" });
    } catch (error) {
      next(error);
    }
  }
);

mpesaRouter.get(
  "/status/:transactionId",
  authenticateJWT,
  asyncHandler(async (req: Request, res: Response): Promise<void> => {
    const { transactionId } = req.params;
    const userId = req.user?.userId;

    if (!transactionId) {
      throw new AppError("Transaction ID is required", 400);
    }

    if (!userId) {
      throw new AppError("Unauthorized", 401);
    }

    const transaction = await prisma.transaction.findFirst({
      where: {
        id: transactionId,
        userId,
      },
      include: {
        savedPayee: true,
      },
    });

    if (!transaction) {
      throw new AppError("Transaction not found", 404);
    }

    res.set("Cache-Control", "no-store");
    res.status(200).json(transaction);
  })
);
