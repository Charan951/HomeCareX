import React, {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";
import { useQueryClient } from "@tanstack/react-query";
import type {
  AuthContextValue,
  AuthStatus,
  AuthUser,
  LoginInput,
  RegisterInput,
  ProfilePatch,
} from "../types/auth";
import { authApi } from "@/services/authApi";
import { refreshAccessToken } from "@/lib/http";
import { SESSION_EXPIRED_EVENT, tokenStore } from "@/lib/tokenStore";
import { useAuthStore } from "@/store/useAuthStore";

export const AuthContext = createContext<AuthContextValue | null>(null);

/**
 * Non-sensitive hint that this browser previously had a signed-in session.
 * It only decides whether to TRY a silent refresh on page load, so logged-out
 * first-time visitors don't make a pointless /auth/refresh call (and don't get
 * a red 401 in the console). It is not a security control: the refresh cookie
 * is still the real authority.
 */
const SESSION_HINT_KEY = "hcx_session_hint";
const sessionHint = {
  has: (): boolean => {
    try {
      return localStorage.getItem(SESSION_HINT_KEY) === "1";
    } catch {
      return false;
    }
  },
  set: (on: boolean) => {
    try {
      if (on) localStorage.setItem(SESSION_HINT_KEY, "1");
      else localStorage.removeItem(SESSION_HINT_KEY);
    } catch {
      /* storage unavailable: ignore */
    }
  },
};

/**
 * Keeps the admin Zustand store in sync with the current authentication session.
 */
function syncStore(user: AuthUser | null) {
  useAuthStore.setState({
    isAuthenticated: user !== null,
    user: user as unknown as Record<string, unknown> | null,
  });
}

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({
  children,
}) => {
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
      sessionHint.set(nextStatus === "authenticated");
      setUser(next);
      setStatus(nextStatus);
      syncStore(next);
    },
    [queryClient],
  );

  // Restore the existing session when the application loads.
  // Uses the shared single-flight refresh from http.ts so that StrictMode's
  // double-effect and any early 401 retries all share ONE refresh request.
  useEffect(() => {
    let cancelled = false;
    const settleUnauthenticated = () => {
      if (cancelled) return;
      cancelled = true;
      applySession(null, null, "unauthenticated");
    };

    if (typeof navigator !== "undefined" && !navigator.onLine) {
      settleUnauthenticated();
      return;
    }

    // Never signed in on this browser: skip the refresh call entirely.
    if (!sessionHint.has()) {
      settleUnauthenticated();
      return;
    }

    window.addEventListener("offline", settleUnauthenticated);

    // Never rejects: resolves null when the refresh fails
    refreshAccessToken()
      .then((session) => {
        if (cancelled) return;
        if (session) {
          applySession(session.user, session.accessToken, "authenticated");
        } else {
          applySession(null, null, "unauthenticated");
        }
      })
      .finally(() => {
        window.removeEventListener("offline", settleUnauthenticated);
      });

    return () => {
      cancelled = true;
      window.removeEventListener("offline", settleUnauthenticated);
    };
  }, [applySession]);

  // Handle session expiration while the application is running.
  useEffect(() => {
    const onExpired = () => {
      applySession(null, null, "expired");
    };

    window.addEventListener(SESSION_EXPIRED_EVENT, onExpired);

    return () => {
      window.removeEventListener(SESSION_EXPIRED_EVENT, onExpired);
    };
  }, [applySession]);

  const login = useCallback(
    async (input: LoginInput) => {
      const { user: u, accessToken } = await authApi.login(input);

      applySession(u, accessToken, "authenticated");

      return u;
    },
    [applySession],
  );

  const register = useCallback(
    async (input: RegisterInput) => {
      const { user: u, accessToken } = await authApi.register(input);

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
    () => ({
      user,
      status,
      isAuthenticated: status === "authenticated" && user !== null,
      login,
      register,
      logout,
      updateProfile,
    }),
    [user, status, login, register, logout, updateProfile],
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};

export const useAuth = () => {
  const context = useContext(AuthContext);

  if (!context) {
    throw new Error("useAuth must be used inside AuthProvider");
  }

  return context;
};
