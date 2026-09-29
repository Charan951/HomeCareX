import type { NextFunction, Request, Response } from 'express';
import { z } from 'zod';

export const validationMiddleware = (schema: z.ZodTypeAny) => {
  return (req: Request, res: Response, next: NextFunction): void => {
    const result = schema.safeParse(req.body);

    if (!result.success) {
      const firstIssue = result.error.issues[0];
      res.status(400).json({
        success: false,
        message: firstIssue?.message ?? 'Please check the highlighted fields.',
      });
      return;
    }

    req.body = result.data;
    next();
  };
};
