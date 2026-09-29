// API Service: apiClient
import axios, { AxiosError } from "axios";

/** Shared axios instance. Every module's *Api.ts wraps this instead of calling axios directly,
 *  so auth headers / base URL / error normalization stay in one place. */
export const apiClient = axios.create({
  baseURL: import.meta.env.VITE_API_BASE_URL ?? "http://localhost:5000/api/v1",
  timeout: 15000,
  headers: { "Content-Type": "application/json" },
});

apiClient.interceptors.request.use((config) => {
  const token = localStorage.getItem("auth_token");
  if (token) config.headers.Authorization = `Bearer ${token}`;
  return config;
});

export interface NormalizedApiError {
  status: number | null;
  code: string;
  message: string;
  details?: unknown;
}

/** Turns any axios failure (server error body, network drop, timeout) into one predictable shape
 *  so callers can switch on `code` without checking `error.response` first. */
export function normalizeApiError(err: unknown): NormalizedApiError {
  if (axios.isAxiosError(err)) {
    const axiosErr = err as AxiosError<{ error?: { code?: string; message?: string; details?: unknown } }>;
    const body = axiosErr.response?.data?.error;
    if (body?.code) {
      return { status: axiosErr.response?.status ?? null, code: body.code, message: body.message ?? "Something went wrong", details: body.details };
    }
    if (axiosErr.code === "ECONNABORTED") {
      return { status: null, code: "TIMEOUT", message: "The request timed out. Please try again." };
    }
    if (!axiosErr.response) {
      return { status: null, code: "NETWORK_ERROR", message: "Couldn't reach the server. Check your connection and try again." };
    }
    return { status: axiosErr.response.status, code: "UNKNOWN_ERROR", message: "Something went wrong. Please try again." };
  }
  return { status: null, code: "UNKNOWN_ERROR", message: "Something went wrong. Please try again." };
}
