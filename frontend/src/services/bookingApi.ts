import http, { type ApiError, type ApiResponse } from "@/lib/http";
import type {
  BookingView,
  CreateBookingRequest,
  CreateBookingResponse,
  SlotAvailability,
  SlotsResponse,
} from "@/types/booking";

export interface NormalizedApiError {
  status: number;
  code: string;
  message: string;
  details?: unknown;
}

/**
 * `lib/http` already turns every failure into an `ApiError` ({ message, status, code, details }),
 * so this only fills in defaults. Exported for addressApi.ts and other services.
 */
export function normalizeApiError(err: unknown): NormalizedApiError {
  if (typeof err === "object" && err !== null && "message" in err) {
    const e = err as Partial<ApiError>;
    return {
      status: e.status ?? 0,
      code: e.code ?? (e.status === undefined ? "NETWORK_ERROR" : "UNKNOWN_ERROR"),
      message: e.message || "An unexpected error occurred",
      details: e.details,
    };
  }
  return { status: 0, code: "UNKNOWN_ERROR", message: "An unexpected error occurred" };
}

// Alias for internal backwards compatibility
export const normalizeError = normalizeApiError;

export const bookingApi = {
  async getSlots(serviceId: string, date: string): Promise<SlotsResponse> {
    try {
      const { data } = await http.get<ApiResponse<SlotsResponse>>(`/services/${serviceId}/slots`, {
        params: { date },
      });
      return data.data;
    } catch (err) {
      throw normalizeApiError(err);
    }
  },

  /**
   * Real-time slot availability check when moving from Step 3 to Step 4.
   * Throws NormalizedApiError with status 409 if the slot was booked by another customer.
   */
  async checkSlot(serviceId: string, date: string, slot: string): Promise<SlotAvailability> {
    try {
      const { data } = await http.post<ApiResponse<SlotAvailability>>("/bookings/check-slot", {
        serviceId,
        date,
        slot,
      });
      return data.data;
    } catch (err) {
      throw normalizeApiError(err);
    }
  },

  /**
   * `idempotencyKey` must stay the same for retries of the SAME request (double click, dropped
   * connection) so the server replays the first booking instead of creating a second one.
   */
  async createBooking(input: CreateBookingRequest, idempotencyKey: string): Promise<CreateBookingResponse> {
    try {
      const { data } = await http.post<ApiResponse<BookingView> & { replayed?: boolean }>("/bookings", input, {
        headers: { "Idempotency-Key": idempotencyKey },
      });
      return { booking: data.data, replayed: Boolean(data.replayed) };
    } catch (err) {
      throw normalizeApiError(err);
    }
  },

  async getBooking(id: string): Promise<BookingView> {
    try {
      const { data } = await http.get<ApiResponse<BookingView>>(`/bookings/${id}`);
      return data.data;
    } catch (err) {
      throw normalizeApiError(err);
    }
  },

  /** Fetches all live bookings for the logged-in customer */
  async getBookings(): Promise<BookingView[]> {
    try {
      const { data } = await http.get<ApiResponse<BookingView[]>>("/bookings");
      return data.data ?? [];
    } catch (err) {
      throw normalizeApiError(err);
    }
  },
};