import { Request, Response, NextFunction } from 'express';
import { Prisma } from '@prisma/client';
import { AppError } from '../lib/AppError';

export const errorHandler = (
  err: Error,
  req: Request,
  res: Response,
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  next: NextFunction
): void => {
  console.error(`[ERROR] ${req.method} ${req.path} -`, err);

  // Errors we threw on purpose, with a known status code
  if (err instanceof AppError) {
    res.status(err.statusCode).json({ success: false, message: err.message });
    return;
  }

  // Prisma-specific errors get mapped to sensible HTTP codes instead of a blanket 500
  if (err instanceof Prisma.PrismaClientKnownRequestError) {
    if (err.code === 'P2002') {
      res.status(409).json({
        success: false,
        message: `A record with this ${(err.meta?.target as string[])?.join(', ') || 'value'} already exists`,
      });
      return;
    }
    if (err.code === 'P2025') {
      res.status(404).json({ success: false, message: 'Record not found' });
      return;
    }
  }

  // Anything unexpected: don't leak internals to the client
  res.status(500).json({
    success: false,
    message: 'Internal server error',
  });
};
