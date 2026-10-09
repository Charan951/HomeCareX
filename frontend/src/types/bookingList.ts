import type { PageMeta } from "@/types/catalog";
import type { BookingListItem } from "@/pages/customer/Bookings/bookingModel";

/** The four tabs on /customer/bookings. The server owns which statuses each one contains. */
export type BookingTab = "upcoming" | "live" | "completed" | "cancelled";

export type BookingSort =
  | "newest"
  | "oldest"
  | "date_asc"
  | "date_desc"
  | "amount_asc"
  | "amount_desc";

/**
 * Everything GET /bookings accepts. Undefined and blank values are simply not sent.
 * `status` is a tab name, a single status ("en_route") or a comma list ("completed,cancelled").
 */
export interface BookingListParams {
  status?: string;
  search?: string;
  date?: string; // YYYY-MM-DD
  service?: string; // service id, or part of the service name
  sort?: BookingSort;
  page: number;
  limit: number;
}

export interface BookingPage {
  items: BookingListItem[];
  meta: PageMeta;
}