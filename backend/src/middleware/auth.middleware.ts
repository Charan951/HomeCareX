import type { NextFunction, Request, Response } from 'express';
import { authService } from '../modules/auth/auth.service';
import { HttpError } from '../modules/auth/auth.types';
import type { UserRole } from '../models/User';

export interface AuthUser {
  id: string;
  role: UserRole;
}

declare module 'express-serve-static-core' {
  interface Request {
    user?: AuthUser;
  }
}

/** Requires `Authorization: Bearer <access token>` and puts `{ sub, role }` on res.locals.auth. */
export const authenticate = (req: Request, res: Response, next: NextFunction) => {
  const header = req.headers.authorization;
  const token = header?.startsWith('Bearer ') ? header.slice(7) : undefined;
  if (!token) return next(new HttpError(401, 'Authentication required', 'NO_ACCESS_TOKEN'));
  try {
    const payload = authService.verifyAccessToken(token);
    res.locals.auth = payload;
    req.user = { id: payload.sub, role: payload.role };
    next();
  } catch (e) {
    next(e);
  }
};

export const authMiddleware = authenticate;

/** The signed-in user inside a handler behind `authenticate`; 401 if missing. */
export function getAuthUser(req: Request): AuthUser {
  if (!req.user) throw new HttpError(401, 'Authentication required', 'NO_ACCESS_TOKEN');
  return req.user;
}
