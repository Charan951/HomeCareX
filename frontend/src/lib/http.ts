import axios, { type AxiosError, type InternalAxiosRequestConfig } from "axios";
import { SESSION_EXPIRED_EVENT, tokenStore } from "./tokenStore";

export interface ApiResponse<T> {
  success: boolean;
  data: T;
  message?: string;
}

export interface ApiError {
  message: string;
  status?: number;
  code?: string;
  details?: { field: string; message: string }[];
}

const http = axios.create({
  baseURL: "/api/v1",
  withCredentials: true,
  headers: { "Content-Type": "application/json" },
});

http.interceptors.request.use((config) => {
  const token = tokenStore.get();
  if (token) config.headers.Authorization = `Bearer ${token}`;
  return config;
});

// One refresh in flight at a time; parallel 401s wait for the same promise.
let refreshing: Promise<string | null> | null = null;

export function refreshAccessToken(): Promise<string | null> {
  refreshing ??= axios
    .post<ApiResponse<{ accessToken: string }>>("/api/v1/auth/refresh", null, { withCredentials: true })
    .then((res) => {
      tokenStore.set(res.data.data.accessToken);
      return res.data.data.accessToken;
    })
    .catch(() => {
      tokenStore.set(null);
      return null;
    })
    .finally(() => {
      refreshing = null;
    });
  return refreshing;
}

const isAuthCall = (url?: string) => !!url && /\/auth\/(login|register|refresh|logout)/.test(url);

http.interceptors.response.use(
  (response) => response,
  async (error: AxiosError<{ message?: string; code?: string; details?: ApiError["details"] }>) => {
    const original = error.config as (InternalAxiosRequestConfig & { _retried?: boolean }) | undefined;

    // 401 on a normal call: refresh once, then replay the request.
    if (error.response?.status === 401 && original && !original._retried && !isAuthCall(original.url)) {
      original._retried = true;
      const token = await refreshAccessToken();
      if (token) return http(original);
      window.dispatchEvent(new Event(SESSION_EXPIRED_EVENT));
    }

    const apiError: ApiError = {
      message: error.response
        ? error.response.data?.message || "Something went wrong. Please try again."
        : "Can't reach the server. Check your connection and try again.",
      status: error.response?.status,
      code: error.response?.data?.code,
      details: error.response?.data?.details,
    };
    return Promise.reject(apiError);
  },
);

export default http;
