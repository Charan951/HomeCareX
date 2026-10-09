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

/** Standard error envelope. Never leaks stack traces or internal details in production. */
export const errorHandler = (err: unknown, req: Request, res: Response, _next: NextFunction) => {
  const isProd = process.env.NODE_ENV === 'production';

  // 1. Known HttpError
  if (err instanceof HttpError) {
    const isServerError = err.status >= 500;
    return send(res, err.status, {
      success: false,
      message: isServerError && isProd ? 'Something went wrong. Please try again.' : err.message,
      code: (err.code as ErrorEnvelope['code']) ?? (isServerError ? ERROR_CODES.INTERNAL_ERROR : ERROR_CODES.BAD_REQUEST),
      ...(err.details && (!isServerError || !isProd) ? { details: err.details } : {}),
    });
  }

  // 2. Zod validation errors
  if (err instanceof ZodError) {
    return send(res, 400, {
      success: false,
      message: 'Some fields are invalid',
      code: ERROR_CODES.VALIDATION_ERROR,
      details: err.issues.map((i) => ({ field: i.path.join('.'), message: i.message })),
    });
  }

  // 3. Body parser errors: malformed JSON or payload too large
  const errObj = err as { type?: string; status?: number; statusCode?: number; code?: unknown; message?: unknown; details?: unknown };
  const type = errObj?.type;
  if (type === 'entity.parse.failed' || (err instanceof SyntaxError && 'body' in err)) {
    return send(res, 400, {
      success: false,
      message: 'Request body is not valid JSON',
      code: ERROR_CODES.INVALID_JSON,
    });
  }
  if (type === 'entity.too.large' || errObj?.status === 413 || errObj?.statusCode === 413) {
    return res.status(413).json({
      success: false,
      message: 'Request body is too large',
      code: 'PAYLOAD_TOO_LARGE',
    });
  }

  // 4. Mongoose CastError (invalid ObjectId / param type)
  if (err instanceof mongoose.Error.CastError) {
    return send(res, 400, {
      success: false,
      message: `Invalid ${err.path}`,
      code: ERROR_CODES.BAD_REQUEST,
    });
  }

  // 5. Mongoose ValidationError
  if (err instanceof mongoose.Error.ValidationError) {
    return send(res, 400, {
      success: false,
      message: 'Some fields are invalid',
      code: ERROR_CODES.VALIDATION_ERROR,
      details: Object.values(err.errors).map((e) => ({ field: e.path, message: e.message })),
    });
  }

  // 6. MongoDB duplicate key (E11000)
  if (errObj && (errObj.code === 11000 || (err as { name?: string }).name === 'MongoServerError')) {
    return send(res, 409, {
      success: false,
      message: 'A record with that value already exists.',
      code: ERROR_CODES.CONFLICT,
    });
  }

  // 7. Custom AppError ({ statusCode, code, message, details })
  if (typeof errObj?.statusCode === 'number' && errObj.statusCode >= 400 && errObj.statusCode < 600 && typeof errObj.code === 'string') {
    const isServerError = errObj.statusCode >= 500;
    return res.status(errObj.statusCode).json({
      success: false,
      message: isServerError && isProd ? 'Something went wrong. Please try again.' : String(errObj.message ?? 'Request failed'),
      code: errObj.code,
      ...(errObj.details && (!isServerError || !isProd) ? { details: errObj.details } : {}),
    });
  }

  // 8. Unexpected server error (500)
  if (isProd) {
    // Redact sensitive headers, bodies, tokens in production logging
    console.error(`[INTERNAL_ERROR] ${req.method} ${req.originalUrl}:`, err instanceof Error ? err.message : String(err));
  } else {
    console.error(err);
  }

  return res.status(500).json({
    success: false,
    message: 'Something went wrong. Please try again.',
    code: ERROR_CODES.INTERNAL_ERROR,
    ...(process.env.NODE_ENV === 'development' && err instanceof Error ? { stack: err.stack } : {}),
  });
};

export const errorMiddleware = errorHandler;
export const notFoundMiddleware = notFoundHandler;
