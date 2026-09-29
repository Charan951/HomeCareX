import React, { createContext, useCallback, useContext, useEffect, useMemo, useState } from "react";
import type { AuthContextValue, AuthStatus, AuthUser, LoginInput } from "../types/auth";
import { authApi } from "@/services/authApi";
import { SESSION_EXPIRED_EVENT, tokenStore } from "@/lib/tokenStore";
import { useAuthStore } from "@/store/useAuthStore";

export const AuthContext = createContext<AuthContextValue | null>(null);

/** Keeps the admin zustand store (sidebar, PermissionGate) in step with the session. */
function syncStore(user: AuthUser | null) {
  useAuthStore.setState({ isAuthenticated: user !== null, user: user as unknown as Record<string, unknown> | null });
}

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [status, setStatus] = useState<AuthStatus>("loading");
  const [user, setUser] = useState<AuthUser | null>(null);

  const applySession = useCallback((next: AuthUser | null, token: string | null, nextStatus: AuthStatus) => {
    tokenStore.set(token);
    setUser(next);
    setStatus(nextStatus);
    syncStore(next);
  }, []);

  // On page load, restore the session from the httpOnly refresh cookie.
  useEffect(() => {
    let cancelled = false;
    authApi
      .refresh()
      .then(({ user: u, accessToken }) => !cancelled && applySession(u, accessToken, "authenticated"))
      .catch(() => !cancelled && applySession(null, null, "unauthenticated"));
    return () => {
      cancelled = true;
    };
  }, [applySession]);

  // Refresh failed mid-session (see lib/http.ts).
  useEffect(() => {
    const onExpired = () => applySession(null, null, "expired");
    window.addEventListener(SESSION_EXPIRED_EVENT, onExpired);
    return () => window.removeEventListener(SESSION_EXPIRED_EVENT, onExpired);
  }, [applySession]);

  const login = useCallback(
    async (input: LoginInput) => {
      const { user: u, accessToken } = await authApi.login(input);
      applySession(u, accessToken, "authenticated");
      return u;
    },
    [applySession],
  );

  const logout = useCallback(async () => {
    try {
      await authApi.logout();
    } finally {
      applySession(null, null, "unauthenticated");
    }
  }, [applySession]);

  const value = useMemo<AuthContextValue>(
    () => ({ user, status, isAuthenticated: status === "authenticated" && user !== null, login, logout }),
    [user, status, login, logout],
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) throw new Error("useAuth must be used inside AuthProvider");
  return context;
};
