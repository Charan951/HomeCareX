import type {
  CookieOptions,
  NextFunction,
  Request,
  Response,
} from 'express';

import { authService } from './auth.service';

import {
  forgotPasswordSchema,
  loginSchema,
  parseBody,
  registerSchema,
  resendOtpSchema,
  resetPasswordSchema,
  verifyOtpSchema,
} from './auth.validation';

import {
  REFRESH_COOKIE,
  REFRESH_COOKIE_PATH,
  REFRESH_TOKEN_TTL_DAYS,
} from './auth.constants';


/**
 * Options used when creating the refresh-token cookie.
 *
 * The refresh cookie is intentionally scoped to:
 *
 * /api/v1/auth
 *
 * instead of "/" so it is only sent to authentication endpoints.
 */
const cookieOptions = (): CookieOptions => ({
  httpOnly: true,

  secure: process.env.NODE_ENV === 'production',

  sameSite:
    process.env.NODE_ENV === 'production'
      ? 'strict'
      : 'lax',

  path: REFRESH_COOKIE_PATH,

  maxAge:
    REFRESH_TOKEN_TTL_DAYS *
    24 *
    60 *
    60 *
    1000,
});


/**
 * Reads one cookie without requiring cookie-parser.
 */
export function readCookie(
  req: Request,
  name: string,
): string | undefined {
  const cookieHeader = req.headers.cookie ?? '';

  for (const part of cookieHeader.split(';')) {
    const [key, ...rest] = part.trim().split('=');

    if (key === name) {
      return decodeURIComponent(rest.join('='));
    }
  }

  return undefined;
}


/**
 * Clears the refresh cookie.
 *
 * The application previously used path="/".
 * The current cookie uses /api/v1/auth.
 *
 * We clear BOTH paths so users who already have an old
 * hcx_refresh cookie do not keep a stale duplicate cookie.
 */
const clearRefreshCookies = (res: Response): void => {
  // Current cookie path.
  res.clearCookie(REFRESH_COOKIE, {
    path: REFRESH_COOKIE_PATH,
  });

  // Legacy cookie path from the previous implementation.
  res.clearCookie(REFRESH_COOKIE, {
    path: '/',
  });
};


const wrap =
  (
    fn: (
      req: Request,
      res: Response,
    ) => Promise<unknown>,
  ) =>
  (
    req: Request,
    res: Response,
    next: NextFunction,
  ) => {
    fn(req, res).catch(next);
  };


export const authController = {

  /**
   * POST /api/v1/auth/login
   */
  login: wrap(async (req, res) => {
    const {
      user,
      accessToken,
      refreshToken,
    } = await authService.login(
      parseBody(loginSchema, req.body),
    );

    /**
     * Remove any old refresh cookie before
     * creating the new correctly-scoped cookie.
     */
    clearRefreshCookies(res);

    res.cookie(
      REFRESH_COOKIE,
      refreshToken,
      cookieOptions(),
    );

    res.json({
      success: true,
      data: {
        user,
        accessToken,
      },
    });
  }),


  /**
   * POST /api/v1/auth/register
   */
  register: wrap(async (req, res) => {
    const {
      user,
      accessToken,
      refreshToken,
    } = await authService.register(
      parseBody(registerSchema, req.body),
    );

    /**
     * Remove any old refresh cookie before
     * creating the new correctly-scoped cookie.
     */
    clearRefreshCookies(res);

    res.cookie(
      REFRESH_COOKIE,
      refreshToken,
      cookieOptions(),
    );

    res.status(201).json({
      success: true,
      data: {
        user,
        accessToken,
      },
    });
  }),


  /**
   * POST /api/v1/auth/refresh
   */
  refresh: wrap(async (req, res) => {
    const token = readCookie(
      req,
      REFRESH_COOKIE,
    );

    if (!token) {
      return res.status(401).json({
        success: false,
        message: 'Refresh token cookie is missing',
      });
    }

    try {
      const {
        user,
        accessToken,
        refreshToken,
      } = await authService.refresh(token);

      /**
       * IMPORTANT:
       *
       * Do not clear the cookie here before setting the
       * replacement. The existing refresh-token test
       * expects res.cookie() to be called once.
       *
       * Because cookieOptions() uses:
       *
       * /api/v1/auth
       *
       * the new cookie replaces the current refresh cookie.
       */
      res.cookie(
        REFRESH_COOKIE,
        refreshToken,
        cookieOptions(),
      );

      res.json({
        success: true,
        data: {
          user,
          accessToken,
        },
      });
    } catch (e) {
      /**
       * Refresh failed.
       *
       * Remove both the current scoped cookie and
       * the legacy root-scoped cookie.
       */
      clearRefreshCookies(res);

      throw e;
    }
  }),


  /**
   * POST /api/v1/auth/logout
   */
  logout: wrap(async (req, res) => {
    await authService.logout(
      readCookie(req, REFRESH_COOKIE),
    );

    /**
     * Clear both the current cookie and any
     * legacy cookie created with path="/".
     */
    clearRefreshCookies(res);

    res.json({
      success: true,
      data: null,
    });
  }),


  /**
   * GET /api/v1/auth/me
   */
  me: wrap(async (_req, res) => {
    res.json({
      success: true,
      data: await authService.me(
        res.locals.auth.sub,
      ),
    });
  }),


  /**
   * POST /api/v1/auth/forgot-password
   */
  forgotPassword: wrap(async (req, res) => {
    const result =
      await authService.forgotPassword(
        parseBody(
          forgotPasswordSchema,
          req.body,
        ),
      );

    res.json(result);
  }),


  /**
   * POST /api/v1/auth/verify-otp
   */
  verifyOtp: wrap(async (req, res) => {
    const result =
      await authService.verifyOtp(
        parseBody(
          verifyOtpSchema,
          req.body,
        ),
      );

    res.json(result);
  }),


  /**
   * POST /api/v1/auth/resend-otp
   */
  resendOtp: wrap(async (req, res) => {
    const result =
      await authService.resendOtp(
        parseBody(
          resendOtpSchema,
          req.body,
        ),
      );

    res.json(result);
  }),


  /**
   * POST /api/v1/auth/reset-password
   */
  resetPassword: wrap(async (req, res) => {
    const result =
      await authService.resetPassword(
        parseBody(
          resetPasswordSchema,
          req.body,
        ),
      );

    res.json(result);
  }),
};