export type UserRole = "admin" | "customer" | "partner";
 
export const ADMIN_ROLES: UserRole[] = ["admin"];
 
/** 'expired' = a previously valid session ended (401 / refresh failed). */
export type AuthStatus = "loading" | "authenticated" | "unauthenticated" | "expired";
 
export interface AuthUser {
  id: string;
  name: string;
  email?: string;
  phone?: string;
  role: UserRole;
  /** resource:action keys; ['*'] for admin. */
  permissions: string[];
  /** Landing route for the role: /customer, /partner or /admin. */
  home: string;
}
 
export interface LoginInput {
  email: string;
  password: string;
}

export type ProfilePatch = Partial<Pick<AuthUser, "name" | "email" | "phone">>;

export interface AuthContextValue {
  user: AuthUser | null;
  status: AuthStatus;
  isAuthenticated: boolean;
  /** Signs in and returns the user so the caller can redirect by role. */
  login: (input: LoginInput) => Promise<AuthUser>;
  /** Shared logout: ends the session on the server and clears local state. */
  logout: () => Promise<void>;
  /** Updates the signed-in user's editable details in the local session (no backend endpoint yet). */
  updateProfile: (patch: ProfilePatch) => void;
}
