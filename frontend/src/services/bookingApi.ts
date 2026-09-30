import axios from "axios";
import type {
  BookingView,
  CreateBookingRequest,
  CreateBookingResponse,
  SlotsResponse,
} from "@/types/booking";

export interface NormalizedApiError {
  status: number;
  code: string;
  message: string;
  details?: unknown;
}

const api = axios.create({
  baseURL: import.meta.env.VITE_API_URL || "/api/v1",
});

api.interceptors.request.use((config) => {
  const token =
    localStorage.getItem("token") || localStorage.getItem("customer_token");
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

/**
 * Normalized API error helper function exported for addressApi.ts and other services
 */
export function normalizeApiError(err: unknown): NormalizedApiError {
  if (axios.isAxiosError(err)) {
    const data = err.response?.data;
    return {
      status: err.response?.status ?? 500,
      code: data?.code ?? "UNKNOWN_ERROR",
      message: data?.message ?? err.message ?? "An unexpected error occurred",
      details: data?.details,
    };
  }
  return {
    status: 500,
    code: "UNKNOWN_ERROR",
    message: err instanceof Error ? err.message : "Unknown error",
  };
}

// Alias for internal backwards compatibility
export const normalizeError = normalizeApiError;

export const bookingApi = {
  async getSlots(serviceId: string, date: string): Promise<SlotsResponse> {
    try {
      const res = await api.get(`/services/${serviceId}/slots`, {
        params: { date },
      });
      return res.data.data;
    } catch (err) {
      throw normalizeApiError(err);
    }
  },

  async createBooking(
    input: CreateBookingRequest,
    idempotencyKey: string
  ): Promise<CreateBookingResponse> {
    try {
      const res = await api.post("/bookings", input, {
        headers: { "Idempotency-Key": idempotencyKey },
      });
      return {
        booking: res.data.data,
        replayed: Boolean(res.data.replayed),
      };
    } catch (err) {
      throw normalizeApiError(err);
    }
  },

  async getBooking(id: string): Promise<BookingView> {
    try {
      const res = await api.get(`/bookings/${id}`);
      return res.data.data;
    } catch (err) {
      throw normalizeApiError(err);
    }
  },

  /** Fetches all live bookings for the logged-in customer */
  async getBookings(): Promise<BookingView[]> {
    try {
      const res = await api.get("/bookings");
      return res.data.data ?? [];
    } catch (err) {
      throw normalizeApiError(err);
    }
  },
};