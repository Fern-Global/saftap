/**
 * Payment routes for the backend.
 */

import { Router, type Router as ExpressRouter } from "express";
import { asyncHandler } from "../../shared/async-handler.js";
import { authenticateJWT } from "../auth/auth.middleware.js";
import {
  getRate,
  initiatePayment,
  getPaymentHistory,
  getPaymentById,
} from "./payment.controller.js";

/**
 * Express router for payment-related API endpoints.
 */
export const paymentRouter: ExpressRouter = Router();

paymentRouter.get("/rate", asyncHandler(getRate));
paymentRouter.post("/initiate", authenticateJWT, asyncHandler(initiatePayment));
paymentRouter.get("/history", authenticateJWT, asyncHandler(getPaymentHistory));
paymentRouter.get("/:id", authenticateJWT, asyncHandler(getPaymentById));
