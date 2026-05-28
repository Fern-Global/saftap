/**
 * Payment routes for the backend.
 */

import { Router, type Router as ExpressRouter } from "express";
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

paymentRouter.get("/rate", getRate);
paymentRouter.post("/initiate", authenticateJWT, initiatePayment);
paymentRouter.get("/history", authenticateJWT, getPaymentHistory);
paymentRouter.get("/:id", authenticateJWT, getPaymentById);
