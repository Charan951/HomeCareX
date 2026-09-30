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