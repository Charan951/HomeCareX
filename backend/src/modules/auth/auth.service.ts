import crypto from 'crypto';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';

import { authRepository } from './auth.repository';

import {
  ACCESS_TOKEN_TTL,
  LOCK_MINUTES,
  MAX_FAILED_LOGINS,
  REFRESH_TOKEN_TTL_DAYS,
  ROLE_HOME,
  ROLE_PERMISSIONS,
} from './auth.constants';

import {
  HttpError,
  type AccessTokenPayload,
  type AuthUserDto,
  type RefreshTokenPayload,
} from './auth.types';

import type {
  ForgotPasswordInput,
  LoginInput,
  RegisterInput,
  ResetPasswordInput,
} from './auth.validation';

import type { UserRole } from '../../models/User';

import { mailService } from '../../services/mail.service';


const accessSecret = () =>
  process.env.JWT_SECRET ||
  'dev_access_secret_change_me';


const refreshSecret = () =>
  process.env.JWT_REFRESH_SECRET ||
  `${accessSecret()}_refresh`;


type UserDoc =
  NonNullable<
    Awaited<
      ReturnType<
        typeof authRepository.findById
      >
    >
  >;


export function toAuthUser(
  user: UserDoc,
): AuthUserDto {
  const role = user.role as UserRole;

  return {
    id: user.id,

    name: user.name,

    email: user.email,

    phone: user.phone ?? undefined,

    role,

    permissions:
      ROLE_PERMISSIONS[role] ?? [],

    home:
      ROLE_HOME[role] ?? '/',
  };
}


function issueTokens(
  user: UserDoc,
) {
  const access: AccessTokenPayload = {
    sub: user.id,
    role: user.role as UserRole,
  };

  const refresh: RefreshTokenPayload = {
    sub: user.id,
    v: user.tokenVersion ?? 0,
  };

  return {
    accessToken: jwt.sign(
      access,
      accessSecret(),
      {
        expiresIn: ACCESS_TOKEN_TTL,
      },
    ),

    refreshToken: jwt.sign(
      refresh,
      refreshSecret(),
      {
        expiresIn:
          `${REFRESH_TOKEN_TTL_DAYS}d`,
      },
    ),
  };
}


const sessionExpired = (
  code: string,
) =>
  new HttpError(
    401,
    'Your session has expired. Please log in again.',
    code,
  );


export const authService = {

  /**
   * Login
   *
   * A successful login starts a new refresh-token
   * generation by incrementing tokenVersion.
   */
  async login({
    email,
    password,
  }: LoginInput) {

    const user =
      await authRepository.findByEmailWithPassword(
        email,
      );

    /**
     * Same message for an unknown email and
     * wrong password so accounts cannot be probed.
     */
    const invalid =
      new HttpError(
        401,
        'Invalid email or password',
        'INVALID_CREDENTIALS',
      );

    if (!user) {
      throw invalid;
    }


    if (user.status === 'blocked') {
      throw new HttpError(
        403,
        'This account has been blocked. Please contact support.',
        'ACCOUNT_BLOCKED',
      );
    }


    if (
      user.lockedUntil &&
      user.lockedUntil > new Date()
    ) {
      throw new HttpError(
        423,
        `Too many failed attempts. Try again in ${LOCK_MINUTES} minutes.`,
        'ACCOUNT_LOCKED',
      );
    }


    const passwordMatches =
      await bcrypt.compare(
        password,
        user.passwordHash,
      );


    if (!passwordMatches) {

      user.failedLogins =
        (user.failedLogins ?? 0) + 1;


      if (
        user.failedLogins >=
        MAX_FAILED_LOGINS
      ) {
        user.lockedUntil =
          new Date(
            Date.now() +
            LOCK_MINUTES * 60_000,
          );

        user.failedLogins = 0;
      }


      await user.save();

      throw invalid;
    }


    /**
     * Successful login.
     *
     * Incrementing tokenVersion invalidates any
     * older refresh-token generation belonging to
     * previous sessions.
     */
    user.tokenVersion =
      (user.tokenVersion ?? 0) + 1;


    user.failedLogins = 0;

    user.lockedUntil = undefined;

    user.lastLoginAt = new Date();


    await user.save();


    return {
      user: toAuthUser(user),

      ...issueTokens(user),
    };
  },


  /**
   * Register a new user.
   */
  async register(
    input: RegisterInput,
  ) {

    if (
      await authRepository.existsByEmailOrPhone(
        input.email,
        input.phone,
      )
    ) {
      throw new HttpError(
        409,
        'An account with this email or phone already exists',
        'DUPLICATE_ACCOUNT',
      );
    }


    const passwordHash =
      await bcrypt.hash(
        input.password,
        12,
      );


    const user =
      await authRepository.create({
        name: input.name,

        email: input.email,

        phone: input.phone,

        passwordHash,

        role: input.role,

        referralCode:
          input.referralCode,
      });


    try {

      await mailService.sendAccountCreatedEmail({
        name: user.name,

        email: user.email,

        role: user.role as UserRole,

        createdAt: user.createdAt,
      });

    } catch {

      console.error(
        'Account-created email failed for user',
        user.id,
      );
    }


    return {
      user: toAuthUser(user),

      ...issueTokens(user),
    };
  },


  /**
   * Verifies the refresh cookie,
   * rotates the token pair,
   * and detects token reuse.
   */
  async refresh(
    refreshToken?: string,
  ) {

    if (!refreshToken) {
      throw sessionExpired(
        'NO_REFRESH_TOKEN',
      );
    }


    let payload: RefreshTokenPayload;


    try {

      payload =
        jwt.verify(
          refreshToken,
          refreshSecret(),
        ) as RefreshTokenPayload;

    } catch {

      throw sessionExpired(
        'INVALID_REFRESH_TOKEN',
      );
    }


    const user =
      await authRepository.findById(
        payload.sub,
      );


    if (
      !user ||
      user.status === 'blocked'
    ) {
      throw sessionExpired(
        'REVOKED_REFRESH_TOKEN',
      );
    }


    const currentVersion =
      user.tokenVersion ?? 0;


    /**
     * Reuse detection.
     *
     * If the refresh token has an older version
     * than the current user version, that token was
     * already rotated or otherwise revoked.
     *
     * Bump the version again to invalidate the
     * entire token family.
     */
    if (
      payload.v < currentVersion
    ) {

      user.tokenVersion =
        currentVersion + 1;

      await user.save();

      throw sessionExpired(
        'REVOKED_REFRESH_TOKEN',
      );
    }


    /**
     * Token version must exactly match the
     * current version.
     */
    if (
      payload.v !== currentVersion
    ) {
      throw sessionExpired(
        'REVOKED_REFRESH_TOKEN',
      );
    }


    /**
     * Normal refresh-token rotation.
     *
     * Increment the token version before issuing
     * the replacement refresh token.
     */
    user.tokenVersion =
      currentVersion + 1;

    await user.save();


    return {
      user: toAuthUser(user),

      ...issueTokens(user),
    };
  },


  /**
   * Logout ends every session of the user
   * by bumping tokenVersion.
   */
  async logout(
    refreshToken?: string,
  ) {

    if (!refreshToken) {
      return;
    }


    try {

      const payload =
        jwt.verify(
          refreshToken,
          refreshSecret(),
        ) as RefreshTokenPayload;


      const user =
        await authRepository.findById(
          payload.sub,
        );


      if (
        user &&
        user.tokenVersion === payload.v
      ) {

        user.tokenVersion += 1;

        await user.save();
      }

    } catch {
      /**
       * Token is already invalid.
       * Nothing needs to be revoked.
       */
    }
  },


  /**
   * Verify an access token.
   */
  verifyAccessToken(
    token: string,
  ): AccessTokenPayload {

    try {

      return jwt.verify(
        token,
        accessSecret(),
      ) as AccessTokenPayload;

    } catch {

      throw sessionExpired(
        'INVALID_ACCESS_TOKEN',
      );
    }
  },


  /**
   * Get the authenticated user.
   */
  async me(
    userId: string,
  ) {

    const user =
      await authRepository.findById(
        userId,
      );


    if (
      !user ||
      user.status === 'blocked'
    ) {
      throw sessionExpired(
        'USER_NOT_FOUND',
      );
    }


    return toAuthUser(user);
  },


  /**
   * Forgot password.
   */
  async forgotPassword({
    email,
  }: ForgotPasswordInput) {

    const user =
      await authRepository.findByEmail(
        email,
      );


    if (
      user &&
      user.status !== 'blocked'
    ) {
      const otpCode =
        crypto.randomInt(100000, 1000000)
          .toString()
          .padStart(6, '0');

      const otpHash =
        crypto
          .createHash('sha256')
          .update(otpCode)
          .digest('hex');

      await authRepository.invalidateActiveOtps(
        email,
        'PASSWORD_RESET',
      );

      await authRepository.createOtp({
        userId: user.id,
        identifier: email.toLowerCase(),
        hashedCode: otpHash,
        purpose: 'PASSWORD_RESET',
        expiresAt: new Date(
          Date.now() + 10 * 60 * 1000,
        ),
      });

      try {
        await mailService.sendPasswordResetOtpEmail({
          name: user.name,
          email: user.email,
          otp: otpCode,
        });
      } catch (err) {
        console.error(
          'Password-reset OTP email failed for user',
          user.id,
          err,
        );
      }
    }

    return {
      success: true,
      message:
        'If an account exists, a verification code has been sent.',
    };
  },


  /**
   * Verify password-reset OTP.
   */
  async verifyOtp({
    email,
    otp,
  }: {
    email: string;
    otp: string;
  }) {
    if (!/^\d{6}$/.test(otp)) {
      throw new HttpError(
        400,
        'Enter a valid 6-digit verification code',
        'INVALID_OTP_FORMAT',
      );
    }

    const identifier = email.toLowerCase();

    const otpDoc =
      await authRepository.findLatestOtp(
        identifier,
        'PASSWORD_RESET',
      );

    if (!otpDoc) {
      throw new HttpError(
        400,
        'The verification code is invalid. Please try again.',
        'INVALID_OTP',
      );
    }

    if (otpDoc.usedAt) {
      throw new HttpError(
        400,
        'This verification code has already been used. Please request a new code.',
        'OTP_ALREADY_USED',
      );
    }

    if (otpDoc.expiresAt <= new Date()) {
      throw new HttpError(
        400,
        'This verification code has expired. Please request a new code.',
        'OTP_EXPIRED',
      );
    }

    if ((otpDoc.attempts ?? 0) >= 5) {
      otpDoc.attempts = 5;
      if (typeof otpDoc.save === 'function') {
        await otpDoc.save();
      }
      throw new HttpError(
        400,
        'Too many attempts. Please request a new code.',
        'TOO_MANY_ATTEMPTS',
      );
    }

    const otpHash =
      crypto
        .createHash('sha256')
        .update(otp)
        .digest('hex');

    if (otpDoc.hashedCode !== otpHash) {
      otpDoc.attempts = (otpDoc.attempts ?? 0) + 1;

      if (otpDoc.attempts >= 5) {
        if (typeof otpDoc.save === 'function') {
          await otpDoc.save();
        }
        throw new HttpError(
          400,
          'Too many attempts. Please request a new code.',
          'TOO_MANY_ATTEMPTS',
        );
      }

      if (typeof otpDoc.save === 'function') {
        await otpDoc.save();
      }

      throw new HttpError(
        400,
        'The verification code is invalid. Please try again.',
        'INVALID_OTP',
      );
    }

    otpDoc.usedAt = new Date();
    otpDoc.attempts = 0;

    if (typeof otpDoc.save === 'function') {
      await otpDoc.save();
    }

    const user =
      await authRepository.findByEmail(
        identifier,
      );

    if (!user || user.status === 'blocked') {
      throw new HttpError(
        400,
        'The verification code is invalid. Please try again.',
        'INVALID_OTP',
      );
    }

    const rawToken =
      crypto.randomBytes(32).toString('hex');

    const resetTokenHash =
      crypto
        .createHash('sha256')
        .update(rawToken)
        .digest('hex');

    user.passwordResetTokenHash =
      resetTokenHash;

    user.passwordResetExpiresAt =
      new Date(
        Date.now() + 30 * 60 * 1000,
      );

    await user.save();

    return {
      success: true,
      resetToken: rawToken,
    };
  },


  /**
   * Resend password-reset OTP.
   */
  async resendOtp({
    email,
  }: {
    email: string;
  }) {
    const identifier = email.toLowerCase();
    const latestOtp =
      await authRepository.findLatestOtp(
        identifier,
        'PASSWORD_RESET',
      );

    if (
      latestOtp &&
      latestOtp.createdAt &&
      Date.now() -
        new Date(latestOtp.createdAt).getTime() <
        30_000
    ) {
      throw new HttpError(
        429,
        'Please wait 30 seconds before requesting another code.',
        'RATE_LIMITED',
      );
    }

    const user =
      await authRepository.findByEmail(
        identifier,
      );

    if (
      user &&
      user.status !== 'blocked'
    ) {
      await authRepository.invalidateActiveOtps(
        identifier,
        'PASSWORD_RESET',
      );

      const otpCode =
        crypto.randomInt(100000, 1000000)
          .toString()
          .padStart(6, '0');

      const otpHash =
        crypto
          .createHash('sha256')
          .update(otpCode)
          .digest('hex');

      await authRepository.createOtp({
        userId: user.id,
        identifier,
        hashedCode: otpHash,
        purpose: 'PASSWORD_RESET',
        expiresAt: new Date(
          Date.now() + 10 * 60 * 1000,
        ),
      });

      try {
        await mailService.sendPasswordResetOtpEmail({
          name: user.name,
          email: user.email,
          otp: otpCode,
        });
      } catch (err) {
        console.error(
          'Password-reset OTP email failed for user',
          user.id,
          err,
        );
      }
    }

    return {
      success: true,
      message:
        'If an account exists, a verification code has been sent.',
    };
  },


  /**
   * Reset password.
   */
  async resetPassword({
    token,
    resetToken,
    newPassword,
  }: ResetPasswordInput) {

    const rawToken =
      (token ?? resetToken ?? '').trim();

    if (!rawToken) {
      throw new HttpError(
        400,
        'Reset token is required',
        'INVALID_RESET_TOKEN',
      );
    }

    const tokenHash =
      crypto
        .createHash('sha256')
        .update(rawToken)
        .digest('hex');

    const user =
      await authRepository.findByResetTokenHash(
        tokenHash,
      );


    if (
      !user ||
      user.status === 'blocked'
    ) {
      throw new HttpError(
        400,
        'This password reset link is invalid or has expired.',
        'INVALID_RESET_TOKEN',
      );
    }


    const passwordHash =
      await bcrypt.hash(
        newPassword,
        12,
      );


    user.passwordHash =
      passwordHash;


    user.passwordResetTokenHash =
      undefined;


    user.passwordResetExpiresAt =
      undefined;


    /**
     * Invalidate all previous sessions after
     * a password reset.
     */
    user.tokenVersion =
      (user.tokenVersion ?? 0) + 1;


    user.failedLogins = 0;

    user.lockedUntil = undefined;


    await user.save();


    return {
      success: true,
      message:
        'Your password has been reset successfully. Please log in with your new password.',
    };
  },
};