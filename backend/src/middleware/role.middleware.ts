import type { NextFunction, Request, Response } from 'express';
import { ADMIN_ROLES, type UserRole } from '../models/User';
import { HttpError } from '../modules/auth/auth.types';

/** Use after `authenticate`. Responds 403 when the signed-in role is not allowed. */
export const requireRole =
  (...roles: UserRole[]) =>
  (_req: Request, res: Response, next: NextFunction) => {
    const role = res.locals.auth?.role as UserRole | undefined;
    if (!role) return next(new HttpError(401, 'Authentication required', 'NO_ACCESS_TOKEN'));
    if (!roles.includes(role)) return next(new HttpError(403, 'You do not have access to this resource', 'FORBIDDEN'));
    next();
  };

export const requireAdmin = requireRole(...ADMIN_ROLES);
export const roleMiddleware = requireRole;
