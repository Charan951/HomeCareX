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
import { HttpError, type AccessTokenPayload, type AuthUserDto, type RefreshTokenPayload } from './auth.types';
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

const accessSecret = () => process.env.JWT_SECRET || 'dev_access_secret_change_me';
const refreshSecret = () => process.env.JWT_REFRESH_SECRET || `${accessSecret()}_refresh`;

const OTP_TTL_MINUTES = 10;
const MAX_OTP_ATTEMPTS = 5;
const RESET_TOKEN_TTL_MINUTES = 15;
const RESEND_COOLDOWN_MS = 30_000;

function maskEmail(email: string): string {
  const [local, domain] = email.split('@');
  if (!local || !domain) return '***';
  const visible = local.length <= 2 ? `${local[0]}*` : `${local[0]}${'*'.repeat(local.length - 2)}${local[local.length - 1]}`;
  return `${visible}@${domain}`;
}

function generateSecureOtp(): string {
  return crypto.randomInt(100000, 1000000).toString();
}

function hashSecret(val: string): string {
  return crypto.createHash('sha256').update(val).digest('hex');
}

type UserDoc = NonNullable<Awaited<ReturnType<typeof authRepository.findById>>>;

export function toAuthUser(user: UserDoc): AuthUserDto {
  const role = user.role as UserRole;
  return {
    id: user.id,
    name: user.name,
    email: user.email,
    phone: user.phone ?? undefined,
    role,
    permissions: ROLE_PERMISSIONS[role] ?? [],
    home: ROLE_HOME[role] ?? '/',
  };
}

function issueTokens(user: UserDoc) {
  const access: AccessTokenPayload = { sub: user.id, role: user.role as UserRole };
  const refresh: RefreshTokenPayload = { sub: user.id, v: user.tokenVersion };
  return {
    accessToken: jwt.sign(access, accessSecret(), { expiresIn: ACCESS_TOKEN_TTL }),
    refreshToken: jwt.sign(refresh, refreshSecret(), { expiresIn: `${REFRESH_TOKEN_TTL_DAYS}d` }),
  };
}

const sessionExpired = (code: string) => new HttpError(401, 'Your session has expired. Please log in again.', code);

export const authService = {
  async login({ email, password }: LoginInput) {
    const user = await authRepository.findByEmailWithPassword(email);
    // Same message for an unknown email and a wrong password, so accounts can't be probed.
    const invalid = new HttpError(401, 'Invalid email or password', 'INVALID_CREDENTIALS');
    if (!user) throw invalid;
    if (user.status === 'blocked') {
      throw new HttpError(403, 'This account has been blocked. Please contact support.', 'ACCOUNT_BLOCKED');
    }
    if (user.lockedUntil && user.lockedUntil > new Date()) {
      throw new HttpError(423, `Too many failed attempts. Try again in ${LOCK_MINUTES} minutes.`, 'ACCOUNT_LOCKED');
    }

    if (!(await bcrypt.compare(password, user.passwordHash))) {
      user.failedLogins = (user.failedLogins ?? 0) + 1;
      if (user.failedLogins >= MAX_FAILED_LOGINS) {
        user.lockedUntil = new Date(Date.now() + LOCK_MINUTES * 60_000);
        user.failedLogins = 0;
      }
      await user.save();
      throw invalid;
    }

    user.failedLogins = 0;
    user.lockedUntil = undefined;
    user.lastLoginAt = new Date();
    await user.save();
    return { user: toAuthUser(user), ...issueTokens(user) };
  },

  async register(input: RegisterInput) {
    if (await authRepository.existsByEmailOrPhone(input.email, input.phone)) {
      throw new HttpError(409, 'An account with this email or phone already exists', 'DUPLICATE_ACCOUNT');
    }
    const passwordHash = await bcrypt.hash(input.password, 12);
    const user = await authRepository.create({
      name: input.name,
      email: input.email,
      phone: input.phone,
      passwordHash,
      role: input.role,
      referralCode: input.referralCode,
    });

    try {
      await mailService.sendAccountCreatedEmail({
        name: user.name,
        email: user.email,
        role: user.role as UserRole,
        createdAt: user.createdAt,
      });
    } catch {
      console.error('Account-created email failed for user', user.id);
    }

    return { user: toAuthUser(user), ...issueTokens(user) };
  },

  /** Verifies the refresh cookie, rotates the token pair, and detects reuse. */
  async refresh(refreshToken?: string) {
    if (!refreshToken) throw sessionExpired('NO_REFRESH_TOKEN');
    let payload: RefreshTokenPayload;
    try {
      payload = jwt.verify(refreshToken, refreshSecret()) as RefreshTokenPayload;
    } catch {
      throw sessionExpired('INVALID_REFRESH_TOKEN');
    }
    const user = await authRepository.findById(payload.sub);
    if (!user || user.status === 'blocked') {
      throw sessionExpired('REVOKED_REFRESH_TOKEN');
    }

    const currentVersion = user.tokenVersion ?? 0;

    // Reuse detection: If token version is older than current, the token was already rotated.
    // Invalidate the session / token family by bumping tokenVersion so any subsequent
    // tokens in this family are also invalidated.
    if (payload.v < currentVersion) {
      user.tokenVersion = currentVersion + 1;
      await user.save();
      throw sessionExpired('REVOKED_REFRESH_TOKEN');
    }

    if (payload.v !== currentVersion) {
      throw sessionExpired('REVOKED_REFRESH_TOKEN');
    }

    // Normal rotation: increment token version and persist
    user.tokenVersion = currentVersion + 1;
    await user.save();

    return { user: toAuthUser(user), ...issueTokens(user) };
  },

  /** Logout ends every session of the user by bumping tokenVersion. */
  async logout(refreshToken?: string) {
    if (!refreshToken) return;
    try {
      const payload = jwt.verify(refreshToken, refreshSecret()) as RefreshTokenPayload;
      const user = await authRepository.findById(payload.sub);
      if (user && user.tokenVersion === payload.v) {
        user.tokenVersion += 1;
        await user.save();
      }
    } catch {
      // Token already invalid: nothing to revoke.
    }
  },

  verifyAccessToken(token: string): AccessTokenPayload {
    try {
      return jwt.verify(token, accessSecret()) as AccessTokenPayload;
    } catch {
      throw sessionExpired('INVALID_ACCESS_TOKEN');
    }
  },

  async me(userId: string) {
    const user = await authRepository.findById(userId);
    if (!user || user.status === 'blocked') throw sessionExpired('USER_NOT_FOUND');
    return toAuthUser(user);
  },

  /** Generates and dispatches a secure 6-digit OTP for password reset. */
  async forgotPassword({ email }: ForgotPasswordInput) {
    const normalizedEmail = email.trim().toLowerCase();
    const user = await authRepository.findByEmail(normalizedEmail);

    if (user && user.status !== 'blocked') {
      await authRepository.invalidateActiveOtps(user.email, 'PASSWORD_RESET');

      const otp = generateSecureOtp();
      const hashedCode = hashSecret(otp);
      const expiresAt = new Date(Date.now() + OTP_TTL_MINUTES * 60_000);

      await authRepository.createOtp({
        userId: user.id,
        identifier: user.email,
        hashedCode,
        purpose: 'PASSWORD_RESET',
        expiresAt,
      });

      if (process.env.NODE_ENV !== 'production') {
        console.log(`[DEV ONLY] Password reset OTP generated for ${maskEmail(user.email)}: ${otp}`);
      }

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

    // Critical security: Generic message to prevent account enumeration
    return {
      success: true,
      message: 'If an account exists, a verification code has been sent.',
    };
  },

  /** Resends an OTP with rate-limiting cooldown and anti-enumeration protection. */
  async resendOtp({ email }: ResendOtpInput) {
    const normalizedEmail = email.trim().toLowerCase();

    // Enforce 30-second cooldown per identifier
    const latestOtp = await authRepository.findLatestOtp(normalizedEmail, 'PASSWORD_RESET');
    if (latestOtp && (latestOtp as { createdAt?: Date }).createdAt) {
      const elapsed = Date.now() - new Date((latestOtp as { createdAt: Date }).createdAt).getTime();
      if (elapsed < RESEND_COOLDOWN_MS) {
        throw new HttpError(429, 'Please wait 30 seconds before requesting another code.', 'RATE_LIMITED');
      }
    }

    const user = await authRepository.findByEmail(normalizedEmail);

    if (user && user.status !== 'blocked') {
      await authRepository.invalidateActiveOtps(user.email, 'PASSWORD_RESET');

      const otp = generateSecureOtp();
      const hashedCode = hashSecret(otp);
      const expiresAt = new Date(Date.now() + OTP_TTL_MINUTES * 60_000);

      await authRepository.createOtp({
        userId: user.id,
        identifier: user.email,
        hashedCode,
        purpose: 'PASSWORD_RESET',
        expiresAt,
      });

      if (process.env.NODE_ENV !== 'production') {
        console.log(`[DEV ONLY] Password reset OTP generated for ${maskEmail(user.email)}: ${otp}`);
      }

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

    return {
      success: true,
      message: 'If an account exists, a verification code has been sent.',
    };
  },

  /** Verifies a 6-digit OTP, marks it used, and returns a single-use reset token. */
  async verifyOtp({ email, otp }: VerifyOtpInput) {
    const normalizedEmail = email.trim().toLowerCase();
    const cleanedOtp = otp.trim();

    if (!/^\d{6}$/.test(cleanedOtp)) {
      throw new HttpError(400, 'Enter a valid 6-digit verification code.', 'INVALID_OTP_FORMAT');
    }

    const otpDoc = await authRepository.findLatestOtp(normalizedEmail, 'PASSWORD_RESET');

    if (!otpDoc || otpDoc.expiresAt <= new Date()) {
      throw new HttpError(400, 'This verification code has expired. Please request a new code.', 'OTP_EXPIRED');
    }

    if (otpDoc.usedAt) {
      throw new HttpError(400, 'This verification code has already been used. Please request a new code.', 'OTP_ALREADY_USED');
    }

    if (otpDoc.attempts >= MAX_OTP_ATTEMPTS) {
      throw new HttpError(400, 'Too many attempts. Please request a new code.', 'TOO_MANY_ATTEMPTS');
    }

    const submittedHash = hashSecret(cleanedOtp);
    if (submittedHash !== otpDoc.hashedCode) {
      otpDoc.attempts += 1;
      await otpDoc.save();

      if (otpDoc.attempts >= MAX_OTP_ATTEMPTS) {
        throw new HttpError(400, 'Too many attempts. Please request a new code.', 'TOO_MANY_ATTEMPTS');
      }

      throw new HttpError(400, 'The verification code is invalid. Please try again.', 'INVALID_OTP');
    }

    // Mark OTP as single-use consumed
    otpDoc.usedAt = new Date();
    await otpDoc.save();

    const user = await authRepository.findByEmail(normalizedEmail);
    if (!user || user.status === 'blocked') {
      throw new HttpError(400, 'The verification code is invalid. Please try again.', 'INVALID_OTP');
    }

    // Issue single-use password reset token with short TTL
    const rawResetToken = crypto.randomBytes(32).toString('hex');
    const resetTokenHash = hashSecret(rawResetToken);

    user.passwordResetTokenHash = resetTokenHash;
    user.passwordResetExpiresAt = new Date(Date.now() + RESET_TOKEN_TTL_MINUTES * 60_000);
    await user.save();

    return {
      success: true,
      resetToken: rawResetToken,
      data: { resetToken: rawResetToken },
      message: 'Code verified successfully.',
    };
  },

  /** Consumes the single-use reset token, resets password, and revokes all active sessions. */
  async resetPassword({ resetToken, token, newPassword }: ResetPasswordInput) {
    const tokenToVerify = (resetToken || token)?.trim();
    if (!tokenToVerify) {
      throw new HttpError(400, 'Reset token is required.', 'INVALID_RESET_TOKEN');
    }

    const tokenHash = hashSecret(tokenToVerify);
    const user = await authRepository.findByResetTokenHash(tokenHash);

    if (!user || user.status === 'blocked') {
      throw new HttpError(400, 'This password reset link is invalid or has expired.', 'INVALID_RESET_TOKEN');
    }

    const passwordHash = await bcrypt.hash(newPassword, 12);
    user.passwordHash = passwordHash;
    user.passwordResetTokenHash = undefined;
    user.passwordResetExpiresAt = undefined;
    user.tokenVersion = (user.tokenVersion ?? 0) + 1; // Invalidate all previous sessions
    user.failedLogins = 0;
    user.lockedUntil = undefined;
    await user.save();

    return {
      success: true,
      message: 'Your password has been reset successfully. Please log in with your new password.',
    };
  },
};
