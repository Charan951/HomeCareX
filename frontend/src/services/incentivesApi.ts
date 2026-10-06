import http, { type ApiResponse } from "@/lib/http";
import type { Incentive, IncentivesList } from "@/types/incentives";

export const incentivesApi = {
  /** GET /partner/incentives */
  async getList(): Promise<IncentivesList> {
    const res = await http.get<ApiResponse<IncentivesList>>("/partner/incentives");
    return res.data.data;
  },

  /** GET /partner/incentives/:id */
  async getOne(id: string): Promise<Incentive> {
    const res = await http.get<ApiResponse<Incentive>>(`/partner/incentives/${encodeURIComponent(id)}`);
    return res.data.data;
  },
};