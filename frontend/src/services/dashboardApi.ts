import { adminApi, type AdminStats } from '@/services/adminApi';

export interface DashboardFilters {
  from: string; // YYYY-MM-DD
  to: string; // YYYY-MM-DD
  city: string;
}

export const ALL_CITIES = 'All cities';
export const CITIES = [ALL_CITIES, 'Hyderabad', 'Bengaluru', 'Mumbai', 'Delhi', 'Chennai'];

export interface Kpi {
  value: number;
  /** % change vs the previous period of equal length; null when it cannot be computed. */
  deltaPct: number | null;
}
export interface Point {
  label: string;
  value: number;
}
export interface SnapshotItem {
  key: string;
  label: string;
  value: number;
  to: string;
  /** Highlight in red when value > 0. */
  alert?: boolean;
  /** Optional ₹ amount sitting in the queue (payouts, refunds). */
  amount?: number;
}
export interface FunnelStep {
  label: string;
  value: number;
}

// ---------- helpers ----------
const pad = (n: number) => String(n).padStart(2, '0');
export const toISO = (d: Date) => `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;
const parse = (s: string) => {
  const [y, m, d] = s.split('-').map(Number);
  return new Date(y, m - 1, d);
};
const addDays = (s: string, n: number) => {
  const d = parse(s);
  d.setDate(d.getDate() + n);
  return toISO(d);
};
export const dayDiff = (from: string, to: string) =>
  Math.round((parse(to).getTime() - parse(from).getTime()) / 86400000);

function rng(seed: string) {
  let h = 1779033703 ^ seed.length;
  for (let i = 0; i < seed.length; i++) {
    h = Math.imul(h ^ seed.charCodeAt(i), 3432918353);
    h = (h << 13) | (h >>> 19);
  }
  let a = h >>> 0;
  return () => {
    a = (a + 0x6d2b79f5) | 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

const delay = (ms: number) => new Promise((r) => setTimeout(r, ms));

/** Simulates a widget request. `fail` lets you force a widget to error (?fail=revenue,funnel). */
async function settle<T>(key: string, fail: string[], fn: () => T): Promise<T> {
  await delay(250 + Math.random() * 450);
  if (fail.includes(key)) throw new Error(`${key} failed`);
  return fn();
}

// ---------- sample daily data (replace with real endpoints) ----------
interface Daily {
  dates: string[];
  bookings: number[];
  revenue: number[];
  cancelled: number[];
}

function daily(from: string, to: string, city: string): Daily {
  const cf = city === ALL_CITIES ? 1 : 0.22;
  const out: Daily = { dates: [], bookings: [], revenue: [], cancelled: [] };
  const n = Math.min(dayDiff(from, to) + 1, 366);
  for (let i = 0; i < n; i++) {
    const date = addDays(from, i);
    const r = rng(`${date}|${city}`);
    const weekend = [0, 6].includes(parse(date).getDay()) ? 1.2 : 1;
    const bookings = Math.round((38 + r() * 30) * cf * weekend);
    out.dates.push(date);
    out.bookings.push(bookings);
    out.revenue.push(Math.round(bookings * (1100 + r() * 500)));
    out.cancelled.push(Math.round(bookings * (0.06 + r() * 0.06)));
  }
  return out;
}

const sum = (a: number[]) => a.reduce((x, y) => x + y, 0);
const delta = (cur: number, prev: number): number | null => (prev === 0 ? null : ((cur - prev) / prev) * 100);

function periods(f: DashboardFilters) {
  const days = dayDiff(f.from, f.to) + 1;
  const cur = daily(f.from, f.to, f.city);
  const prev = daily(addDays(f.from, -days), addDays(f.from, -1), f.city);
  return { cur, prev };
}

function bucket(d: Daily, values: number[], max = 30): Point[] {
  const size = Math.ceil(values.length / max);
  const pts: Point[] = [];
  for (let i = 0; i < values.length; i += size) {
    pts.push({
      label: parse(d.dates[i]).toLocaleDateString('en-IN', { day: 'numeric', month: 'short' }),
      value: sum(values.slice(i, i + size)),
    });
  }
  return pts;
}

// ---------- widget loaders ----------
export const dashboardApi = {
  gmv: (f: DashboardFilters, fail: string[]) =>
    settle<Kpi>('gmv', fail, () => {
      const { cur, prev } = periods(f);
      return { value: sum(cur.revenue), deltaPct: delta(sum(cur.revenue), sum(prev.revenue)) };
    }),

  bookings: (f: DashboardFilters, fail: string[]) =>
    settle<Kpi>('bookings', fail, () => {
      const { cur, prev } = periods(f);
      return { value: sum(cur.bookings), deltaPct: delta(sum(cur.bookings), sum(prev.bookings)) };
    }),

  cancellation: (f: DashboardFilters, fail: string[]) =>
    settle<Kpi>('cancellation', fail, () => {
      const { cur, prev } = periods(f);
      const rate = (d: Daily) => (sum(d.bookings) ? (sum(d.cancelled) / sum(d.bookings)) * 100 : 0);
      return { value: rate(cur), deltaPct: delta(rate(cur), rate(prev)) };
    }),

  /**
   * Live from the API. Prefers `activeCustomers` / `activePartners` when the stats endpoint returns them,
   * otherwise falls back to the all-time totals. Neither is date/city filtered.
   */
  customers: async (fail: string[]): Promise<Kpi> => {
    if (fail.includes('customers')) throw new Error('customers failed');
    const s = (await adminApi.getStats()) as AdminStats & { activeCustomers?: number };
    return { value: s.activeCustomers ?? s.customers, deltaPct: null };
  },
  partners: async (fail: string[]): Promise<Kpi> => {
    if (fail.includes('partners')) throw new Error('partners failed');
    const s = (await adminApi.getStats()) as AdminStats & { activePartners?: number };
    return { value: s.activePartners ?? s.partners, deltaPct: null };
  },

  snapshot: (f: DashboardFilters, fail: string[]) =>
    settle<SnapshotItem[]>('snapshot', fail, () => {
      const r = rng(`${toISO(new Date())}|${f.city}`);
      const n = (min: number, max: number) => Math.round(min + r() * (max - min));
      const payouts = n(4, 24);
      const refunds = n(0, 12);
      return [
        { key: 'approvals', label: 'Pending approvals', value: n(2, 14), to: '/admin/partners' },
        { key: 'tickets', label: 'Open tickets', value: n(3, 18), to: '/admin/support' },
        { key: 'payouts', label: 'Payout backlog', value: payouts, to: '/admin/payouts', alert: true, amount: payouts * n(2500, 6500) },
        { key: 'refunds', label: 'Refund queue', value: refunds, to: '/admin/refunds', alert: true, amount: refunds * n(900, 2600) },
      ];
    }),

  revenueSeries: (f: DashboardFilters, fail: string[]) =>
    settle<Point[]>('revenue', fail, () => {
      const d = daily(f.from, f.to, f.city);
      return bucket(d, d.revenue);
    }),

  bookingSeries: (f: DashboardFilters, fail: string[]) =>
    settle<Point[]>('bookingChart', fail, () => {
      const d = daily(f.from, f.to, f.city);
      return bucket(d, d.bookings);
    }),

  categories: (f: DashboardFilters, fail: string[]) =>
    settle<Point[]>('category', fail, () => {
      const total = sum(daily(f.from, f.to, f.city).bookings);
      const names = ['AC & Appliances', 'Plumbing', 'Electrical', 'Cleaning', 'Carpentry', 'Pest control'];
      const r = rng(`${f.from}|${f.to}|${f.city}|cat`);
      const w = names.map(() => 0.4 + r());
      const wt = sum(w);
      return names
        .map((label, i) => ({ label, value: Math.round((w[i] / wt) * total) }))
        .sort((a, b) => b.value - a.value);
    }),

  funnel: (f: DashboardFilters, fail: string[]) =>
    settle<FunnelStep[]>('funnel', fail, () => {
      const d = daily(f.from, f.to, f.city);
      const booked = sum(d.bookings);
      const checkout = Math.round(booked / 0.62);
      const viewed = Math.round(checkout / 0.35);
      return [
        { label: 'Visits', value: Math.round(viewed / 0.5) },
        { label: 'Service viewed', value: viewed },
        { label: 'Checkout started', value: checkout },
        { label: 'Booked', value: booked },
        { label: 'Completed', value: booked - sum(d.cancelled) },
      ];
    }),
};
