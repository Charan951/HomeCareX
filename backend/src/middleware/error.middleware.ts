import type { NextFunction, Request, Response } from 'express';
import mongoose from 'mongoose';
import { ZodError } from 'zod';
import { ERROR_CODES } from '../constants/errorCodes';
import { HttpError } from '../modules/auth/auth.types';
import type { ErrorEnvelope } from '../utils/response';

export const notFoundHandler = (req: Request, _res: Response, next: NextFunction) => {
  next(new HttpError(404, `Route not found: ${req.method} ${req.originalUrl}`, ERROR_CODES.NOT_FOUND));
};

const send = (res: Response, status: number, body: ErrorEnvelope) => res.status(status).json(body);

/** Standard error envelope. Never leaks stack traces outside development. */
export const errorHandler = (err: unknown, _req: Request, res: Response, _next: NextFunction) => {
  if (err instanceof HttpError) {
    return send(res, err.status, {
      success: false,
      message: err.message,
      code: (err.code as ErrorEnvelope['code']) ?? ERROR_CODES.INTERNAL_ERROR,
      ...(err.details ? { details: err.details } : {}),
    });
  }
  if (err instanceof ZodError) {
    return send(res, 400, {
      success: false,
      message: 'Some fields are invalid',
      code: ERROR_CODES.VALIDATION_ERROR,
      details: err.issues.map((i) => ({ field: i.path.join('.'), message: i.message })),
    });
  }
  if (err instanceof SyntaxError && 'body' in err) {
    return send(res, 400, { success: false, message: 'Request body is not valid JSON', code: ERROR_CODES.INVALID_JSON });
  }
  if (err instanceof mongoose.Error.CastError) {
    return send(res, 400, { success: false, message: `Invalid ${err.path}`, code: ERROR_CODES.BAD_REQUEST });
  }
  // Module errors shaped like utils/AppError ({ statusCode, code, message, details }).
  const e = err as { statusCode?: unknown; code?: unknown; message?: unknown; details?: unknown };
  if (typeof e?.statusCode === 'number' && e.statusCode >= 400 && e.statusCode < 600 && typeof e.code === 'string') {
    return res.status(e.statusCode).json({ success: false, message: String(e.message ?? 'Request failed'), code: e.code, details: e.details });
  }
  // express.json() failures (malformed JSON, payload too large) -> 4xx instead of a 500.
  const type = (err as { type?: string })?.type;
  if (type === 'entity.parse.failed') {
    return res.status(400).json({ success: false, message: 'Request body is not valid JSON', code: 'INVALID_JSON' });
  }
  if (type === 'entity.too.large') {
    return res.status(413).json({ success: false, message: 'Request body is too large', code: 'PAYLOAD_TOO_LARGE' });
  }
  console.error(err);
  res.status(500).json({
    success: false,
    message: 'Something went wrong. Please try again.',
    code: ERROR_CODES.INTERNAL_ERROR,
    ...(process.env.NODE_ENV === 'development' && err instanceof Error ? { stack: err.stack } : {}),
  });
};

export const errorMiddleware = errorHandler;
export const notFoundMiddleware = notFoundHandler;
