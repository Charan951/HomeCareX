import http, { type ApiResponse } from "@/lib/http";
import type { EarningsSummary } from "@/types/earnings";

export const earningsApi = {
  /** GET /partner/earnings/summary */
  async getSummary(): Promise<EarningsSummary> {
    const res = await http.get<ApiResponse<EarningsSummary>>("/partner/earnings/summary");
    return res.data.data;
  },
};