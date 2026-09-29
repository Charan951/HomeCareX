// Middleware: auth.middleware
import type { RequestHandler, Request } from 'express';
import jwt from 'jsonwebtoken';
import { environmentConfig } from '../config/environment';
import { AppError } from '../utils/AppError';

export type UserRole = 'customer' | 'partner' | 'admin';
export const USER_ROLES: readonly UserRole[] = ['customer', 'partner', 'admin'];

export interface AuthUser {
  id: string;
  role: UserRole;
}

declare module 'express-serve-static-core' {
  interface Request {
    user?: AuthUser;
  }
}

const isRole = (value: unknown): value is UserRole => USER_ROLES.includes(value as UserRole);

/**
 * Verifies `Authorization: Bearer <jwt>` and sets `req.user`.
 * Token contract (until the auth module publishes its own): HS256, `sub` = user id, `role` = customer|partner|admin.
 * `id` / `userId` are accepted as fallbacks for the subject.
 */
export const authMiddleware: RequestHandler = (req, _res, next) => {
  const secret = environmentConfig.jwtSecret;
  if (!secret) {
    return next(new AppError(500, 'SERVER_MISCONFIGURED', 'Authentication is not configured'));
  }

  const header = req.headers.authorization;
  const [scheme, token] = header ? header.split(' ') : [];
  if (scheme?.toLowerCase() !== 'bearer' || !token) {
    return next(new AppError(401, 'UNAUTHENTICATED', 'Authentication token is missing'));
  }

  try {
    const payload = jwt.verify(token, secret, { algorithms: ['HS256'] });
    if (typeof payload === 'string') throw new Error('unexpected payload');
    const id = payload.sub ?? payload.id ?? payload.userId;
    if (typeof id !== 'string' || !id || !isRole(payload.role)) throw new Error('invalid claims');
    req.user = { id, role: payload.role };
    return next();
  } catch (err) {
    if (err instanceof jwt.TokenExpiredError) {
      return next(new AppError(401, 'TOKEN_EXPIRED', 'Your session has expired. Please sign in again'));
    }
    return next(new AppError(401, 'UNAUTHENTICATED', 'Authentication token is invalid'));
  }
};

/** Returns the authenticated user or throws 401 (use inside handlers behind authMiddleware). */
export function getAuthUser(req: Request): AuthUser {
  if (!req.user) throw new AppError(401, 'UNAUTHENTICATED', 'Authentication is required');
  return req.user;
}
