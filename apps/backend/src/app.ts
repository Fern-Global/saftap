/**
 * Express application setup for the backend.
 */

import cors from "cors";
import express, { type Express } from "express";
import helmet from "helmet";
import morgan from "morgan";
import rateLimit from "express-rate-limit";
import { authRouter } from "./modules/auth/auth.routes.js";
import { authenticateJWT } from "./modules/auth/auth.middleware.js";
import { walletRouter } from "./modules/wallet/wallet.routes.js";
import { paymentRouter } from "./modules/payment/payment.routes.js";
import { payeesRouter } from "./modules/payees/payees.routes.js";
import { mpesaRouter } from "./modules/mpesa/mpesa.routes.js";
import { AppError } from "./lib/app-error.js";
import packageJson from "../package.json" with { type: "json" };

const app: Express = express();
const version = String(packageJson.version ?? "0.0.0");

const globalRateLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 100,
  standardHeaders: true,
  legacyHeaders: false,
  message: { success: false, error: "Too many requests, please try again later." },
});

const authRateLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 10,
  standardHeaders: true,
  legacyHeaders: false,
  message: { success: false, error: "Too many auth attempts, please try again later." },
});

app.set("trust proxy", 1);
app.use(globalRateLimiter);
app.use(helmet());
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(morgan("dev"));

app.get("/health", (_request, response) => {
  response.json({
    status: "ok",
    timestamp: new Date().toISOString(),
    version,
  });
});

app.use("/api/auth", authRateLimiter, authRouter);
app.use("/api/wallet", authenticateJWT, walletRouter);
app.use("/api/payment", paymentRouter);
app.use("/api/payees", authenticateJWT, payeesRouter);
app.use("/webhooks", mpesaRouter);

app.use((_request, response) => {
  response.status(404).json({ success: false, error: "Not Found" });
});

app.use(
  (
    error: unknown,
    _request: express.Request,
    response: express.Response,
    _next: express.NextFunction
  ) => {
    if (error instanceof AppError) {
      response.status(error.statusCode).json({ success: false, error: error.message });
      return;
    }

    console.error(error);
    response.status(500).json({ success: false, error: "Internal server error" });
  }
);

export { app };
