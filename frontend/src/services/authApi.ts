import http, { refreshAccessToken, type ApiResponse, type SessionPayload } from "@/lib/http";
import type { AuthUser, LoginInput, RegisterInput } from "@/types/auth";

export const authApi = {
  login: (input: LoginInput) =>
    http.post<ApiResponse<SessionPayload>>("/auth/login", input).then((r) => r.data.data),
  register: (input: RegisterInput) =>
    http.post<ApiResponse<SessionPayload>>("/auth/register", input).then((r) => r.data.data),
  // Uses the deduplicated single-flight promise:
  refresh: async (): Promise<SessionPayload> => {
    const session = await refreshAccessToken();
    if (!session) {
      throw new Error("Session expired or refresh token invalid");
    }
    return session;
  },
  logout: () => http.post<ApiResponse<null>>("/auth/logout").then(() => undefined),
  me: () => http.get<ApiResponse<AuthUser>>("/auth/me").then((r) => r.data.data),
  forgotPassword: (email: string) =>
    http.post<ApiResponse<{ message: string }>>("/auth/forgot-password", { email }).then((r) => r.data),
  verifyOtp: (input: { email: string; otp: string }) =>
    http.post<{ success: boolean; resetToken?: string; message: string }>("/auth/verify-otp", input).then((r) => r.data),
  resendOtp: (email: string) =>
    http.post<{ success: boolean; message: string }>("/auth/resend-otp", { email }).then((r) => r.data),
  resetPassword: (input: { resetToken: string; newPassword: string }) =>
    http.post<ApiResponse<{ message: string }>>("/auth/reset-password", input).then((r) => r.data),
};
