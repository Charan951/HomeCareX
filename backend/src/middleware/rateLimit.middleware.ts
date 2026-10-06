import type { NextFunction, Request, Response } from 'express';
import { HttpError } from '../modules/auth/auth.types';

/** Fixed-window, per-IP, in-memory limiter. Swap for Redis when running more than one instance. */
export const rateLimit = ({ windowMs, max }: { windowMs: number; max: number }) => {
  const hits = new Map<string, { count: number; resetAt: number }>();
  return (req: Request, _res: Response, next: NextFunction) => {
    const key = `${req.ip}:${req.baseUrl}${req.path}`;
    const now = Date.now();
    const entry = hits.get(key);
    if (!entry || entry.resetAt <= now) {
      hits.set(key, { count: 1, resetAt: now + windowMs });
      return next();
    }
    entry.count += 1;
    if (entry.count > max) {
      return next(new HttpError(429, 'Too many requests. Please wait a minute and try again.', 'RATE_LIMITED'));
    }
    next();
  };
};

/** Login / register: 5 requests per minute per IP. */
export const authRateLimit = rateLimit({ windowMs: 60_000, max: 5 });
export const rateLimitMiddleware = rateLimit;
