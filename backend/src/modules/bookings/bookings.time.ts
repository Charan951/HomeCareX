import { BOOKING_TIMEZONE } from './bookings.constants';

const formatter = new Intl.DateTimeFormat('en-CA', {
  timeZone: BOOKING_TIMEZONE,
  year: 'numeric',
  month: '2-digit',
  day: '2-digit',
  hour: '2-digit',
  minute: '2-digit',
  hourCycle: 'h23',
});

/** "Now" as a YYYY-MM-DD date plus minutes-since-midnight, in the booking timezone. */
export function nowInBookingTz(now: Date = new Date()): { date: string; minutes: number } {
  const parts = Object.fromEntries(formatter.formatToParts(now).map((p) => [p.type, p.value]));
  return {
    date: `${parts.year}-${parts.month}-${parts.day}`,
    minutes: Number(parts.hour) * 60 + Number(parts.minute),
  };
}

/** True only for real calendar dates ("2026-02-30" passes a regex but is not one). */
export function isRealDate(date: string): boolean {
  const [y, m, d] = date.split('-').map(Number);
  const dt = new Date(Date.UTC(y, m - 1, d));
  return dt.getUTCFullYear() === y && dt.getUTCMonth() === m - 1 && dt.getUTCDate() === d;
}

/** Date arithmetic on YYYY-MM-DD strings (UTC maths, so no DST/timezone drift). */
export function addDays(date: string, days: number): string {
  const [y, m, d] = date.split('-').map(Number);
  return new Date(Date.UTC(y, m - 1, d + days)).toISOString().slice(0, 10);
}

/** "08:00-10:00" -> 480 */
export function slotStartMinutes(slot: string): number {
  const [h, m] = slot.slice(0, 5).split(':').map(Number);
  return h * 60 + m;
}