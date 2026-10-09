import type { NextFunction, Request, Response } from 'express';
import { HttpError } from '../modules/auth/auth.types';

export interface RateLimitOptions {
  windowMs: number;
  max: number;
  message?: string;
  keyGenerator?: (req: Request) => string;
}

/**
 * Fixed-window limiter with per-IP / per-route keying and cleanup.
 * Sends Retry-After header and returns HTTP 429 when throttled.
 * In a distributed multi-container deployment, this store can be backed by Redis.
 */
export const rateLimit = ({
  windowMs,
  max,
  message = 'Too many requests. Please wait a minute and try again.',
  keyGenerator,
}: RateLimitOptions) => {
  const hits = new Map<string, { count: number; resetAt: number }>();

  // Periodically sweep expired entries to prevent memory leaks
  const sweepTimer = setInterval(() => {
    const now = Date.now();
    for (const [key, entry] of hits.entries()) {
      if (entry.resetAt <= now) {
        hits.delete(key);
      }
    }
  }, Math.max(windowMs, 60_000));
  sweepTimer.unref();

  return (req: Request, res: Response, next: NextFunction) => {
    const key = keyGenerator ? keyGenerator(req) : `${req.ip}:${req.baseUrl}${req.path}`;
    const now = Date.now();
    const entry = hits.get(key);

    if (!entry || entry.resetAt <= now) {
      hits.set(key, { count: 1, resetAt: now + windowMs });
      return next();
    }

    entry.count += 1;
    if (entry.count > max) {
      const retryAfterSeconds = Math.max(1, Math.ceil((entry.resetAt - now) / 1000));
      if (typeof res?.setHeader === 'function') {
        res.setHeader('Retry-After', String(retryAfterSeconds));
      }
      return next(new HttpError(429, message, 'RATE_LIMITED'));
    }

    next();
  };
};

/** Login / register: 5 requests per minute per IP. */
export const authRateLimit = rateLimit({ windowMs: 60_000, max: 5 });
export const rateLimitMiddleware = rateLimit;
