import type { CookieOptions, NextFunction, Request, Response } from 'express';
import { authService } from './auth.service';
import { loginSchema, parseBody, registerSchema } from './auth.validation';
import { REFRESH_COOKIE, REFRESH_COOKIE_PATH, REFRESH_TOKEN_TTL_DAYS } from './auth.constants';

const cookieOptions = (): CookieOptions => ({
  httpOnly: true,
  secure: process.env.NODE_ENV === 'production',
  sameSite: 'strict',
  path: REFRESH_COOKIE_PATH,
  maxAge: REFRESH_TOKEN_TTL_DAYS * 24 * 60 * 60 * 1000,
});

/** Reads one cookie without adding cookie-parser. */
export function readCookie(req: Request, name: string): string | undefined {
  for (const part of (req.headers.cookie ?? '').split(';')) {
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
    const { user, accessToken, refreshToken } = await authService.login(parseBody(loginSchema, req.body));
    res.cookie(REFRESH_COOKIE, refreshToken, cookieOptions());
    res.json({ success: true, data: { user, accessToken } });
  }),

  register: wrap(async (req, res) => {
    const { user, accessToken, refreshToken } = await authService.register(parseBody(registerSchema, req.body));
    res.cookie(REFRESH_COOKIE, refreshToken, cookieOptions());
    res.status(201).json({ success: true, data: { user, accessToken } });
  }),

  refresh: wrap(async (req, res) => {
    try {
      const { user, accessToken, refreshToken } = await authService.refresh(readCookie(req, REFRESH_COOKIE));
      res.cookie(REFRESH_COOKIE, refreshToken, cookieOptions());
      res.json({ success: true, data: { user, accessToken } });
    } catch (e) {
      res.clearCookie(REFRESH_COOKIE, { path: REFRESH_COOKIE_PATH });
      throw e;
    }
  }),

  logout: wrap(async (req, res) => {
    await authService.logout(readCookie(req, REFRESH_COOKIE));
    res.clearCookie(REFRESH_COOKIE, { path: REFRESH_COOKIE_PATH });
    res.json({ success: true, data: null });
  }),

  me: wrap(async (_req, res) => {
    res.json({ success: true, data: await authService.me(res.locals.auth.sub) });
  }),
};
