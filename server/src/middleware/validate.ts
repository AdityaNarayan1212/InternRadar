import { Request, Response, NextFunction } from 'express';
import { ZodSchema } from 'zod';

/**
 * Validates req.body against a zod schema.
 * On success, replaces req.body with the parsed (and coerced) data.
 * On failure, responds 400 with a flat list of field errors instead of
 * letting bad data reach the controller / Prisma.
 */
export const validateBody =
  (schema: ZodSchema) =>
  (req: Request, res: Response, next: NextFunction): void => {
    const result = schema.safeParse(req.body);

    if (!result.success) {
      res.status(400).json({
        success: false,
        message: 'Validation failed',
        errors: result.error.issues.map((issue) => ({
          field: issue.path.join('.'),
          message: issue.message,
        })),
      });
      return;
    }

    req.body = result.data;
    next();
  };
