import type { NextFunction, Request, Response } from 'express';
import type { ZodTypeAny } from 'zod';
import { Errors } from '../utils/errors';

type Source = 'body' | 'query' | 'params';

/** Validates req[source] with a zod schema; replaces it with the parsed value or responds 400 VALIDATION_ERROR. */
export const validate =
  (schema: ZodTypeAny, source: Source = 'body') =>
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

export const validationMiddleware = validate;