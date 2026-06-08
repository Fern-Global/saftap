import { Router, type Router as ExpressRouter } from "express";
import { asyncHandler } from "../../shared/async-handler.js";
import { fundWallet, getWalletBalance } from "./wallet.controller.js";

/**
 * Express router for wallet-related endpoints.
 */
export const walletRouter: ExpressRouter = Router();

walletRouter.post("/fund", asyncHandler(fundWallet));
walletRouter.get("/balance", asyncHandler(getWalletBalance));
