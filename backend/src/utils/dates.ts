/** Business timezone offset from UTC in minutes. Default 330 = IST (UTC+5:30). */
export const businessTzOffsetMinutes = (): number => {
  const n = Number(process.env.BUSINESS_TZ_OFFSET_MINUTES);
  return Number.isFinite(n) && process.env.BUSINESS_TZ_OFFSET_MINUTES ? n : 330;
};

/** [start, end) of the current business day as UTC instants. */
export function dayBounds(now: Date, offsetMinutes = businessTzOffsetMinutes()): { start: Date; end: Date } {
  const local = new Date(now.getTime() + offsetMinutes * 60_000);
  const localMidnightUtc = Date.UTC(local.getUTCFullYear(), local.getUTCMonth(), local.getUTCDate());
  const start = new Date(localMidnightUtc - offsetMinutes * 60_000);
  return { start, end: new Date(start.getTime() + 86_400_000) };
}
/** Start of the current business week (Monday 00:00 in business time) as a UTC instant. */
export function weekStart(now: Date, offsetMinutes = businessTzOffsetMinutes()): Date {
  const { start } = dayBounds(now, offsetMinutes);
  const local = new Date(now.getTime() + offsetMinutes * 60_000);
  const daysSinceMonday = (local.getUTCDay() + 6) % 7;
  return new Date(start.getTime() - daysSinceMonday * 86_400_000);
}

/** Start of the current business month (1st, 00:00 in business time) as a UTC instant. */
export function monthStart(now: Date, offsetMinutes = businessTzOffsetMinutes()): Date {
  const local = new Date(now.getTime() + offsetMinutes * 60_000);
  return new Date(Date.UTC(local.getUTCFullYear(), local.getUTCMonth(), 1) - offsetMinutes * 60_000);
}

/** Start (UTC instant) of a "YYYY-MM-DD" calendar day in business time. */
export function parseLocalDate(ymd: string, offsetMinutes = businessTzOffsetMinutes()): Date {
  const [y, m, d] = ymd.split('-').map(Number);
  return new Date(Date.UTC(y, m - 1, d) - offsetMinutes * 60_000);
}

/** True for a real calendar date ("2026-02-30" is false). */
export function isRealDate(ymd: string): boolean {
  const [y, m, d] = ymd.split('-').map(Number);
  const dt = new Date(Date.UTC(y, m - 1, d));
  return dt.getUTCFullYear() === y && dt.getUTCMonth() === m - 1 && dt.getUTCDate() === d;
}

/** "YYYY-MM-DD" of an instant in business time. */
export function toLocalDateString(date: Date, offsetMinutes = businessTzOffsetMinutes()): string {
  return new Date(date.getTime() + offsetMinutes * 60_000).toISOString().slice(0, 10);
}

/** Offset as "+05:30", the format MongoDB's $dateToString timezone option accepts. */
export function formatOffset(offsetMinutes = businessTzOffsetMinutes()): string {
  const sign = offsetMinutes < 0 ? '-' : '+';
  const abs = Math.abs(offsetMinutes);
  return `${sign}${String(Math.floor(abs / 60)).padStart(2, '0')}:${String(abs % 60).padStart(2, '0')}`;
}