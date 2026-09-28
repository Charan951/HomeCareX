export type UserRole = "customer" | "partner" | "admin";

/** 'expired' = a previously valid session ended (401 / refresh failed). */
export type AuthStatus = "loading" | "authenticated" | "unauthenticated" | "expired";

export interface AuthUser {
  id: string;
  name: string;
  email?: string;
  phone?: string;
  role: UserRole;
}

export interface AuthContextValue {
  user: AuthUser | null;
  status: AuthStatus;
  isAuthenticated: boolean;
  /** Shared logout — clears the session. Customer UI must call this only. */
  logout: () => Promise<void>;
}