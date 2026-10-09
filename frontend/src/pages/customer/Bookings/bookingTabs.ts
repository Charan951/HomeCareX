import type { BookingSort, BookingTab } from "@/types/bookingList";

export const PAGE_SIZE = 10;

export const TABS: { id: BookingTab; label: string }[] = [
  { id: "upcoming", label: "Upcoming" },
  { id: "live", label: "Live" },
  { id: "completed", label: "Completed" },
  { id: "cancelled", label: "Cancelled" },
];

export const isTab = (v: string | null): v is BookingTab =>
  TABS.some((t) => t.id === v);

export interface StatusOption {
  /** Sent as the API `status` param. A comma list is fine, the server accepts it. */
  value: string;
  label: string;
}

/**
 * What the Status filter offers inside each tab. Every value is one the server accepts, and every
 * status belongs to the tab it is listed under (the server owns the real grouping, see bookings.query.ts).
 */
export const STATUS_OPTIONS: Record<BookingTab, StatusOption[]> = {
  upcoming: [
    { value: "pending_payment", label: "Awaiting payment" },
    { value: "confirmed,created", label: "Confirmed" },
    { value: "searching_for_partner", label: "Finding a partner" },
    { value: "assigned", label: "Partner assigned" },
  ],
  live: [
    { value: "en_route", label: "En route" },
    { value: "arrived", label: "Arrived" },
    { value: "in_progress", label: "In progress" },
  ],
  completed: [
    { value: "completed,rated", label: "Completed" },
    { value: "disputed", label: "Disputed" },
  ],
  cancelled: [
    { value: "cancelled_by_customer,cancelled_by_admin", label: "Cancelled" },
    { value: "cancelled_by_partner", label: "Cancelled by partner" },
    { value: "no_show", label: "No show" },
  ],
};

export const SORT_OPTIONS: { value: BookingSort; label: string }[] = [
  { value: "date_asc", label: "Service date: soonest first" },
  { value: "date_desc", label: "Service date: latest first" },
  { value: "newest", label: "Booked: newest first" },
  { value: "oldest", label: "Booked: oldest first" },
  { value: "amount_desc", label: "Amount: high to low" },
  { value: "amount_asc", label: "Amount: low to high" },
];

/** What is still to come reads soonest-first. History reads latest-first. */
export const DEFAULT_SORT: Record<BookingTab, BookingSort> = {
  upcoming: "date_asc",
  live: "date_asc",
  completed: "date_desc",
  cancelled: "date_desc",
};

export const isSort = (v: string | null): v is BookingSort =>
  SORT_OPTIONS.some((o) => o.value === v);

export const EMPTY_COPY: Record<BookingTab, { title: string; description: string }> = {
  upcoming: {
    title: "No upcoming bookings",
    description: "Services you've scheduled will show up here.",
  },
  live: {
    title: "Nothing happening right now",
    description: "When a partner is on the way or working, you can follow it live here.",
  },
  completed: {
    title: "No completed bookings",
    description: "Finished services will show up here.",
  },
  cancelled: {
    title: "No cancelled bookings",
    description: "Cancelled bookings and their refunds will show up here.",
  },
};