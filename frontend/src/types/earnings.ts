/** Mirrors backend/src/modules/earnings/earnings.types.ts. Keep the two in sync. */
export type EarningStatus = "pending" | "settled";

export interface Earning {
  id: string;
  bookingId: string;
  partnerId: string;
  gross: number;
  /** Fraction, 0.2 = 20% */
  commissionRate: number;
  commission: number;
  net: number;
  status: EarningStatus;
  earnedAt: string;
  settledAt: string | null;
}

/** GET /partner/earnings/summary. Net INR figures, never null. */
export interface EarningsSummary {
  currency: "INR";
  today: number;
  week: number;
  month: number;
  total: number;
  pending: number;
}


/** One ledger line: an earning plus the service it came from (null if the booking no longer exists). */
export interface LedgerRow extends Earning {
  serviceName: string | null;
}

export interface LedgerTotals {
  count: number;
  gross: number;
  commission: number;
  net: number;
}

/** Net earned on one business day, "YYYY-MM-DD". Days with no earnings are present with net 0. */
export interface LedgerDay {
  date: string;
  net: number;
}

export interface Pagination {
  page: number;
  limit: number;
  total: number;
  pages: number;
}

/** GET /partner/earnings. `totals` and `series` cover the whole filter, not just the current page. */
export interface EarningsLedger {
  currency: "INR";
  items: LedgerRow[];
  totals: LedgerTotals;
  series: LedgerDay[];
  pagination: Pagination;
}

/** Filters shared by the list and the CSV export. Dates are "YYYY-MM-DD" (India time), both inclusive. */
export interface EarningsFilters {
  from?: string;
  to?: string;
  status?: EarningStatus;
}

export interface LedgerQuery extends EarningsFilters {
  page: number;
  limit: number;
}