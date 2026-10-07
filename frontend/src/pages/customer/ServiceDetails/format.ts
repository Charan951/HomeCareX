import type { CSSProperties } from "react";
import { customerPath } from "@/routes/customerPath";

const IST = "Asia/Kolkata";
const DAY_MS = 86_400_000;

const ymd = (d: Date) =>
  new Intl.DateTimeFormat("en-CA", { timeZone: IST, year: "numeric", month: "2-digit", day: "2-digit" }).format(d);

/** "2026-10-06" -> "Today" / "Tomorrow" / "Wed, 7 Oct" (calendar days in India, whatever the viewer's timezone). */
export function formatSlotDay(date: string, now: Date = new Date()): string {
  if (date === ymd(now)) return "Today";
  if (date === ymd(new Date(now.getTime() + DAY_MS))) return "Tomorrow";
  const d = new Date(`${date}T12:00:00+05:30`);
  if (Number.isNaN(d.getTime())) return date;
  return new Intl.DateTimeFormat("en-IN", { timeZone: IST, weekday: "short", day: "numeric", month: "short" }).format(d);
}

/** ISO timestamp -> "Oct 2026". */
export function formatReviewDate(iso: string): string {
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return "";
  return new Intl.DateTimeFormat("en-IN", { month: "short", year: "numeric" }).format(d);
}

export const initialOf = (name: string): string => name.trim().charAt(0).toUpperCase() || "?";

export const bookingHref = (slug: string): string => `${customerPath(`/book/${slug}`)}?step=1`;
export const serviceHref = (slug: string): string => customerPath(`/services/${slug}`);

/** Typed helper for CSS custom properties in `style` (e.g. { "--i": 2 }). */
export const cssVars = (vars: Record<string, string | number>): CSSProperties => vars as CSSProperties;

export const prefersReducedMotion = (): boolean =>
  typeof window !== "undefined" && typeof window.matchMedia === "function" && window.matchMedia("(prefers-reduced-motion: reduce)").matches;
