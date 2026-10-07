import axios, { type AxiosError, type InternalAxiosRequestConfig } from "axios";
import { SESSION_EXPIRED_EVENT, tokenStore } from "./tokenStore";
import type { AuthUser } from "@/types/auth";

export interface ApiResponse<T> {
  success: boolean;
  data: T;
  message?: string;
}

export interface ApiError {
  message: string;
  status?: number;
  code?: string;
  isTimeout?: boolean;
  details?: { field: string; message: string }[];
}

export interface SessionPayload {
  user: AuthUser;
  accessToken: string;
}

const API_TIMEOUT_MS = 15000;

export const http = axios.create({
  baseURL: "/api/v1",
  withCredentials: true,
  timeout: API_TIMEOUT_MS,
  headers: { "Content-Type": "application/json" },
});

// Inject current in-memory access token
http.interceptors.request.use((config) => {
  const token = tokenStore.get();
  if (token) {
    if (typeof (config.headers as any).set === "function") {
      (config.headers as any).set("Authorization", `Bearer ${token}`);
    } else {
      config.headers.Authorization = `Bearer ${token}`;
    }
  }
  return config;
});

// Single-flight promise so concurrent refresh calls wait for the same request.
// AuthProvider also uses this function on startup, so there is only ever ONE
// refresh request in flight (important when refresh tokens are single-use).
let refreshingPromise: Promise<SessionPayload | null> | null = null;

export function refreshAccessToken(): Promise<SessionPayload | null> {
  if (!refreshingPromise) {
    refreshingPromise = axios
      .post<ApiResponse<SessionPayload>>("/api/v1/auth/refresh", null, {
        withCredentials: true,
        timeout: API_TIMEOUT_MS,
      })
      .then((res) => {
        const payload = res.data?.data;
        if (payload?.accessToken) {
          tokenStore.set(payload.accessToken);
          return payload;
        }
        tokenStore.set(null);
        return null;
      })
      .catch((err: AxiosError<{ message?: string; code?: string }>) => {
        // DEV ONLY: the refresh call uses bare axios, so log its failure reason here.
        if (import.meta.env.DEV) {
          console.warn(
            "[auth-debug] refresh failed " +
              JSON.stringify({
                status: err.response?.status,
                serverCode: err.response?.data?.code,
                serverMessage: err.response?.data?.message,
              }),
          );
        }
        tokenStore.set(null);
        return null;
      })
      .finally(() => {
        refreshingPromise = null;
      });
  }
  return refreshingPromise;
}

const isAuthCall = (url?: string) =>
  !!url && /\/auth\/(login|register|refresh|logout)/.test(url);

http.interceptors.response.use(
  (response) => response,
  async (
    error: AxiosError<{ message?: string; code?: string; details?: ApiError["details"] }>
  ) => {
    const original = error.config as
      | (InternalAxiosRequestConfig & { _retried?: boolean })
      | undefined;

    // DEV ONLY: say exactly why a 401 happened (no tokens are printed).
    if (import.meta.env.DEV && error.response?.status === 401) {
      const h = original?.headers as any;
      const sentAuth = Boolean(h?.Authorization || h?.get?.("Authorization"));
      console.warn(
        "[auth-debug] 401 " +
          JSON.stringify({
            url: original?.url,
            sentAuthorizationHeader: sentAuth,
            tokenInMemory: Boolean(tokenStore.get()),
            serverCode: error.response.data?.code,
            serverMessage: error.response.data?.message,
          }),
      );
    }

    // 401 on an unauthenticated call: refresh once, inject the new token, then replay
    if (
      error.response?.status === 401 &&
      original &&
      !original._retried &&
      !isAuthCall(original.url)
    ) {
      original._retried = true;

      // Capture BEFORE refreshing: a failed refresh clears the token store.
      const hadSession = Boolean(tokenStore.get());

      const session = await refreshAccessToken();

      if (session?.accessToken) {
        if (original.headers) {
          if (typeof (original.headers as any).set === "function") {
            (original.headers as any).set("Authorization", `Bearer ${session.accessToken}`);
          } else {
            original.headers.Authorization = `Bearer ${session.accessToken}`;
          }
        }
        return http(original);
      }

      // Refresh failed. Only announce "session expired" if the user actually
      // had a session; a logged-out visitor should not see that message.
      if (hadSession && typeof window !== "undefined") {
        window.dispatchEvent(new Event(SESSION_EXPIRED_EVENT));
      }
    }

    const isTimeout =
      error.code === "ECONNABORTED" ||
      error.code === "ETIMEDOUT" ||
      /timeout/i.test(error.message);

    const apiError: ApiError = {
      message: error.response
        ? error.response.data?.message || "Something went wrong. Please try again."
        : isTimeout
        ? "The server is taking too long to respond. Please check your connection and try again."
        : typeof navigator !== "undefined" && !navigator.onLine
        ? "Unable to reach the server. Please check your internet connection."
        : "Unable to reach the server. Please check your connection and try again.",
      status: error.response?.status,
      code: error.code || error.response?.data?.code,
      isTimeout,
      details: error.response?.data?.details,
    };

    return Promise.reject(apiError);
  }
);

export default http;