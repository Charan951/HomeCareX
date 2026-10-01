import http, { type ApiResponse } from "@/lib/http";
import type { EarningsFilters, EarningsLedger, EarningsSummary, LedgerQuery } from "@/types/earnings";

/** Drops empty filters so they are not sent as "?from=&status=". */
const clean = <T extends object>(params: T): Partial<T> =>
  Object.fromEntries(Object.entries(params).filter(([, v]) => v !== undefined && v !== "")) as Partial<T>;

const filenameFrom = (disposition: unknown): string | null => {
  const match = typeof disposition === "string" ? /filename="?([^";]+)"?/i.exec(disposition) : null;
  return match ? match[1] : null;
};

export const earningsApi = {
  /** GET /partner/earnings/summary */
  async getSummary(): Promise<EarningsSummary> {
    const res = await http.get<ApiResponse<EarningsSummary>>("/partner/earnings/summary");
    return res.data.data;
  },

  /** GET /partner/earnings: filtered, paged ledger plus totals and a per-day series for the chart. */
  async getLedger(query: LedgerQuery): Promise<EarningsLedger> {
    const res = await http.get<ApiResponse<EarningsLedger>>("/partner/earnings", { params: clean(query) });
    return res.data.data;
  },

  /**
   * GET /partner/earnings/export. Returns the CSV as a Blob ready to save.
   * Fetched as text (not "blob") so an error body such as "too many rows" is still JSON and
   * http.ts can show its message.
   */
  async exportCsv(filters: EarningsFilters): Promise<{ blob: Blob; filename: string }> {
    const res = await http.get<string>("/partner/earnings/export", { params: clean(filters) });
    // Browsers strip the UTF-8 BOM while decoding text; put it back so Excel reads the file correctly.
    const text = String(res.data).replace(/^\uFEFF/, "");
    return {
      blob: new Blob(["\uFEFF", text], { type: "text/csv;charset=utf-8" }),
      filename: filenameFrom(res.headers["content-disposition"]) ?? "earnings.csv",
    };
  },
};