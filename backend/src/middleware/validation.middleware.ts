import type { NextFunction, Request, Response } from 'express';
import { z } from 'zod';
import { HttpError } from '../modules/auth/auth.types';

type RequestSchemas = { body?: z.ZodTypeAny; params?: z.ZodTypeAny; query?: z.ZodTypeAny };

const isZodSchema = (value: unknown): value is z.ZodTypeAny =>
  typeof (value as z.ZodTypeAny)?.safeParse === 'function';

/**
 * validationMiddleware(schema)                       -> validates req.body (400 { success, message })
 * validationMiddleware({ body?, params?, query? })   -> validates each part (400 with per-field details)
 */
export const validationMiddleware = (schema: z.ZodTypeAny | RequestSchemas) => {
  if (isZodSchema(schema)) {
    return (req: Request, res: Response, next: NextFunction): void => {
      const result = schema.safeParse(req.body);
      if (!result.success) {
        const firstIssue = result.error.issues[0];
        res.status(400).json({ success: false, message: firstIssue?.message ?? 'Please check the highlighted fields.' });
        return;
      }
      req.body = result.data;
      next();
    };
  }

  return (req: Request, _res: Response, next: NextFunction): void => {
    const details: { field: string; message: string }[] = [];
    for (const part of ['params', 'query', 'body'] as const) {
      const partSchema = schema[part];
      if (!partSchema) continue;
      const result = partSchema.safeParse(req[part]);
      if (result.success) {
        (req as unknown as Record<string, unknown>)[part] = result.data;
      } else {
        for (const issue of result.error.issues) {
          details.push({ field: [part, ...issue.path].join('.'), message: issue.message });
        }
      }
    }
    if (details.length > 0) {
      const err = new HttpError(400, details[0].message, 'VALIDATION_ERROR');
      err.details = details;
      return next(err);
    }
    next();
  };
};
