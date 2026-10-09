import type { BookingView } from "./booking";

/**
 * The customer-facing shape of ONE booking (GET /bookings/:id).
 * Mirrors what `buildDetailView` returns on the backend: the booking itself plus the flattened
 * partner, the catalog service, extra charges and (only while the partner has arrived) the start OTP.
 */

/** "approve" / "reject" - the body of POST /bookings/:id/extra-charges/:chargeId/decision. */
export type ExtraChargeDecision = "approve" | "reject";

export type ExtraChargeStatus = "pending" | "approved" | "rejected";

export interface ExtraCharge {
  _id: string;
  title: string;
  reason?: string;
  amount: number;
  status: ExtraChargeStatus;
  requestedAt?: string;
  decidedAt?: string;
}

/** The assigned partner as a customer may see them. `phone` only while the job is active. */
export interface BookingDetailPartner {
  name?: string;
  phone?: string;
  city?: string;
  rating?: number;
  ratingCount?: number;
  verified?: boolean;
}

/** Catalog details of the booked service. */
export interface BookingDetailService {
  name?: string;
  description?: string;
  image?: string;
  durationMinutes?: number;
  categoryName?: string;
}

export interface BookingDetailPayment {
  orderId?: string;
  paymentId?: string;
  status?: string;
  paidAt?: string;
  /** From the latest Payment record. */
  method?: string;
  transactionId?: string;
}

export interface BookingDetailView extends Omit<
  BookingView,
  "paymentDetails" | "otp"
> {
  /** Human-friendly reference when the server has one; the page falls back to the id. */
  bookingNumber?: string;
  serviceName?: string;
  cancellationReason?: string;

  /** Only set while the partner has arrived; otherwise null. */
  startOtp: string | null;

  /** null until a partner accepts. */
  partner: BookingDetailPartner | null;
  service: BookingDetailService | null;
  paymentDetails?: BookingDetailPayment;

  extraCharges: ExtraCharge[];
  /** Sum of the approved extra charges, added to the snapshot total. */
  extraChargesApprovedTotal: number;
}
