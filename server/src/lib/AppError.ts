/**
 * Throw this instead of a plain Error whenever you know the right
 * HTTP status code (404, 409, 401, etc). Anything else falls through
 * to a generic 500 in the error handler.
 */
export class AppError extends Error {
  statusCode: number;

  constructor(message: string, statusCode = 500) {
    super(message);
    this.statusCode = statusCode;
    this.name = 'AppError';
  }
}
