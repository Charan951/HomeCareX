import http, {
  type ApiError,
  type ApiResponse,
} from "@/lib/http";

import type {
  BookingView,
  CreateBookingRequest,
  CreateBookingResponse,
  SlotAvailability,
  SlotsResponse,
  PartnerOption,
  BookingDetail,
} from "@/types/booking";

export interface NormalizedApiError {
  status: number;
  code: string;
  message: string;
  details?: unknown;
}

/**
 * `lib/http` already turns every failure into an ApiError
 * ({ message, status, code, details }).
 *
 * This function only fills in safe defaults so the rest of
 * the application receives a consistent error shape.
 */
export function normalizeApiError(
  err: unknown,
): NormalizedApiError {
  if (
    typeof err === "object" &&
    err !== null &&
    "message" in err
  ) {
    const e = err as Partial<ApiError>;

    return {
      status: e.status ?? 0,
      code:
        e.code ??
        (e.status === undefined
          ? "NETWORK_ERROR"
          : "UNKNOWN_ERROR"),
      message:
        e.message || "An unexpected error occurred",
      details: e.details,
    };
  }

  return {
    status: 0,
    code: "UNKNOWN_ERROR",
    message: "An unexpected error occurred",
  };
}

/**
 * Alias for internal backwards compatibility.
 */
export const normalizeError = normalizeApiError;

export const bookingApi = {
  // =========================================================================
  // CUSTOMER BOOKING APIs
  // =========================================================================

  /**
   * Fetch available slots for a service on a specific date.
   *
   * GET /services/:serviceId/slots?date=:date
   */
  async getSlots(
    serviceId: string,
    date: string,
  ): Promise<SlotsResponse> {
    try {
      const { data } =
        await http.get<ApiResponse<SlotsResponse>>(
          `/services/${serviceId}/slots`,
          {
            params: {
              date,
            },
          },
        );

      return data.data;
    } catch (err) {
      throw normalizeApiError(err);
    }
  },

  /**
   * Real-time slot availability check when moving
   * from Step 3 to Step 4.
   *
   * POST /bookings/check-slot
   *
   * Throws NormalizedApiError with status 409 if
   * the slot has already been booked.
   */
  async checkSlot(
    serviceId: string,
    date: string,
    slot: string,
  ): Promise<SlotAvailability> {
    try {
      const { data } =
        await http.post<ApiResponse<SlotAvailability>>(
          "/bookings/check-slot",
          {
            serviceId,
            date,
            slot,
          },
        );

      return data.data;
    } catch (err) {
      throw normalizeApiError(err);
    }
  },

  /**
   * Create a booking.
   *
   * The same idempotency key must be reused when
   * retrying the SAME request.
   *
   * POST /bookings
   */
  async createBooking(
    input: CreateBookingRequest,
    idempotencyKey: string,
  ): Promise<CreateBookingResponse> {
    try {
      const { data } =
        await http.post<
          ApiResponse<BookingView> & {
            replayed?: boolean;
          }
        >(
          "/bookings",
          input,
          {
            headers: {
              "Idempotency-Key": idempotencyKey,
            },
          },
        );

      return {
        booking: data.data,
        replayed: Boolean(data.replayed),
      };
    } catch (err) {
      throw normalizeApiError(err);
    }
  },

  /**
   * Fetch a single booking for the logged-in customer.
   *
   * GET /bookings/:id
   */
  async getBooking(
    id: string,
  ): Promise<BookingView> {
    try {
      const { data } =
        await http.get<ApiResponse<BookingView>>(
          `/bookings/${id}`,
        );

      return data.data;
    } catch (err) {
      throw normalizeApiError(err);
    }
  },

  /**
   * Fetch all live bookings for the logged-in customer.
   *
   * GET /bookings
   */
  async getBookings(): Promise<BookingView[]> {
    try {
      const { data } =
        await http.get<ApiResponse<BookingView[]>>(
          "/bookings",
        );

      return data.data ?? [];
    } catch (err) {
      throw normalizeApiError(err);
    }
  },

  // =========================================================================
  // ADMIN BOOKINGS MODULE
  // Day 4 - Issue #77
  // =========================================================================

  /**
   * Fetch complete booking details for the Admin Booking Drawer.
   *
   * GET /admin/bookings/:id
   *
   * Includes:
   * - booking information
   * - customer information
   * - assigned partner
   * - service information
   * - address
   * - pricing
   * - payment status
   * - booking timeline
   */
  async getAdminBooking(
    id: string,
  ): Promise<BookingDetail> {
    try {
      const { data } =
        await http.get<ApiResponse<BookingDetail>>(
          `/admin/bookings/${id}`,
        );

      return data.data;
    } catch (err) {
      throw normalizeApiError(err);
    }
  },

  /**
   * Assign or reassign a service partner to a booking.
   *
   * PATCH /admin/bookings/:id/assign
   *
   * The backend receives:
   * {
   *   partnerId,
   *   reason
   * }
   */
  async assignPartner(
    id: string,
    partnerId: string,
    reason: string,
  ): Promise<void> {
    try {
      await http.patch(
        `/admin/bookings/${id}/assign`,
        {
          partnerId,
          reason,
        },
      );
    } catch (err) {
      throw normalizeApiError(err);
    }
  },

  /**
   * Fetch partners eligible for assignment/reassignment.
   *
   * GET /admin/bookings/:bookingId/eligible-partners
   *
   * The backend is responsible for checking:
   * - partner approval
   * - active account
   * - category/service match
   * - service area
   * - availability
   * - booking conflicts
   */
  async getEligiblePartners(
    bookingId: string,
  ): Promise<PartnerOption[]> {
    try {
      const { data } =
        await http.get<ApiResponse<PartnerOption[]>>(
          `/admin/bookings/${bookingId}/eligible-partners`,
        );

      return data.data ?? [];
    } catch (err) {
      throw normalizeApiError(err);
    }
  },
};