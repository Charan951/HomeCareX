export type AuthenticatedRole = 'CUSTOMER' | 'PARTNER' | 'ADMIN';
export type UserRole = AuthenticatedRole | null;

export type AuthUser = {
  id: string;
  name: string;
  email?: string;
};

export type AuthContextValue = {
  user: AuthUser | null;
  role: UserRole;
  isAuthenticated: boolean;
  login: (user: AuthUser, role: AuthenticatedRole) => void;
  logout: () => void;
};
