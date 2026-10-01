import http, { type ApiResponse } from "@/lib/http";
import { mockDashboard, mockEarningsSummary, mockJobRequests, mockNotifications } from "@/mocks/partnerDashboard";
import type { EarningsSummary, JobRequest, PartnerDashboard, PartnerNotification } from "@/types/partner";

export interface PartnerProfileInput {
  name: string;
  phone: string;
}

export type { ActiveJob, EarningsSummary, JobRequest, PartnerDashboard, PartnerNotification } from "@/types/partner";

/** Mocks are ON unless VITE_USE_MOCKS=false. Requests, earnings and notifications have no backend endpoint yet. */
const USE_MOCKS = String(import.meta.env.VITE_USE_MOCKS ?? "true") !== "false";

export const partnerApi = {
  async getDashboard(): Promise<PartnerDashboard> {
    if (USE_MOCKS) return mockDashboard();
    const res = await http.get<ApiResponse<PartnerDashboard>>("/partner/dashboard");
    return res.data.data;
  },
  // TODO(backend): GET /partner/job-requests
  async getJobRequests(): Promise<JobRequest[]> {
    return mockJobRequests();
  },
  // TODO(backend): GET /partner/earnings/summary
  async getEarningsSummary(): Promise<EarningsSummary> {
    return mockEarningsSummary();
  },
  // TODO(backend): PATCH /partner/profile  (no endpoint yet, so this only simulates a save)
  async updateProfile(input: PartnerProfileInput): Promise<PartnerProfileInput> {
    await new Promise((r) => setTimeout(r, 500));
    return input;
  },
  // TODO(backend): GET /partner/notifications
  async getNotifications(): Promise<PartnerNotification[]> {
    return mockNotifications();
  },
};