import { useCallback, useRef, useState } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { paymentApi } from "@/services/paymentApi";
import type { NormalizedApiError } from "@/services/bookingApi";
import { BOOKING_STATUS, PAYMENT_STATUS, type BookingView } from "@/types/booking";
import type { CheckoutPhase } from "@/types/payment";
import { loadRazorpayScript, type RazorpayFailure, type RazorpaySuccess } from "./razorpay";
import { PAYMENTS_QUERY_KEY } from "./usePayments";

/** Mirrors backend COD_ONLINE_PAYABLE_STATUSES: a Cash-on-Service booking can still be paid online until it ends. */
const PAYABLE_STATUSES: readonly string[] = [
  BOOKING_STATUS.CONFIRMED,
  BOOKING_STATUS.CREATED,
  BOOKING_STATUS.SEARCHING_FOR_PARTNER,
  BOOKING_STATUS.ASSIGNED,
  BOOKING_STATUS.EN_ROUTE,
  BOOKING_STATUS.ARRIVED,
  BOOKING_STATUS.IN_PROGRESS,
];

/** An unpaid booking whose 10-minute slot hold has run out. The server frees its seat, so it can no longer be paid. */
export function isExpiredHold(booking: Pick<BookingView, "status" | "holdExpiresAt">, now: number = Date.now()): boolean {
  if (booking.status !== BOOKING_STATUS.PENDING_PAYMENT || !booking.holdExpiresAt) return false;
  return new Date(booking.holdExpiresAt).getTime() <= now;
}

/** The last online payment attempt failed (server flags it) and the customer hasn't paid since. */
export function isPaymentFailed(booking: Pick<BookingView, "paymentStatus" | "paymentDetails">): boolean {
  return booking.paymentStatus === PAYMENT_STATUS.FAILED || (booking.paymentStatus === PAYMENT_STATUS.PENDING && booking.paymentDetails?.status === "FAILED");
}

/**
 * Can this booking be paid online right now? Never after a failed payment: those just say "Payment failed".
 * - pending_payment with its hold still valid: checkout was started but not finished (closed popup, failed payment, left the page).
 * - confirmed or later with payment still PENDING: booked as Cash on Service (online payment always confirms and marks PAID in one step).
 */
export function canPayOnline(
  booking: Pick<BookingView, "status" | "paymentStatus" | "holdExpiresAt" | "paymentDetails">,
  now: number = Date.now(),
): boolean {
  if (booking.paymentStatus !== PAYMENT_STATUS.PENDING || isPaymentFailed(booking)) return false;
  if (booking.status === BOOKING_STATUS.PENDING_PAYMENT) return !isExpiredHold(booking, now);
  return PAYABLE_STATUSES.includes(booking.status);
}

export interface PayBookingState {
  bookingId: string | null;
  phase: CheckoutPhase;
  message?: string;
}

const IDLE: PayBookingState = { bookingId: null, phase: "idle" };

const messageOf = (err: unknown, fallback: string): string => {
  const m = (err as Partial<NormalizedApiError> | null)?.message;
  return typeof m === "string" && m.trim() ? m : fallback;
};

/**
 * Pays an existing booking with Razorpay Checkout (test or live keys, whichever the server is configured with).
 * Amount is never sent: the server reads it from the booking's price snapshot. One payment at a time.
 */
export function usePayBooking() {
  const queryClient = useQueryClient();
  const inFlight = useRef(false);
  const [state, setState] = useState<PayBookingState>(IDLE);

  const refresh = useCallback(
    () =>
      Promise.all([
        queryClient.invalidateQueries({ queryKey: ["customer-bookings"] }),
        queryClient.invalidateQueries({ queryKey: ["booking"] }),
        queryClient.invalidateQueries({ queryKey: PAYMENTS_QUERY_KEY }),
      ]),
    [queryClient],
  );

  const pay = useCallback(
    async (bookingId: string): Promise<void> => {
      if (inFlight.current) return; // double click / second card while one payment is open
      inFlight.current = true;
      setState({ bookingId, phase: "pending" });
      try {
        const loaded = await loadRazorpayScript();
        const Razorpay = window.Razorpay;
        if (!loaded || !Razorpay) {
          setState({ bookingId, phase: "failed", message: "Couldn't open the payment window. Check your connection and try again." });
          return;
        }
        const order = await paymentApi.createOrder(bookingId);

        await new Promise<void>((resolve) => {
          let finished = false;
          const finish = (next: PayBookingState) => {
            if (finished) return;
            finished = true;
            setState(next);
            resolve();
          };

          const rzp = new Razorpay({
            key: order.keyId,
            amount: order.amount,
            currency: order.currency,
            name: "HomeCareX",
            description: "Booking payment",
            order_id: order.orderId,
            prefill: order.prefill,
            theme: { color: "#4f46e5" },
            handler: (response: RazorpaySuccess) => {
              finished = true; // Razorpay may fire dismiss while closing after a success: ignore it
              setState({ bookingId, phase: "processing" });
              void paymentApi
                .verify(bookingId, response)
                .then(() => setState({ bookingId, phase: "successful", message: "Payment received. Your booking is now paid." }))
                .catch((err: unknown) =>
                  setState({
                    bookingId,
                    phase: "failed",
                    message: messageOf(err, "We couldn't confirm your payment yet. If money was deducted, your booking will update shortly."),
                  }),
                )
                .finally(() => {
                  void refresh();
                  resolve();
                });
            },
            modal: {
              ondismiss: () => {
                if (finished) return;
                void paymentApi.recordAttempt(bookingId, "CANCELLED", order.orderId, "Customer closed the checkout");
                finish({ bookingId, phase: "cancelled" });
              },
            },
          });

          rzp.on("payment.failed", (response: RazorpayFailure) => {
            if (finished) return;
            const reason = response.error?.description ?? "The payment could not be completed.";
            void paymentApi.recordAttempt(bookingId, "FAILED", order.orderId, reason).then(() => refresh()); // server now flags the booking as failed
            finish({ bookingId, phase: "failed", message: reason });
            rzp.close();
          });

          rzp.open();
        });
      } catch (err) {
        setState({ bookingId, phase: "failed", message: messageOf(err, "Something went wrong. Please try again.") });
      } finally {
        inFlight.current = false;
      }
    },
    [refresh],
  );

  const reset = useCallback(() => {
    if (!inFlight.current) setState(IDLE);
  }, []);

  return { state, pay, reset, busy: state.phase === "pending" || state.phase === "processing" };
}