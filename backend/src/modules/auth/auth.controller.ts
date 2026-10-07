import type { CookieOptions, NextFunction, Request, Response } from 'express';
import { authService } from './auth.service';
import {
  forgotPasswordSchema,
  loginSchema,
  parseBody,
  registerSchema,
  resetPasswordSchema,
} from './auth.validation';
import { REFRESH_COOKIE, REFRESH_TOKEN_TTL_DAYS } from './auth.constants';

const cookieOptions = (): CookieOptions => ({
  httpOnly: true,
  secure: process.env.NODE_ENV === 'production',
  sameSite: process.env.NODE_ENV === 'production' ? 'strict' : 'lax',
  path: '/', // Allows the cookie to reach /api/v1/auth/refresh and /api/v1/auth/logout
  maxAge: REFRESH_TOKEN_TTL_DAYS * 24 * 60 * 60 * 1000,
});

/** Reads one cookie without adding cookie-parser. */
export function readCookie(req: Request, name: string): string | undefined {
  const cookieHeader = req.headers.cookie ?? '';
  for (const part of cookieHeader.split(';')) {
    const [key, ...rest] = part.trim().split('=');
    if (key === name) return decodeURIComponent(rest.join('='));
  }
  return undefined;
}

const wrap =
  (fn: (req: Request, res: Response) => Promise<unknown>) =>
  (req: Request, res: Response, next: NextFunction) => {
    fn(req, res).catch(next);
  };

export const authController = {
  login: wrap(async (req, res) => {
    const { user, accessToken, refreshToken } = await authService.login(
      parseBody(loginSchema, req.body)
    );
    res.cookie(REFRESH_COOKIE, refreshToken, cookieOptions());
    res.json({ success: true, data: { user, accessToken } });
  }),

  register: wrap(async (req, res) => {
    const { user, accessToken, refreshToken } = await authService.register(
      parseBody(registerSchema, req.body)
    );
    res.cookie(REFRESH_COOKIE, refreshToken, cookieOptions());
    res.status(201).json({ success: true, data: { user, accessToken } });
  }),

  refresh: wrap(async (req, res) => {
    const token = readCookie(req, REFRESH_COOKIE);

    if (!token) {
      return res.status(401).json({
        success: false,
        message: 'Refresh token cookie is missing',
      });
    }

    try {
      const { user, accessToken, refreshToken } = await authService.refresh(token);
      res.cookie(REFRESH_COOKIE, refreshToken, cookieOptions());
      res.json({ success: true, data: { user, accessToken } });
    } catch (e) {
      res.clearCookie(REFRESH_COOKIE, { path: '/' });
      throw e;
    }
  }),

  logout: wrap(async (req, res) => {
    await authService.logout(readCookie(req, REFRESH_COOKIE));
    res.clearCookie(REFRESH_COOKIE, { path: '/' });
    res.json({ success: true, data: null });
  }),

  me: wrap(async (_req, res) => {
    res.json({ success: true, data: await authService.me(res.locals.auth.sub) });
  }),

  forgotPassword: wrap(async (req, res) => {
    const result = await authService.forgotPassword(
      parseBody(forgotPasswordSchema, req.body)
    );
    res.json(result);
  }),

  resetPassword: wrap(async (req, res) => {
    const result = await authService.resetPassword(
      parseBody(resetPasswordSchema, req.body)
    );
    res.json(result);
  }),
};