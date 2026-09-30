import http, { type ApiResponse } from "@/lib/http";
import type { AuthUser, LoginInput } from "@/types/auth";

interface SessionPayload {
  user: AuthUser;
  accessToken: string;
}

export const authApi = {
  login: (input: LoginInput) => http.post<ApiResponse<SessionPayload>>("/auth/login", input).then((r) => r.data.data),
  refresh: () => http.post<ApiResponse<SessionPayload>>("/auth/refresh").then((r) => r.data.data),
  logout: () => http.post<ApiResponse<null>>("/auth/logout").then(() => undefined),
  me: () => http.get<ApiResponse<AuthUser>>("/auth/me").then((r) => r.data.data),
};
