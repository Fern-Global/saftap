import type { NextFunction, Request, Response } from "express";
import { AppError } from "../../shared/errors.js";
import { verifyToken } from "./auth.service.js";
import type { AuthTokenPayload } from "./auth.types.js";

declare global {
  namespace Express {
    interface Request {
      user?: AuthTokenPayload;
    }
  }
}

/**
 * Express middleware that validates JWT bearer tokens.
 */
export function authenticateJWT(request: Request, response: Response, next: NextFunction): void {
  const authorization = request.header("Authorization");

  if (!authorization?.startsWith("Bearer ")) {
    response.status(401).json({ message: "Authorization bearer token is required" });
    return;
  }

  const token = authorization.slice("Bearer ".length).trim();

  try {
    request.user = verifyToken(token);
    next();
  } catch (error) {
    if (error instanceof AppError) {
      response.status(error.statusCode).json({ message: error.message });
      return;
    }

    response.status(401).json({ message: "Invalid or expired token" });
  }
}
