import type { NextFunction, Request, Response } from 'express';
import { authService } from '../modules/auth/auth.service';
import { HttpError } from '../modules/auth/auth.types';

/** Requires `Authorization: Bearer <access token>` and puts `{ sub, role }` on res.locals.auth. */
export const authenticate = (req: Request, res: Response, next: NextFunction) => {
  const header = req.headers.authorization;
  const token = header?.startsWith('Bearer ') ? header.slice(7) : undefined;
  if (!token) return next(new HttpError(401, 'Authentication required', 'NO_ACCESS_TOKEN'));
  try {
    res.locals.auth = authService.verifyAccessToken(token);
    next();
  } catch (e) {
    next(e);
  }
};

export const authMiddleware = authenticate;
