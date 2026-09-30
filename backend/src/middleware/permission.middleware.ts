import type { NextFunction, Request, Response } from 'express';
import { ROLE_PERMISSIONS } from '../modules/auth/auth.constants';
import type { UserRole } from '../models/User';
import { Errors } from '../utils/errors';


/** Use after `authenticate`. Requires every listed permission (e.g. 'partner:dashboard'); '*' grants all. */
export const requirePermission =
  (...required: string[]) =>
  (_req: Request, res: Response, next: NextFunction) => {
    const role = res.locals.auth?.role as UserRole | undefined;
    if (!role) return next(Errors.unauthorized());
    const granted = ROLE_PERMISSIONS[role] ?? [];
    if (granted.includes('*')) return next();
    const missing = required.find((p) => !granted.includes(p));
    if (missing) return next(Errors.missingPermission(missing));
    next();
  };

export const permissionMiddleware = requirePermission;