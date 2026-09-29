import type { NextFunction, Request, Response } from 'express';

export const errorMiddleware = (
  error: Error,
  _req: Request,
  res: Response,
  _next: NextFunction,
): void => {
  res.status(500).json({
    success: false,
    message: error.message || 'Something went wrong on our side. Please try again.',
  });
};
