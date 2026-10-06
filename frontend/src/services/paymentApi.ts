import http, { type ApiResponse } from "@/lib/http";
import { normalizeApiError } from "./bookingApi";
import type { BookingView } from "@/types/booking";
import type { PaymentRecordStatus, PaymentsPage } from "@/types/payment";

export interface PaymentOrder {
  orderId: string;
  amount: number; // paise
  currency: string;
  keyId: string;
  prefill: { name: string; email: string; contact: string };
  attempt?: number;
}

export interface RazorpaySuccessResponse {
  razorpay_order_id: string;
  razorpay_payment_id: string;
  razorpay_signature: string;
}

export interface PaymentListParams {
  page?: number;
  limit?: number;
  status?: PaymentRecordStatus;
}

export const paymentApi = {
  /** Only the booking id is sent: the amount is read from the booking's price snapshot on the server. */
  async createOrder(bookingId: string): Promise<PaymentOrder> {
    try {
      const { data } = await http.post<ApiResponse<PaymentOrder>>("/payments/order", { bookingId });
      return data.data;
    } catch (err) {
      throw normalizeApiError(err);
    }
  },

  /** Cash on service: booking becomes CONFIRMED, payment stays PENDING. Safe to repeat. */
  async confirmCod(bookingId: string): Promise<BookingView> {
    try {
      const { data } = await http.post<ApiResponse<BookingView>>("/payments/cod", { bookingId });
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
  async recordAttempt(bookingId: string, kind: "CANCELLED" | "FAILED", orderId?: string, reason?: string): Promise<void> {
    try {
      await http.post("/payments/attempt", { bookingId, kind, orderId, reason });
    } catch {
      /* ignore */
    }
  },

  async list(params: PaymentListParams = {}): Promise<PaymentsPage> {
    try {
      const { data } = await http.get<ApiResponse<PaymentsPage>>("/payments", { params });
      return data.data;
    } catch (err) {
      throw normalizeApiError(err);
    }
  },
};
