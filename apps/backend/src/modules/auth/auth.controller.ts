import type { Request, Response } from "express";
import { ZodError } from "zod";
import { AppError } from "../../shared/errors.js";
import { loginSchema, registerTouristSchema } from "./auth.types.js";
import * as AuthService from "./auth.service.js";

function getValidationMessage(error: ZodError): string {
  return error.issues
    .map((issue) => {
      const field = issue.path.join(".") || "body";
      return `${field}: ${issue.message}`;
    })
    .join("; ");
}

function sendError(response: Response, error: unknown): void {
  if (error instanceof ZodError) {
    response.status(400).json({
      message: "Invalid request body",
      details: getValidationMessage(error),
    });
    return;
  }

  if (error instanceof AppError) {
    response.status(error.statusCode).json({ message: error.message });
    return;
  }

  response.status(500).json({ message: "Internal server error" });
}

export async function register(request: Request, response: Response): Promise<void> {
  try {
    const data = registerTouristSchema.parse(request.body);
    const result = await AuthService.registerTourist(data);

    response.status(201).json(result);
  } catch (error) {
    sendError(response, error);
  }
}

export async function login(request: Request, response: Response): Promise<void> {
  try {
    const data = loginSchema.parse(request.body);
    const result = await AuthService.login(data);

    response.status(200).json(result);
  } catch (error) {
    sendError(response, error);
  }
}
