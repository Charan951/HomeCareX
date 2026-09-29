import type { AuthenticatedRole, AuthUser } from './auth.types';

export const DEFAULT_AUTH_USERS: Record<AuthenticatedRole, AuthUser> = {
  CUSTOMER: {
    id: 'dev-customer',
    name: 'Dev Customer',
    email: 'customer@example.com',
  },
  PARTNER: {
    id: 'dev-partner',
    name: 'Dev Partner',
    email: 'partner@example.com',
  },
  ADMIN: {
    id: 'dev-admin',
    name: 'Dev Admin',
    email: 'admin@example.com',
  },
};

export const buildMockAuthUser = (role: AuthenticatedRole): AuthUser => ({
  ...DEFAULT_AUTH_USERS[role],
});
