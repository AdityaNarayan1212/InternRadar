import { Request, Response, NextFunction, RequestHandler } from 'express';

/**
 * Wraps an async controller so any thrown error (including rejected
 * promises from Prisma calls) is forwarded to next(err) automatically,
 * instead of every controller needing its own try/catch.
 */
export const asyncHandler =
  (fn: (req: Request, res: Response, next: NextFunction) => Promise<void>): RequestHandler =>
  (req, res, next) => {
    Promise.resolve(fn(req, res, next)).catch(next);
  };
