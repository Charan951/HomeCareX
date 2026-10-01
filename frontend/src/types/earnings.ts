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