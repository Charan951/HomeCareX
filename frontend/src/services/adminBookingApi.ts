import http, {
  type ApiError,
  type ApiResponse,
} from "@/lib/http";

import type {
  AdminBooking,
  AssignPartnerRequest,
  BookingFilters,
  BookingPartnerCandidate,
  CancelBookingRequest,
  StatusOverrideRequest,
} from "@/types/adminBooking";

export interface NormalizedAdminBookingError {
  status: number | null;
  code: string;
  message: string;
  details?: unknown;
}

function normalizeAdminBookingError(
  err: unknown,
): NormalizedAdminBookingError {
  const error = err as Partial<ApiError> | undefined;

  if (error && typeof error.message === "string") {
    return {
      status: error.status ?? null,
      code:
        error.code ??
        (error.status
          ? "UNKNOWN_ERROR"
          : "NETWORK_ERROR"),
      message: error.message,
      details: error.details,
    };
  }

  return {
    status: null,
    code: "UNKNOWN_ERROR",
    message: "Something went wrong. Please try again.",
  };
}

function buildBookingQuery(
  filters: BookingFilters,
): Record<string, string> {
  const params: Record<string, string> = {};

  if (filters.search.trim()) {
    params.search = filters.search.trim();
  }

  if (filters.status) {
    params.status = filters.status;
  }

  if (filters.city.trim()) {
    params.city = filters.city.trim();
  }

  if (filters.category.trim()) {
    params.category = filters.category.trim();
  }

  if (filters.customer.trim()) {
    params.customer = filters.customer.trim();
  }

  if (filters.partner.trim()) {
    params.partner = filters.partner.trim();
  }

  if (filters.date) {
    params.date = filters.date;
  }

  if (filters.paymentStatus) {
    params.paymentStatus = filters.paymentStatus;
  }

  return params;
}

export const adminBookingApi = {
  async getBookings(
    filters: BookingFilters,
  ): Promise<AdminBooking[]> {
    try {
      const { data } = await http.get<
        ApiResponse<AdminBooking[]>
      >("/admin/bookings", {
        params: buildBookingQuery(filters),
      });

      return data.data;
    } catch (err) {
      throw normalizeAdminBookingError(err);
    }
  },

  async getBookingById(
    bookingId: string,
  ): Promise<AdminBooking> {
    try {
      const { data } = await http.get<
        ApiResponse<AdminBooking>
      >(`/admin/bookings/${bookingId}`);

      return data.data;
    } catch (err) {
      throw normalizeAdminBookingError(err);
    }
  },

  async assignPartner(
    bookingId: string,
    payload: AssignPartnerRequest,
  ): Promise<AdminBooking> {
    try {
      const { data } = await http.patch<
        ApiResponse<AdminBooking>
      >(
        `/admin/bookings/${bookingId}/assign`,
        payload,
      );

      return data.data;
    } catch (err) {
      throw normalizeAdminBookingError(err);
    }
  },

  async overrideStatus(
    bookingId: string,
    payload: StatusOverrideRequest,
  ): Promise<AdminBooking> {
    try {
      await http.patch<ApiResponse<unknown>>(
        `/admin/bookings/${bookingId}/status`,
        payload,
      );

      return await adminBookingApi.getBookingById(
        bookingId,
      );
    } catch (err) {
      throw normalizeAdminBookingError(err);
    }
  },

  async cancelBooking(
    bookingId: string,
    payload: CancelBookingRequest,
  ): Promise<AdminBooking> {
    try {
      const { data } = await http.post<
        ApiResponse<AdminBooking>
      >(
        `/admin/bookings/${bookingId}/cancel`,
        payload,
      );

      return data.data;
    } catch (err) {
      throw normalizeAdminBookingError(err);
    }
  },

  async getEligiblePartners(
    bookingId: string,
  ): Promise<BookingPartnerCandidate[]> {
    try {
      const { data } = await http.get<
        ApiResponse<BookingPartnerCandidate[]>
      >(
        `/admin/bookings/${bookingId}/eligible-partners`,
      );

      return data.data;
    } catch (err) {
      throw normalizeAdminBookingError(err);
    }
  },
};