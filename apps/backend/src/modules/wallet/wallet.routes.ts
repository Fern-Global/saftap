import { Router, type Router as ExpressRouter } from "express";
import { fundWallet, getWalletBalance } from "./wallet.controller.js";

/**
 * Express router for wallet-related endpoints.
 */
export const walletRouter: ExpressRouter = Router();

walletRouter.post("/fund", fundWallet);
walletRouter.get("/balance", getWalletBalance);
