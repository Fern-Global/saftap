import { AppError as SharedAppError } from "../shared/errors.js";

/**
 * Application error class used for controlled HTTP error responses.
 */
export class AppError extends SharedAppError {
  public readonly code?: string;

  public constructor(message: string, statusCode = 500, code?: string, isOperational = true) {
    super(message, statusCode, isOperational);
    this.code = code;
  }
}

/**
 * Wraps an external failure in a consistent application-level AppError.
 */
export function wrapExternalError(message: string, code: string, cause: unknown): AppError {
  const error = new AppError(message, 502, code);
  error.cause = cause;

  return error;
}
