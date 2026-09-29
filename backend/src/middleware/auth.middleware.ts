import type { NextFunction, Request, Response } from 'express';

export type AuthenticatedUser = {
  id: string;
  email?: string;
  role: 'CUSTOMER' | 'PARTNER' | 'ADMIN';
};

declare global {
  namespace Express {
    interface Request {
      user?: AuthenticatedUser;
    }
  }
}

const isAuthenticatedRole = (role: string | undefined): role is AuthenticatedUser['role'] =>
  role === 'CUSTOMER' || role === 'PARTNER' || role === 'ADMIN';

const attachDevelopmentUser = (req: Request): void => {
  if (process.env.NODE_ENV !== 'development' || req.user) return;

  const id = req.get('x-dev-user-id');
  const role = req.get('x-dev-user-role');
  const email = req.get('x-dev-user-email');

  if (id && isAuthenticatedRole(role)) {
    req.user = { id, role, ...(email ? { email } : {}) };
  }
};

export const authenticate = (req: Request, res: Response, next: NextFunction): void => {
  attachDevelopmentUser(req);

  if (!req.user) {
    res.status(401).json({
      success: false,
      message: 'Authentication required.',
    });
    return;
  }

  next();
};

export const authMiddleware = authenticate;
