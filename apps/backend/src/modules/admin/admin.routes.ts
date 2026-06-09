import { timingSafeEqual } from "node:crypto";
import { Router, type Request, type Response, type Router as ExpressRouter } from "express";
import { env } from "../../config/env.js";
import { resetDemoData } from "../../demo/demo-data.service.js";
import { prisma } from "../../lib/prisma.js";
import { AppError } from "../../shared/errors.js";
import { asyncHandler } from "../../shared/async-handler.js";

export const adminRouter: ExpressRouter = Router();

function requireAdminApiKey(request: Request): void {
  if (env.APP_ENV !== "demo") {
    throw new AppError("Demo reset is only available in the demo environment", 404);
  }

  if (!env.ADMIN_API_KEY) {
    throw new AppError("ADMIN_API_KEY is not configured", 503);
  }

  const authorization = request.header("Authorization");
  const providedKey = authorization?.startsWith("Bearer ")
    ? authorization.slice("Bearer ".length).trim()
    : "";
  const expected = Buffer.from(env.ADMIN_API_KEY);
  const provided = Buffer.from(providedKey);

  if (expected.length !== provided.length || !timingSafeEqual(expected, provided)) {
    throw new AppError("Unauthorized", 401);
  }
}

adminRouter.post(
  "/demo-reset",
  asyncHandler(async (request: Request, response: Response): Promise<void> => {
    requireAdminApiKey(request);
    await resetDemoData(prisma);
    response.status(200).json({ success: true, message: "Demo data reset complete" });
  })
);
