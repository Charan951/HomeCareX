import type { UserRole } from '../../models/User';

export const ACCESS_TOKEN_TTL = '15m';
export const REFRESH_TOKEN_TTL_DAYS = 7;
export const REFRESH_COOKIE = 'hcx_refresh';
export const REFRESH_COOKIE_PATH = '/api/v1/auth';
export const MAX_FAILED_LOGINS = 5;
export const LOCK_MINUTES = 15;

/** resource:action permissions per system role. '*' = everything. */
export const ROLE_PERMISSIONS: Record<UserRole, string[]> = {
  admin: ['*'],
  partner: [
    'partner:dashboard', 'partner:jobs:read', 'partner:jobs:update',
    'partner:availability:read', 'partner:availability:update', 'partner:profile:read', 'partner:profile:update',
    'partner:earnings:read', 'partner:incentives:read',
  ],
  customer: [],
};

/** Where each role lands after login. */
export const ROLE_HOME: Record<UserRole, string> = {
  admin: '/admin',
  customer: '/customer',
  partner: '/partner',
};

export const AUTH_CONSTANTS = { ACCESS_TOKEN_TTL, REFRESH_TOKEN_TTL_DAYS, REFRESH_COOKIE, MAX_FAILED_LOGINS, LOCK_MINUTES };
