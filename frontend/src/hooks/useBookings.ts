import { keepPreviousData, useQuery } from "@tanstack/react-query";
import { retryTransient } from "@/services/catalogApi";
import { bookingApi, type NormalizedApiError } from "@/services/bookingApi";
import type {
  BookingListParams,
  BookingPage,
  BookingSort,
  BookingTab,
} from "@/types/bookingList";

/**
 * Every customer-bookings query lives under this prefix, so one
 * `invalidateQueries({ queryKey: ["customer-bookings"] })` (as usePayBooking does) refreshes them all.
 */
export const bookingKeys = {
  all: ["customer-bookings"] as const,
  list: (params: BookingListParams) =>
    ["customer-bookings", "list", params] as const,
};

export interface UseBookingsParams {
  tab: BookingTab;
  /**
   * Narrows the tab to one status (the Status filter). It must be one of the tab's own statuses,
   * the page only offers those. Left out, the whole tab is returned.
   */
  status?: string;
  search?: string;
  date?: string;
  service?: string;
  sort?: BookingSort;
  page: number;
  limit: number;
}

/** How often the Live tab re-checks for a partner moving to the next step. */
const LIVE_REFRESH_MS = 30_000;

/**
 * One page of the customer's bookings for a tab and its filters.
 *
 * The previous page stays on screen (`isPlaceholderData`) while the next one loads, so switching
 * page or filter never flashes an empty or skeleton list. Reset `page` to 1 whenever the tab,
 * search or any filter changes.
 */
export function useBookings(params: UseBookingsParams) {
  const { tab, status, ...rest } = params;
  const request: BookingListParams = { ...rest, status: status ?? tab };

  return useQuery<BookingPage, NormalizedApiError>({
    queryKey: bookingKeys.list(request),
    queryFn: ({ signal }) => bookingApi.listBookings(request, signal),
    placeholderData: keepPreviousData,
    staleTime: 15_000,
    retry: retryTransient,
    // Only the Live tab changes under the customer's feet; polling pauses while the tab is hidden.
    refetchInterval: tab === "live" ? LIVE_REFRESH_MS : false,
  });
}