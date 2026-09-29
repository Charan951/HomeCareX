import http, { type ApiResponse } from "@/lib/http";

export interface ActiveJob {
  id: string;
  service: string;
  customer: string;
  address: string;
  status: "en_route" | "arrived" | "in_progress";
  scheduledAt: string;
}

/** GET /partner/dashboard */
export interface PartnerDashboard {
  newJobs: number;
  todayJobs: number;
  completedJobs: number;
  todayEarnings: number;
  rating: number;
  acceptanceRate: number;
  completionRate: number;
  activeJob: ActiveJob | null;
}

export const partnerApi = {
  async getDashboard(): Promise<PartnerDashboard> {
    const res = await http.get<ApiResponse<PartnerDashboard>>("/partner/dashboard");
    return res.data.data;
  },
};