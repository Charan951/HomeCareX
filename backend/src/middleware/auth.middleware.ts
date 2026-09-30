import type { Request, Response, NextFunction, RequestHandler } from 'express';
import { authService } from '../modules/auth/auth.service';
import { AppError } from '../utils/AppError';
import type { UserRole } from '../models/User';

export const USER_ROLES: readonly UserRole[] = ['customer', 'partner', 'admin'];

export interface AuthUser {
  id: string;
  role: UserRole;
}

// Extend Express Request to include our custom user object
declare module 'express-serve-static-core' {
  interface Request {
    user?: AuthUser;
  }
}

/**
 * Requires `Authorization: Bearer <access token>`.
 * Verifies the token using authService and sets `req.user` and `res.locals.auth`.
 */
export const authMiddleware: RequestHandler = (req: Request, res: Response, next: NextFunction) => {
  const header = req.headers.authorization;
  const token = header?.startsWith('Bearer ') ? header.slice(7) : undefined;

  if (!token) {
    return next(new AppError(401, 'UNAUTHENTICATED', 'Authentication token is missing'));
  }

  try {
    const payload = authService.verifyAccessToken(token);
    
    // Attach to both locals (for views/downstream) and req.user (for type-safe handlers)
    res.locals.auth = payload;
    req.user = { id: payload.sub, role: payload.role as UserRole };
    
    return next();
  } catch (err) {
    // Let the global error handler catch token expiration or invalid signature errors thrown by authService
    return next(err);
  }
};

/** 
 * Returns the authenticated user or throws 401.
 * Use this inside controllers that sit behind `authMiddleware` to guarantee type safety. 
 */
export function getAuthUser(req: Request): AuthUser {
  if (!req.user) {
    throw new AppError(401, 'UNAUTHENTICATED', 'Authentication is required');
  }
  return req.user;
}