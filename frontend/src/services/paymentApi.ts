import http, { type ApiResponse } from "@/lib/http";
import { normalizeApiError } from "./bookingApi";
import type { BookingView } from "@/types/booking";

export interface PaymentOrder {
  orderId: string;
  amount: number; // paise
  currency: string;
  keyId: string;
  prefill: { name: string; email: string; contact: string };
}

export interface RazorpaySuccessResponse {
  razorpay_order_id: string;
  razorpay_payment_id: string;
  razorpay_signature: string;
}

export const paymentApi = {
  async createOrder(bookingId: string): Promise<PaymentOrder> {
    try {
      const { data } = await http.post<ApiResponse<PaymentOrder>>("/payments/create-order", { bookingId });
      return data.data;
    } catch (err) {
      throw normalizeApiError(err);
    }
  },

  /** Idempotent on the server: repeating the same verification returns the same booking. */
  async verify(bookingId: string, r: RazorpaySuccessResponse): Promise<BookingView> {
    try {
      const { data } = await http.post<ApiResponse<BookingView>>("/payments/verify", { bookingId, ...r });
      return data.data;
    } catch (err) {
      throw normalizeApiError(err);
    }
  },

  /** Best-effort bookkeeping. Never throws, never changes the booking. */
  async recordAttempt(bookingId: string, kind: "CANCELLED" | "FAILED", orderId?: string, reason?: string) {
    try {
      await http.post("/payments/attempt", { bookingId, kind, orderId, reason });
    } catch {
      /* ignore */
    }
  },
};