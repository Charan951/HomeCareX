// API Service: bookingApi
// Uses the shared authenticated client (lib/http): bearer token + automatic refresh on 401.
import http, { type ApiError, type ApiResponse } from "@/lib/http";
import type { CreateBookingRequest, CreateBookingResponse, SlotsResponse } from "@/types/booking";

export interface NormalizedApiError {
  status: number | null;
  code: string;
  message: string;
  details?: unknown;
}

/** One predictable error shape so callers can switch on `code` (SLOT_CONFLICT, VALIDATION_ERROR, ...). */
export function normalizeApiError(err: unknown): NormalizedApiError {
  const e = err as Partial<ApiError> | undefined;
  if (e && typeof e.message === "string") {
    const code = e.code ?? (e.status ? "UNKNOWN_ERROR" : "NETWORK_ERROR");
    return { status: e.status ?? null, code, message: e.message, details: e.details };
  }
  return { status: null, code: "UNKNOWN_ERROR", message: "Something went wrong. Please try again." };
}

export const bookingApi = {
  async getSlots(serviceId: string, date: string): Promise<SlotsResponse> {
    try {
      const { data } = await http.get<ApiResponse<SlotsResponse>>(`/services/${serviceId}/slots`, { params: { date } });
      return data.data;
    } catch (err) {
      throw normalizeApiError(err);
    }
  },

  async createBooking(payload: CreateBookingRequest, idempotencyKey: string): Promise<CreateBookingResponse> {
    try {
      const { data } = await http.post<ApiResponse<CreateBookingResponse>>("/bookings", payload, {
        headers: { "Idempotency-Key": idempotencyKey },
      });
      return data.data;
    } catch (err) {
      throw normalizeApiError(err);
    }
  },
};
