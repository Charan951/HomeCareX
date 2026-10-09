import { BOOKING_STATUS, PAYMENT_STATUS, type BookingView } from "@/types/booking";

/** Router state handed to the "booked" page when the customer chose to pay online but nothing was charged. */
export interface BookedPageState {
  onlineNotCharged?: boolean;
}

/**
 * Where to send the customer right after POST /bookings, or null when the booking still has to be paid
 * (PENDING_PAYMENT: carry on to the payment gateway).
 *
 * The server only holds a booking for payment when BOOKING_REQUIRE_PAYMENT=true. Otherwise (or when this is a
 * replay of a booking that is already settled) it comes back CONFIRMED, and asking for a payment order would fail
 * with BOOKING_NOT_PAYABLE even though the booking itself is fine.
 *
 * `onlineNotCharged` is set when the customer picked an online method but the booking is confirmed and unpaid, so
 * the next page says plainly that no money was taken instead of pretending the card was used.
 */
export function settledBookingDestination(
  booking: Pick<BookingView, "_id" | "status" | "paymentStatus">,
  method: string,
): { path: string; state?: BookedPageState } | null {
  if (booking.status === BOOKING_STATUS.PENDING_PAYMENT) return null;
  const paid = booking.paymentStatus === PAYMENT_STATUS.PAID;
  return {
    path: `/booking/${paid ? "success" : "booked"}/${booking._id}`,
    ...(!paid && method !== "cod" ? { state: { onlineNotCharged: true } } : {}),
  };
}
