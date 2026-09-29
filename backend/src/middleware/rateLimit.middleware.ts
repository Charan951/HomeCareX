import type { NextFunction, Request, Response } from 'express';

const RATE_LIMIT_WINDOW_MS = 60 * 1000;
const RATE_LIMIT_MAX_REQUESTS = 5;

const requestTracker = new Map<string, { count: number; resetAt: number }>();

export const rateLimitMiddleware = (req: Request, res: Response, next: NextFunction): void => {
  const ip = req.ip || req.headers['x-forwarded-for'] || 'unknown';
  const key = Array.isArray(ip) ? ip.join(',') : String(ip);
  const now = Date.now();
  const record = requestTracker.get(key);

  if (!record || record.resetAt <= now) {
    requestTracker.set(key, { count: 1, resetAt: now + RATE_LIMIT_WINDOW_MS });
    next();
    return;
  }

  if (record.count >= RATE_LIMIT_MAX_REQUESTS) {
    res.status(429).json({
      success: false,
      message: 'Too many requests. Please try again later.',
    });
    return;
  }

  record.count += 1;
  next();
};
