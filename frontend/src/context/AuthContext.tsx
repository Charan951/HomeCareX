import React, { createContext, useCallback, useMemo, useState } from "react";
import type { AuthContextValue, AuthStatus, AuthUser } from "../types/auth";

export const AuthContext = createContext<AuthContextValue | null>(null);

// MOCK user until the real auth provider is merged.
const MOCK_CUSTOMER: AuthUser = {
  id: "cust-001",
  name: "Ananya Rao",
  email: "ananya.rao@example.com",
  phone: "+91 98765 43210",
  role: "customer",
};

interface AuthProviderProps {
  children: React.ReactNode;
  /** Lets tests / Storybook start in any state. Defaults to a signed-in customer. */
  initialStatus?: AuthStatus;
}

/** MOCK provider — replace the internals with the shared auth implementation. */
export const AuthProvider: React.FC<AuthProviderProps> = ({ children, initialStatus = "authenticated" }) => {
  const [status, setStatus] = useState<AuthStatus>(initialStatus);
  const [user, setUser] = useState<AuthUser | null>(initialStatus === "authenticated" ? MOCK_CUSTOMER : null);

  const logout = useCallback(async () => {
    setUser(null);
    setStatus("unauthenticated");
  }, []);

  const value = useMemo<AuthContextValue>(
    () => ({ user, status, isAuthenticated: status === "authenticated" && user !== null, logout }),
    [user, status, logout],
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};
