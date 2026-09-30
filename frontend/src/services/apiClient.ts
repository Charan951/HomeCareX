import http, { type ApiResponse } from "@/lib/http";
import type { SlotAvailability } from "@/types/booking";

// Helper to format API errors cleanly
export function normalizeApiError(error: unknown) {
  if (typeof error === 'object' && error !== null && 'response' in error) {
    const res = (error as any).response;
    return new Error(res?.data?.message || 'An unexpected error occurred');
  }
  return error instanceof Error ? error : new Error('An unexpected error occurred');
}

export const bookingApi = {
  // P0 Task: Fetch slots
  async getSlots(serviceId: string, date: string): Promise<SlotAvailability[]> {
    try {
      const { data } = await http.get<ApiResponse<SlotAvailability[]>>(`/services/${serviceId}/slots`, {
        params: { date },
      });
      return data.data; 
    } catch (err) {
      throw normalizeApiError(err);
    }
  },

  // Create a new booking
  async createBooking(payload: any): Promise<any> {
    try {
      const { data } = await http.post<ApiResponse<any>>('/bookings', payload);
      return data.data.booking;
    } catch (err) {
      throw normalizeApiError(err);
    }
  },

  // Get a single booking by ID
  async getBooking(bookingId: string): Promise<any> {
    try {
      const { data } = await http.get<ApiResponse<any>>(`/bookings/${bookingId}`);
      return data.data.booking;
    } catch (err) {
      throw normalizeApiError(err);
    }
  }
};