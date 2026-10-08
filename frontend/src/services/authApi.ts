import http, { type ApiResponse } from "@/lib/http";
import type { AuthUser, LoginInput, RegisterInput } from "@/types/auth";

interface SessionPayload {
  user: AuthUser;
  accessToken: string;
}

export interface VerifyOtpResponse {
  success: boolean;
  resetToken: string;
  message?: string;
  data?: {
    resetToken: string;
  };
}

export const authApi = {
  login: (input: LoginInput) =>
    http.post<ApiResponse<SessionPayload>>("/auth/login", input).then((r) => r.data.data),
  register: (input: RegisterInput) =>
    http.post<ApiResponse<SessionPayload>>("/auth/register", input).then((r) => r.data.data),
  refresh: () =>
    http.post<ApiResponse<SessionPayload>>("/auth/refresh").then((r) => r.data.data),
  logout: () =>
    http.post<ApiResponse<null>>("/auth/logout").then(() => undefined),
  me: () =>
    http.get<ApiResponse<AuthUser>>("/auth/me").then((r) => r.data.data),
  forgotPassword: (email: string) =>
    http
      .post<ApiResponse<{ message: string }>>("/auth/forgot-password", { email })
      .then((r) => r.data),
  verifyOtp: (input: { email: string; otp: string }) =>
    http
      .post<VerifyOtpResponse>("/auth/verify-otp", input)
      .then((r) => {
        const resetToken = r.data.resetToken || r.data.data?.resetToken || "";
        return {
          success: r.data.success,
          resetToken,
          message: r.data.message,
        };
      }),
  resendOtp: (email: string) =>
    http
      .post<ApiResponse<{ message: string }>>("/auth/resend-otp", { email })
      .then((r) => r.data),
  resetPassword: (input: { resetToken?: string; token?: string; newPassword: string }) =>
    http
      .post<ApiResponse<{ message: string }>>("/auth/reset-password", {
        resetToken: input.resetToken || input.token,
        token: input.token || input.resetToken,
        newPassword: input.newPassword,
      })
      .then((r) => r.data),
};

export default authApi;
