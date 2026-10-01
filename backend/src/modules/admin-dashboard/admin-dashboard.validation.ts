import { z } from 'zod';
import { Errors } from '../../utils/errors';
import { DAY_MS, DATE_PRESETS, DEFAULT_PRESET, IST_OFFSET_MS, MAX_RANGE_DAYS } from './admin-dashboard.constants';
import type { DashboardQuery, ResolvedRange } from './admin-dashboard.types';

const isoDay = z
  .string()
  .regex(/^\d{4}-\d{2}-\d{2}$/, 'Use YYYY-MM-DD')
  .refine((s) => !Number.isNaN(Date.parse(`${s}T00:00:00Z`)) && new Date(`${s}T00:00:00Z`).toISOString().startsWith(s), 'Not a real date');

export const dashboardQuerySchema = z.object({
  preset: z.enum(DATE_PRESETS).optional(),
  from: isoDay.optional(),
  to: isoDay.optional(),
  city: z.string().trim().min(1).max(100).optional(),
});

export function parseDashboardQuery(query: unknown): DashboardQuery {
  const parsed = dashboardQuerySchema.safeParse(query);
  if (!parsed.success) {
    throw Errors.validation(parsed.error.issues.map((i) => ({ field: i.path.join('.') || 'query', message: i.message })));
  }
  return parsed.data;
}

/** IST calendar day (YYYY-MM-DD) of an instant. */
export const istDay = (d: Date) => new Date(d.getTime() + IST_OFFSET_MS).toISOString().slice(0, 10);

/** Adds whole days to a YYYY-MM-DD string (calendar arithmetic, timezone-free). */
export function addDays(day: string, n: number): string {
  const [y, m, d] = day.split('-').map(Number);
  return new Date(Date.UTC(y, m - 1, d + n)).toISOString().slice(0, 10);
}

const startOf = (day: string) => new Date(`${day}T00:00:00.000+05:30`);
const endOf = (day: string) => new Date(`${day}T23:59:59.999+05:30`);
const daysBetween = (from: string, to: string) => Math.round((Date.parse(`${to}T00:00:00Z`) - Date.parse(`${from}T00:00:00Z`)) / DAY_MS) + 1;

function fromPreset(preset: NonNullable<DashboardQuery['preset']>, today: string): { from: string; to: string } {
  switch (preset) {
    case 'today':
      return { from: today, to: today };
    case '7d':
      return { from: addDays(today, -6), to: today };
    case '30d':
      return { from: addDays(today, -29), to: today };
    case '90d':
      return { from: addDays(today, -89), to: today };
    case 'this_month':
      return { from: `${today.slice(0, 8)}01`, to: today };
    case 'last_month': {
      const firstOfThis = `${today.slice(0, 8)}01`;
      const lastOfPrev = addDays(firstOfThis, -1);
      return { from: `${lastOfPrev.slice(0, 8)}01`, to: lastOfPrev };
    }
  }
}

/** Custom from/to wins over a preset. Both dates are needed for a custom range. Max 365 days. */
export function resolveRange(q: DashboardQuery, now = new Date()): ResolvedRange {
  let from: string;
  let to: string;
  if (q.from || q.to) {
    if (!q.from || !q.to) throw Errors.validation([{ field: q.from ? 'to' : 'from', message: 'Provide both from and to for a custom range' }]);
    ({ from, to } = q);
    if (from > to) throw Errors.validation([{ field: 'from', message: 'from must be on or before to' }]);
    if (to > istDay(now)) to = istDay(now); // nothing exists in the future
    if (from > to) throw Errors.validation([{ field: 'from', message: 'from cannot be in the future' }]);
  } else {
    ({ from, to } = fromPreset(q.preset ?? DEFAULT_PRESET, istDay(now)));
  }
  const days = daysBetween(from, to);
  if (days > MAX_RANGE_DAYS) {
    throw Errors.validation([{ field: 'from', message: `Date range cannot exceed ${MAX_RANGE_DAYS} days` }]);
  }
  return { from, to, start: startOf(from), end: endOf(to), days };
}

/** The window of the same length that ends the day before `range` starts. */
export function previousRange(range: ResolvedRange): ResolvedRange {
  const to = addDays(range.from, -1);
  const from = addDays(to, -(range.days - 1));
  return { from, to, start: startOf(from), end: endOf(to), days: range.days };
}
