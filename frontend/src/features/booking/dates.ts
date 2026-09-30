/** Customers can book today + the next 13 days (mirrors backend BOOKING_WINDOW_DAYS). */
export const BOOKING_WINDOW_DAYS = 14;

const pad = (n: number): string => String(n).padStart(2, "0");

/** YYYY-MM-DD in the browser's local timezone (toISOString() would give the UTC date, which is
 *  yesterday for the first 5.5 hours of every day in India). */
export function toLocalISODate(d: Date): string {
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;
}

export interface BookableDate {
  iso: string;
  weekday: string;
  day: number;
  month: string;
  isToday: boolean;
}

export function getBookableDates(from: Date = new Date()): BookableDate[] {
  return Array.from({ length: BOOKING_WINDOW_DAYS }, (_, i) => {
    const d = new Date(from.getFullYear(), from.getMonth(), from.getDate() + i);
    return {
      iso: toLocalISODate(d),
      weekday: d.toLocaleDateString("en-IN", { weekday: "short" }),
      day: d.getDate(),
      month: d.toLocaleDateString("en-IN", { month: "short" }),
      isToday: i === 0,
    };
  });
}

export function todayISO(): string {
  return toLocalISODate(new Date());
}
