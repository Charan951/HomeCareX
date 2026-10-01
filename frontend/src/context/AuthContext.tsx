import React, { createContext, useCallback, useContext, useEffect, useMemo, useRef, useState } from "react";
import { useQueryClient } from "@tanstack/react-query";
import type { AuthContextValue, AuthStatus, AuthUser, LoginInput, ProfilePatch } from "../types/auth";
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
  const queryClient = useQueryClient();
  const currentUserId = useRef<string | null>(null);

  const applySession = useCallback(
    (next: AuthUser | null, token: string | null, nextStatus: AuthStatus) => {
      // Whenever the signed-in person changes (login as someone else, logout, session expiry),
      // drop every cached API response so the next user never sees the previous user's data.
      const nextId = next?.id ?? null;
      if (currentUserId.current !== nextId) {
        queryClient.clear();
        currentUserId.current = nextId;
      }
      tokenStore.set(token);
      setUser(next);
      setStatus(nextStatus);
      syncStore(next);
    },
    [queryClient],
  );

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

  // Edits name / email / phone in the local session. Swap the body for an API call once the backend has one.
  const updateProfile = useCallback((patch: ProfilePatch) => {
    setUser((prev) => {
      if (!prev) return prev;
      const next = { ...prev, ...patch };
      syncStore(next);
      return next;
    });
  }, []);

  const value = useMemo<AuthContextValue>(
    () => ({ user, status, isAuthenticated: status === "authenticated" && user !== null, login, logout, updateProfile }),
    [user, status, login, logout, updateProfile],
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) throw new Error("useAuth must be used inside AuthProvider");
  return context;
};
