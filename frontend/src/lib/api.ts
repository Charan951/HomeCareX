import axios from "axios";
import * as tokenStoreModule from "./tokenStore";

/**
 * Resolves the authentication token from tokenStore or localStorage
 */
function getAuthToken(): string | null {
  // 1. Try reading from project tokenStore module if available
  try {
    const store = (tokenStoreModule as Record<string, any>).tokenStore || tokenStoreModule;
    if (typeof store.getAccessToken === "function") return store.getAccessToken();
    if (typeof store.getToken === "function") return store.getToken();
    if (typeof store.get === "function") return store.get();
  } catch {
    // Fall back to localStorage inspection
  }

  // 2. Check direct localStorage keys
  const directKeys = [
    "token",
    "accessToken",
    "access_token",
    "authToken",
    "auth_token",
    "hcx_token",
    "homecarex_token",
  ];

  for (const key of directKeys) {
    const val = localStorage.getItem(key);
    if (val && typeof val === "string" && !val.startsWith("{")) {
      return val;
    }
  }

  // 3. Check JSON state stores (e.g. auth-storage, user, auth)
  const jsonKeys = ["auth", "user", "currentUser", "auth-storage", "auth_user"];
  for (const key of jsonKeys) {
    const val = localStorage.getItem(key);
    if (val) {
      try {
        const parsed = JSON.parse(val);
        const resolved =
          parsed.token ||
          parsed.accessToken ||
          parsed.access_token ||
          parsed.state?.token ||
          parsed.state?.accessToken;
        if (resolved) return resolved;
      } catch {
        // Not JSON, continue
      }
    }
  }

  return null;
}

export const api = axios.create({
  baseURL: import.meta.env.VITE_API_URL || "http://localhost:5000/api/v1",
  withCredentials: true,
  headers: {
    "Content-Type": "application/json",
  },
});

/*
|--------------------------------------------------------------------------
| Request Interceptor
|--------------------------------------------------------------------------
*/
api.interceptors.request.use(
  (config) => {
    const token = getAuthToken();

    if (token && config.headers) {
      config.headers.Authorization = `Bearer ${token.replace(/^Bearer\s+/i, "")}`;
    }

    return config;
  },
  (error) => Promise.reject(error)
);

/*
|--------------------------------------------------------------------------
| Response Interceptor
|--------------------------------------------------------------------------
*/
api.interceptors.response.use(
  (response) => response,
  (error) => {
    const status = error.response?.status;

    if (status === 401) {
      console.warn("401 Unauthorized - clearing cached tokens");
      localStorage.removeItem("token");
      localStorage.removeItem("accessToken");
      if (window.location.pathname !== "/login") {
        window.location.href = "/login";
      }
    }

    return Promise.reject(error);
  }
);

export const apiClient = api;
export default api;