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
import type { ForgotPasswordInput, LoginInput, RegisterInput, ResetPasswordInput } from './auth.validation';
import type { UserRole } from '../../models/User';
import { mailService } from '../../services/mail.service';

const accessSecret = () => process.env.JWT_SECRET || 'dev_access_secret_change_me';
const refreshSecret = () => process.env.JWT_REFRESH_SECRET || `${accessSecret()}_refresh`;

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

  async forgotPassword({ email }: ForgotPasswordInput) {
    const user = await authRepository.findByEmail(email);
    if (user && user.status !== 'blocked') {
      const rawToken = crypto.randomBytes(32).toString('hex');
      const tokenHash = crypto.createHash('sha256').update(rawToken).digest('hex');

      user.passwordResetTokenHash = tokenHash;
      user.passwordResetExpiresAt = new Date(Date.now() + 30 * 60 * 1000); // 30 minutes
      await user.save();

      const frontendUrl = process.env.FRONTEND_URL
        || (process.env.APP_LOGIN_URL ? new URL(process.env.APP_LOGIN_URL).origin : 'http://localhost:3000');
      const resetUrl = `${frontendUrl.replace(/\/$/, '')}/reset-password?token=${rawToken}`;

      try {
        await mailService.sendPasswordResetEmail({
          name: user.name,
          email: user.email,
          resetUrl,
        });
      } catch (err) {
        console.error('Password-reset email failed for user', user.id, err);
      }
    }

    return {
      success: true,
      message: 'If an account exists for this email, a password reset link has been sent.',
    };
  },

  async resetPassword({ token, newPassword }: ResetPasswordInput) {
    const tokenHash = crypto.createHash('sha256').update(token).digest('hex');
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
      message: 'Your password has been reset successfully.',
    };
  },
};
