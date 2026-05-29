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
import { darajaService } from "./daraja.service.js";
import type { DarajaCallbackBody } from "./mpesa.types.js";

/**
 * Webhook router for handling Daraja callback requests.
 */
export const mpesaRouter: ExpressRouter = Router();

/**
 * POST /mpesa/callback
 *
 * Webhook endpoint for Daraja callbacks from Safaricom.
 * This endpoint:
 * 1. Immediately responds with HTTP 200 to Safaricom (so they don't retry)
 * 2. Asynchronously processes the callback body
 *
 * Note: This route is NOT protected with JWT authentication,
 * as Safaricom needs to be able to POST to it directly.
 */
mpesaRouter.post(
  "/callback",
  async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      // Immediately respond with 200 to Safaricom to prevent retries
      res.status(200).json({ message: "Callback received" });

      // Parse the callback body
      const callbackBody = req.body as DarajaCallbackBody;

      // Process callback asynchronously (don't await, fire-and-forget)
      // This ensures Safaricom gets a quick response
      darajaService.handleCallback(callbackBody).catch((error) => {
        console.error("Failed to process Daraja callback:", error);
      });
    } catch (error) {
      next(error);
    }
  }
);
