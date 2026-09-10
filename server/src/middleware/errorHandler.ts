import { Request, Response, NextFunction } from 'express';
import multer from 'multer';

export const errorHandler = (
  err: Error,
  req: Request,
  res: Response,
  next: NextFunction
): void => {
  console.error(`[ERROR] ${err.message}`);

  // Multer errors (file too large, unexpected field, or a fileFilter
  // rejection like "Only PDF files are supported") are client mistakes,
  // not server failures - respond 400, not 500.
  if (err instanceof multer.MulterError || /^Only .* are supported$/.test(err.message)) {
    res.status(400).json({ success: false, message: err.message });
    return;
  }

  res.status(500).json({
    success: false,
    message: err.message || 'Internal server error',
  });
};