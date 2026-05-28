/**
 * Application error class used for controlled HTTP error responses.
 */
export class AppError extends Error {
  public readonly statusCode: number;
  public readonly isOperational: boolean;

  public constructor(message: string, statusCode = 500, isOperational = true) {
    super(message);

    this.name = "AppError";
    this.statusCode = statusCode;
    this.isOperational = isOperational;

    Error.captureStackTrace(this, this.constructor);
  }
}

/**
 * Error class representing client-side request validation failures.
 */
export class BadRequestError extends AppError {
  public constructor(message: string) {
    super(message, 400);
    this.name = "BadRequestError";
  }
}

/**
 * Error class representing insufficient USDC balance conditions.
 */
export class InsufficientFundsError extends AppError {
  public constructor(message = "Insufficient USDC balance") {
    super(message, 400);
    this.name = "InsufficientFundsError";
  }
}
