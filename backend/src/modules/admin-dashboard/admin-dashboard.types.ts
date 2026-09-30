import type { DatePreset } from './admin-dashboard.constants';

export interface DashboardQuery {
  preset?: DatePreset;
  from?: string;
  to?: string;
  city?: string;
}

export interface ResolvedRange {
  /** Inclusive IST calendar days, YYYY-MM-DD. */
  from: string;
  to: string;
  start: Date;
  end: Date;
  days: number;
}

export interface Kpi {
  value: number;
  /** Percent change vs the previous period of the same length. null when the previous period had 0. */
  delta: number | null;
}

export interface DashboardSummary {
  range: { from: string; to: string; days: number; previousFrom: string; previousTo: string };
  city: string | null;
  kpis: {
    gmv: Kpi;
    bookings: Kpi;
    activeCustomers: Kpi;
    /** Without a city: partners with status "active" right now (no delta). With a city: partners who served bookings there. */
    activePartners: Kpi;
    /** Percent of bookings created in the range that ended cancelled / no-show. */
    cancellationRate: Kpi;
  };
  snapshot: {
    pendingApprovals: number;
    openTickets: number;
    payoutBacklog: { count: number; amount: number };
    refundQueue: { count: number; amount: number };
  };
  filters: { cities: string[] };
}

export interface TrendPoint {
  /** Bucket start (IST day, or Monday of the week). */
  date: string;
  bookings: number;
  gmv: number;
  /** Platform revenue: total − tax − partner earning, on completed bookings. */
  revenue: number;
}

export interface DashboardTrends {
  range: { from: string; to: string; days: number; granularity: 'day' | 'week' };
  city: string | null;
  series: TrendPoint[];
  categories: { categoryId: string | null; name: string; bookings: number; gmv: number }[];
  funnel: { stage: string; label: string; count: number; percentOfRequested: number }[];
}
