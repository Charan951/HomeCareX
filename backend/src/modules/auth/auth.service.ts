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

  ResendOtpInput,

  ResetPasswordInput,

  VerifyOtpInput,

} from './auth.validation';
 
import type { UserRole } from '../../models/User';
 
import { mailService } from '../../services/mail.service';
 
 
const OTP_PURPOSE = 'PASSWORD_RESET' as const;

const OTP_TTL_MS = 10 * 60 * 1000;

const OTP_MAX_ATTEMPTS = 5;

const OTP_RESEND_COOLDOWN_MS = 30 * 1000;

const RESET_TOKEN_TTL_MS = 15 * 60 * 1000;
 
const OTP_SENT_MESSAGE =

  'If an account exists, a verification code has been sent.';
 
const sha256 = (value: string) =>

  crypto.createHash('sha256').update(value).digest('hex');
 
const safeEqualHex = (a: string, b: string) => {

  const left = Buffer.from(a, 'utf8');

  const right = Buffer.from(b, 'utf8');

  return left.length === right.length && crypto.timingSafeEqual(left, right);

};
 
/**

* Creates a fresh 6-digit OTP (invalidating any active one) and emails it.

* Only a SHA-256 hash of the code is stored.

*/

async function issuePasswordResetOtp(user: {

  id?: string;

  name: string;

  email: string;

}) {

  const otp = crypto.randomInt(0, 1_000_000).toString().padStart(6, '0');
 
  await authRepository.invalidateActiveOtps(user.email, OTP_PURPOSE);
 
  await authRepository.createOtp({

    userId: user.id,

    identifier: user.email,

    hashedCode: sha256(otp),

    purpose: OTP_PURPOSE,

    expiresAt: new Date(Date.now() + OTP_TTL_MS),

  });
 
  try {

    await mailService.sendPasswordResetOtpEmail({

      name: user.name,

      email: user.email,

      otp,

    });

  } catch (err) {

    console.error('Password-reset OTP email failed for user', user.id, err);

  }

}
 
 
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

   * Forgot password: emails a 6-digit OTP (valid for 10 minutes).

   * Always returns the same message, so accounts cannot be enumerated.

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

      await issuePasswordResetOtp(user);

    }
 
 
    return {

      success: true,
 
      message: OTP_SENT_MESSAGE,

    };

  },
 
 
  /**

   * Verify the emailed OTP and hand back a single-use reset token.

   */

  async verifyOtp({

    email,

    otp,

  }: VerifyOtpInput) {
 
    if (!/^\d{6}$/.test(otp)) {

      throw new HttpError(

        400,

        'Enter a valid 6-digit verification code.',

        'INVALID_OTP_FORMAT',

      );

    }
 
 
    const otpDoc =

      await authRepository.findLatestOtp(

        email,

        OTP_PURPOSE,

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
 
 
    if (otpDoc.expiresAt.getTime() <= Date.now()) {

      throw new HttpError(

        400,

        'This verification code has expired. Please request a new code.',

        'OTP_EXPIRED',

      );

    }
 
 
    if ((otpDoc.attempts ?? 0) >= OTP_MAX_ATTEMPTS) {

      throw new HttpError(

        400,

        'Too many attempts. Please request a new code.',

        'TOO_MANY_ATTEMPTS',

      );

    }
 
 
    if (!safeEqualHex(sha256(otp), otpDoc.hashedCode)) {
 
      otpDoc.attempts = (otpDoc.attempts ?? 0) + 1;
 
      await otpDoc.save();
 
 
      if (otpDoc.attempts >= OTP_MAX_ATTEMPTS) {

        throw new HttpError(

          400,

          'Too many attempts. Please request a new code.',

          'TOO_MANY_ATTEMPTS',

        );

      }
 
      throw new HttpError(

        400,

        'The verification code is invalid. Please try again.',

        'INVALID_OTP',

      );

    }
 
 
    const user =

      await authRepository.findByEmail(

        email,

      );
 
 
    if (

      !user ||

      user.status === 'blocked'

    ) {

      throw new HttpError(

        400,

        'The verification code is invalid. Please try again.',

        'INVALID_OTP',

      );

    }
 
 
    /** The OTP can be used only once. */

    otpDoc.usedAt = new Date();
 
    await otpDoc.save();
 
 
    const resetToken =

      crypto.randomBytes(32).toString('hex');
 
 
    user.passwordResetTokenHash =

      sha256(resetToken);
 
    user.passwordResetExpiresAt =

      new Date(

        Date.now() + RESET_TOKEN_TTL_MS,

      );
 
    await user.save();
 
 
    return {

      success: true,
 
      message: 'Verification successful.',
 
      resetToken,

    };

  },
 
 
  /**

   * Send a new OTP, at most once every 30 seconds per email.

   */

  async resendOtp({

    email,

  }: ResendOtpInput) {
 
    const latest =

      await authRepository.findLatestOtp(

        email,

        OTP_PURPOSE,

      );
 
    const lastSentAt =

      (latest as { createdAt?: Date } | null)

        ?.createdAt;
 
 
    if (

      lastSentAt &&

      Date.now() - lastSentAt.getTime() <

        OTP_RESEND_COOLDOWN_MS

    ) {

      throw new HttpError(

        429,

        'Please wait 30 seconds before requesting another code.',

        'RATE_LIMITED',

      );

    }
 
 
    const user =

      await authRepository.findByEmail(

        email,

      );
 
 
    if (

      user &&

      user.status !== 'blocked'

    ) {

      await issuePasswordResetOtp(user);

    }
 
 
    return {

      success: true,
 
      message: OTP_SENT_MESSAGE,

    };

  },
 
 
  /**

   * Reset password with the single-use token from verifyOtp.

   * `token` is accepted as a legacy alias of `resetToken`.

   */

  async resetPassword({

    resetToken,

    token,

    newPassword,

  }: ResetPasswordInput) {
 
    const rawToken =

      resetToken ?? token;
 
 
    const user =

      rawToken

        ? await authRepository.findByResetTokenHash(

            sha256(rawToken),

          )

        : null;
 
 
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
 