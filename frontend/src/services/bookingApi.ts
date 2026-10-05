import axios from "axios";

import type {
  BookingView,
  CreateBookingRequest,
  CreateBookingResponse,
  SlotAvailability,
  SlotsResponse,
} from "@/types/booking";

import {
  SESSION_EXPIRED_EVENT,
  tokenStore,
} from "@/lib/tokenStore";

import type { RazorpaySuccess } from "./razorpay";

export interface NormalizedApiError {
  status: number;
  code: string;
  message: string;
  details?: unknown;
}

export interface PaymentInit {
  /**
   * Razorpay order id.
   * Example: order_Qxxxxxxxx
   */
  orderId: string;

  /**
   * Amount in paise.
   * Example: ₹599 = 59900
   */
  amount: number;

  currency: string;

  /**
   * Razorpay public key.
   * Example: rzp_test_xxxxx
   */
  keyId?: string;
}

export type CreateBookingWithPayment = CreateBookingResponse & {
  payment?: PaymentInit;
};

const api = axios.create({
  baseURL: import.meta.env.VITE_API_URL || "/api/v1",

  // Needed if your backend uses refresh cookies.
  withCredentials: true,
});

/* -------------------------------------------------------------------------- */
/* Auth                                                                       */
/* -------------------------------------------------------------------------- */

function currentToken(): string | null {
  return tokenStore.get() ?? null;
}

api.interceptors.request.use((config) => {
  const token = currentToken();

  if (token) {
    config.headers = config.headers || {};

    config.headers.Authorization = `Bearer ${token}`;
  }

  return config;
});

api.interceptors.response.use(
  (response) => response,

  (error) => {
    if (
      axios.isAxiosError(error) &&
      error.response?.status === 401 &&
      currentToken()
    ) {
      window.dispatchEvent(
        new Event(SESSION_EXPIRED_EVENT)
      );
    }

    return Promise.reject(error);
  }
);

/* -------------------------------------------------------------------------- */
/* Error normalization                                                        */
/* -------------------------------------------------------------------------- */

export function normalizeApiError(
  error: unknown
): NormalizedApiError {
  if (axios.isAxiosError(error)) {
    const data = error.response?.data;

    return {
      status: error.response?.status ?? 500,
      code: data?.code ?? "UNKNOWN_ERROR",
      message:
        data?.message ??
        error.message ??
        "An unexpected error occurred",
      details: data?.details,
    };
  }

  return {
    status: 500,
    code: "UNKNOWN_ERROR",
    message:
      error instanceof Error
        ? error.message
        : "Unknown error",
  };
}

export const normalizeError = normalizeApiError;

/* -------------------------------------------------------------------------- */
/* Helpers                                                                    */
/* -------------------------------------------------------------------------- */

function normalizePayment(
  value: unknown
): PaymentInit | undefined {
  if (!value || typeof value !== "object") {
    return undefined;
  }

  const payment = value as Record<string, unknown>;

  /*
   * Support both camelCase API responses:
   *
   * {
   *   orderId: "...",
   *   keyId: "..."
   * }
   *
   * and Razorpay-style responses:
   *
   * {
   *   order_id: "...",
   *   key_id: "..."
   * }
   */

  const orderId =
    typeof payment.orderId === "string"
      ? payment.orderId
      : typeof payment.order_id === "string"
        ? payment.order_id
        : undefined;

  const keyId =
    typeof payment.keyId === "string"
      ? payment.keyId
      : typeof payment.key_id === "string"
        ? payment.key_id
        : undefined;

  const amount =
    typeof payment.amount === "number"
      ? payment.amount
      : Number(payment.amount);

  const currency =
    typeof payment.currency === "string"
      ? payment.currency
      : "INR";

  if (
    !orderId ||
    !Number.isFinite(amount) ||
    amount <= 0
  ) {
    console.error(
      "[bookingApi] Invalid payment initialization:",
      value
    );

    return undefined;
  }

  return {
    orderId,
    amount,
    currency,
    ...(keyId ? { keyId } : {}),
  };
}

/* -------------------------------------------------------------------------- */
/* Booking API                                                                */
/* -------------------------------------------------------------------------- */

export const bookingApi = {
  async getSlots(
    serviceId: string,
    date: string
  ): Promise<SlotsResponse> {
    try {
      const response = await api.get(
        `/services/${serviceId}/slots`,
        {
          params: {
            date,
          },
        }
      );

      return response.data.data;
    } catch (error) {
      throw normalizeApiError(error);
    }
  },

  async createBooking(
    input: CreateBookingRequest,
    idempotencyKey: string
  ): Promise<CreateBookingWithPayment> {
    try {
      const response = await api.post(
        "/bookings",
        input,
        {
          headers: {
            "Idempotency-Key": idempotencyKey,
          },
        }
      );

      console.log(
        "[bookingApi] POST /bookings response:",
        response.data
      );

      /*
       * Supported recommended shape:
       *
       * {
       *   data: {
       *      _id: "...",
       *      ...
       *   },
       *   payment: {
       *      orderId: "order_...",
       *      amount: 59900,
       *      currency: "INR",
       *      keyId: "rzp_test_..."
       *   }
       * }
       */

      let booking = response.data?.data;

      let paymentRaw =
        response.data?.payment ??
        response.data?.data?.payment;

      /*
       * Also support:
       *
       * {
       *   data: {
       *     booking: {...},
       *     payment: {...}
       *   }
       * }
       */
      if (
        response.data?.data?.booking &&
        typeof response.data.data.booking === "object"
      ) {
        booking = response.data.data.booking;

        paymentRaw =
          response.data.data.payment ??
          response.data.payment;
      }

      if (!booking?._id) {
        console.error(
          "[bookingApi] Booking missing from API response:",
          response.data
        );

        throw {
          status: 500,
          code: "INVALID_BOOKING_RESPONSE",
          message:
            "The server returned an invalid booking response.",
        } satisfies NormalizedApiError;
      }

      const payment = normalizePayment(paymentRaw);

      console.log("[bookingApi] Parsed booking:", booking);
      console.log("[bookingApi] Parsed payment:", payment);

      return {
        booking,
        replayed: Boolean(response.data?.replayed),

        ...(payment ? { payment } : {}),
      };
    } catch (error) {
      /*
       * Don't re-normalize an error we created ourselves.
       */
      if (
        error &&
        typeof error === "object" &&
        "code" in error &&
        "status" in error
      ) {
        throw error;
      }

      throw normalizeApiError(error);
    }
  },

  async verifyPayment(
    bookingId: string,
    result: RazorpaySuccess
  ): Promise<void> {
    try {
      console.log(
        "[bookingApi] Verifying payment:",
        {
          bookingId,
          paymentId:
            result.razorpay_payment_id,
          orderId:
            result.razorpay_order_id,
        }
      );

      await api.post("/payments/verify", {
        bookingId,

        razorpay_payment_id:
          result.razorpay_payment_id,

        razorpay_order_id:
          result.razorpay_order_id,

        razorpay_signature:
          result.razorpay_signature,
      });
    } catch (error) {
      throw normalizeApiError(error);
    }
  },

  async getBooking(
    id: string
  ): Promise<BookingView> {
    try {
      const response = await api.get(
        `/bookings/${id}`
      );

      return response.data.data;
    } catch (error) {
      throw normalizeApiError(error);
    }
  },

  async getBookings(): Promise<BookingView[]> {
    try {
      const response =
        await api.get("/bookings");

      return response.data.data ?? [];
    } catch (error) {
      throw normalizeApiError(error);
    }
  },
};