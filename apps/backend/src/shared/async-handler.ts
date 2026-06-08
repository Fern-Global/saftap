import type { NextFunction, Request, RequestHandler, Response } from "express";

type AsyncRequestHandler = (
  request: Request,
  response: Response,
  next: NextFunction
) => Promise<void>;

/**
 * Forwards rejected async controllers to Express 4 error middleware.
 */
export function asyncHandler(handler: AsyncRequestHandler): RequestHandler {
  return (request, response, next) => {
    void handler(request, response, next).catch(next);
  };
}
