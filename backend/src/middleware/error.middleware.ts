import type { NextFunction, Request, Response } from 'express';
import { HttpError } from '../modules/auth/auth.types';

export const notFoundHandler = (req: Request, _res: Response, next: NextFunction) => {
  next(new HttpError(404, `Route not found: ${req.method} ${req.originalUrl}`, 'NOT_FOUND'));
};

/** Standard error envelope. Never leaks stack traces outside development. */
// eslint-disable-next-line @typescript-eslint/no-unused-vars
export const errorHandler = (err: unknown, _req: Request, res: Response, _next: NextFunction) => {
  if (err instanceof HttpError) {
    return res.status(err.status).json({ success: false, message: err.message, code: err.code, details: err.details });
  }
  console.error(err);
  res.status(500).json({
    success: false,
    message: 'Something went wrong. Please try again.',
    code: 'INTERNAL_ERROR',
    ...(process.env.NODE_ENV === 'development' && err instanceof Error ? { stack: err.stack } : {}),
  });
};

export const errorMiddleware = errorHandler;
