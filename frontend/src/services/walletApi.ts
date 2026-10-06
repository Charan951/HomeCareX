import http, { type ApiResponse } from "@/lib/http";
import { normalizeApiError } from "./bookingApi";
import type { LedgerType, WalletData } from "@/types/payment";

export interface WalletParams {
  page?: number;
  limit?: number;
  type?: LedgerType;
}

export const walletApi = {
  async get(params: WalletParams = {}): Promise<WalletData> {
    try {
      const { data } = await http.get<ApiResponse<WalletData>>("/wallet", { params });
      return data.data;
    } catch (err) {
      throw normalizeApiError(err);
    }
  },
};
