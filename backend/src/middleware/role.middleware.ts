// Middleware: role.middleware
import type { RequestHandler } from 'express';
import { AppError } from '../utils/AppError';
import type { UserRole } from './auth.middleware';

/** Allows only the listed roles. Must run after authMiddleware. */
export const roleMiddleware =
  (...allowed: UserRole[]): RequestHandler =>
  (req, _res, next) => {
    if (!req.user) return next(new AppError(401, 'UNAUTHENTICATED', 'Authentication is required'));
    if (!allowed.includes(req.user.role)) {
      return next(new AppError(403, 'FORBIDDEN', 'You do not have permission to perform this action'));
    }
    return next();
  };
