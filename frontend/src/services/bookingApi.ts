// API Service: bookingApi
import { apiClient, normalizeApiError, type NormalizedApiError } from "./apiClient";
import type { CreateBookingRequest, CreateBookingResponse, SlotsResponse } from "@/types/booking";

export type { NormalizedApiError };

export const bookingApi = {
  async getSlots(serviceId: string, date: string): Promise<SlotsResponse> {
    try {
      const { data } = await apiClient.get<{ success: true; data: SlotsResponse }>(`/services/${serviceId}/slots`, {
        params: { date },
      });
      return data.data;
    } catch (err) {
      throw normalizeApiError(err);
    }
  },

  async createBooking(payload: CreateBookingRequest, idempotencyKey: string): Promise<CreateBookingResponse> {
    try {
      const { data } = await apiClient.post<{ success: true; data: CreateBookingResponse }>("/bookings", payload, {
        headers: { "Idempotency-Key": idempotencyKey },
      });
      return data.data;
    } catch (err) {
      throw normalizeApiError(err);
    }
  },
};
