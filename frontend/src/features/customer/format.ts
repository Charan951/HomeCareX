import type { BookingStatusDto } from "./types";

/** Backend status → the label customers see (also the key used by statusBadgeClass). */
export function bookingStatusLabel(status: BookingStatusDto): string {
  switch (status) {
    case "created":
    case "searching_for_partner":
      return "Confirmed";
    case "assigned":
      return "Partner Assigned";
    case "en_route":
      return "En Route";
    case "arrived":
      return "Arrived";
    case "in_progress":
      return "In Progress";
    case "completed":
    case "rated":
    case "disputed":
      return "Completed";
    case "cancelled_by_customer":
    case "cancelled_by_partner":
    case "no_show":
      return "Cancelled";
  }
}

const startOfDay = (d: Date) => new Date(d.getFullYear(), d.getMonth(), d.getDate()).getTime();

/** "Today, 2:00 PM" · "Tomorrow, 11:00 AM" · "18 Sep, 4:30 PM" (device timezone). */
export function formatScheduled(iso: string, now: Date = new Date()): string {
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return "";
  const time = d.toLocaleTimeString("en-IN", { hour: "numeric", minute: "2-digit", hour12: true }).toUpperCase();
  const dayDiff = Math.round((startOfDay(d) - startOfDay(now)) / 86_400_000);
  if (dayDiff === 0) return `Today, ${time}`;
  if (dayDiff === 1) return `Tomorrow, ${time}`;
  const date = d.toLocaleDateString("en-IN", { day: "numeric", month: "short" });
  return `${date}, ${time}`;
}

/** 45 → "45 min", 60 → "1 hr", 90 → "1.5 hrs", 180 → "3 hrs". */
export function formatDuration(minutes: number): string {
  if (minutes < 60) return `${minutes} min`;
  const hrs = Math.round((minutes / 60) * 10) / 10;
  return `${hrs} ${hrs === 1 ? "hr" : "hrs"}`;
}

export function greetingForHour(hour: number): string {
  if (hour < 12) return "Good morning";
  if (hour < 17) return "Good afternoon";
  return "Good evening";
}
