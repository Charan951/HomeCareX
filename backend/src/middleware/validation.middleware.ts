import type { Request, Response, NextFunction, RequestHandler } from 'express';
import { z } from 'zod';
import { AppError } from '../utils/AppError';
import { Errors } from '../utils/errors';

export type RequestSchemas = {
  body?: z.ZodTypeAny;
  params?: z.ZodTypeAny;
  query?: z.ZodTypeAny;
};

const isZodSchema = (value: unknown): value is z.ZodTypeAny =>
  typeof (value as z.ZodTypeAny)?.safeParse === 'function';

/**
 * validationMiddleware(schema) -> validates req.body
 * validationMiddleware({ body?, params?, query? }) -> validates specific parts
 */
export const validationMiddleware = (schema: z.ZodTypeAny | RequestSchemas): RequestHandler => {
  
  // If a single Zod schema is passed, default to validating the request body
  if (isZodSchema(schema)) {
    return (req: Request, _res: Response, next: NextFunction): void => {
      const result = schema.safeParse(req.body);
      
      if (!result.success) {
        const firstIssue = result.error.issues[0];
        const formattedIssues = result.error.issues.map(issue => ({
          in: 'body',
          path: issue.path.join('.'),
          message: issue.message
        }));
        
        return next(
          new AppError(400, 'VALIDATION_ERROR', firstIssue?.message ?? 'Validation failed', formattedIssues)
        );
      }
      
      req.body = result.data;
      return next();
    };
  }

  // If an object of schemas is passed, validate each specified request part
  return (req: Request, _res: Response, next: NextFunction): void => {
    const issues: Array<{ in: string; path: string; message: string }> = [];

    for (const part of ['params', 'query', 'body'] as const) {
      const partSchema = schema[part];
      if (!partSchema) continue;

      const result = partSchema.safeParse(req[part]);

      if (result.success) {
        req[part] = result.data;
      } else {
        for (const issue of result.error.issues) {
          issues.push({ 
            in: part, 
            path: issue.path.join('.'), 
            message: issue.message 
          });
        }
      }
    }

    if (issues.length > 0) {
      return next(new AppError(400, 'VALIDATION_ERROR', 'Request validation failed', issues));
    }

    return next();
  };
};


type Source = 'body' | 'query' | 'params';

/** Validates req[source] with a zod schema; replaces it with the parsed value or responds 400 VALIDATION_ERROR. */
export const validate =
  (schema: z.ZodTypeAny, source: Source = 'body') =>
  (req: Request, _res: Response, next: NextFunction) => {
    const result = schema.safeParse(req[source]);
    if (!result.success) {
      return next(
        Errors.validation(result.error.issues.map((i) => ({ field: i.path.join('.') || source, message: i.message }))),
      );
    }
    req[source] = result.data;
    next();
  };

