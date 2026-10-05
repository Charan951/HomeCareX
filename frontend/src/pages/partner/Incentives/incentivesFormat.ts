const IST = "Asia/Kolkata";

export const inr = (n: number): string =>
  `₹${n.toLocaleString("en-IN", { minimumFractionDigits: 0, maximumFractionDigits: 2 })}`;

/** "5 Oct" (adds the year when it is not the current year). */
export function shortDate(iso: string): string {
  const d = new Date(iso);
  const thisYear = new Date().toLocaleDateString("en-IN", { year: "numeric", timeZone: IST });
  const year = d.toLocaleDateString("en-IN", { year: "numeric", timeZone: IST });
  return d.toLocaleDateString("en-IN", { day: "numeric", month: "short", ...(year !== thisYear ? { year: "numeric" } : {}), timeZone: IST });
}

/** The last day a campaign counts: endsAt is exclusive, so show the day before it. */
export const lastDay = (endsAtIso: string): string => shortDate(new Date(new Date(endsAtIso).getTime() - 1).toISOString());

export const plural = (n: number, one: string, many = `${one}s`): string => `${n} ${n === 1 ? one : many}`;