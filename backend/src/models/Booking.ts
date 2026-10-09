import { Schema, model, type Document, Types } from 'mongoose';
import { ACTOR_ROLES, BOOKING_STATUSES, type ActorRole, type BookingStatus } from '../modules/bookings/bookings.constants';

/**
 * One Booking document serves every surface:
 * - Customer booking (R01-R05): serviceId/date/slot/slotSeat, addressSnapshot, priceSnapshot, idempotency.
 * - Partner jobs + dashboard (P02-P05): scheduledAt, address, offers, partnerEarning, otpCodes.
 * The customer create path fills both groups (scheduledAt/address/priceBreakdown are derived from the snapshots).
 */

export const BOOKING_PAYMENT_STATUS = {
  PENDING: 'PENDING',
  PAID: 'PAID',
  FAILED: 'FAILED',
  REFUNDED: 'REFUNDED',
} as const;
export type BookingPaymentStatus = (typeof BOOKING_PAYMENT_STATUS)[keyof typeof BOOKING_PAYMENT_STATUS];

export interface StatusHistoryItem {
  from: BookingStatus | null;
  to: BookingStatus;
  at: Date;
  actorId?: string;
  actorRole: ActorRole;
  reason?: string;
}

export interface IBooking extends Document {
  customerId: Types.ObjectId;
  /** Partner._id (not the User id). Null until a partner accepts. */
  partnerId?: Types.ObjectId | null;
  categoryId?: Types.ObjectId;
  serviceId?: Types.ObjectId;
  serviceName: string;
  customerName?: string;
  quantity: number;
  addOns: Array<{ addOnId: Types.ObjectId; quantity: number }>;
  addressSnapshot?: {
    line1: string;
    line2?: string;
    city: string;
    state: string;
    pincode: string;
    location?: { lat: number; lng: number };
    sourceAddressId?: Types.ObjectId;
  };
  address: {
    line1: string;
    area?: string;
    city: string;
    pincode?: string;
    location?: { type: 'Point'; coordinates: number[] };
  };
  /** Customer slot: "YYYY-MM-DD" + "HH:mm-HH:mm" in Asia/Kolkata. scheduledAt is the slot start as a Date. */
  date?: string;
  slot?: string;
  scheduledAt: Date;
  priceSnapshot?: {
    currency: string;
    lines: Array<{ kind: 'BASE' | 'ADDON'; refId: Types.ObjectId; name: string; unitPrice: number; quantity: number; amount: number }>;
    subtotal: number;
    discount: number;
    convenienceFee: number;
    total: number;
    computedAt: Date;
  };
  priceBreakdown: { base: number; addOns: number; surge?: number; discount: number; convenienceFee: number; tax: number; total: number };
  partnerEarning: number;
  status: BookingStatus;
  statusHistory: StatusHistoryItem[];
  paymentStatus: BookingPaymentStatus;
  /** Razorpay order/payment refs for the customer checkout; signature is never sent to clients. */
  paymentDetails?: { orderId?: string; paymentId?: string; signature?: string; status?: string; paidAt?: Date };
  cancellationReason?: string;
  offers: Array<{ partnerId: Types.ObjectId; offeredAt: Date; expiresAt: Date; response: 'pending' | 'accepted' | 'rejected' | 'expired' }>;
  otpCodes?: { start?: string; end?: string };
  slotSeat?: number;
  idempotencyKey?: string;
  requestHash?: string;
  holdExpiresAt?: Date;
  startedAt?: Date;
  completedAt?: Date;
  createdAt: Date;
  updatedAt: Date;
}

/** Money fields are INR, rounded to 2 decimals. */
const PriceBreakdownSchema = new Schema(
  {
    base: { type: Number, default: 0 },
    addOns: { type: Number, default: 0 },
    surge: { type: Number, default: 0 },
    discount: { type: Number, default: 0 },
    convenienceFee: { type: Number, default: 0 },
    tax: { type: Number, default: 0 },
    total: { type: Number, default: 0 },
  },
  { _id: false },
);

/** A job offer sent to one partner while the booking is searching_for_partner. */
const OfferSchema = new Schema(
  {
    partnerId: { type: Schema.Types.ObjectId, ref: 'Partner', required: true },
    offeredAt: { type: Date, default: Date.now },
    expiresAt: { type: Date, required: true },
    response: { type: String, enum: ['pending', 'accepted', 'rejected', 'expired'], default: 'pending' },
  },
  { _id: false },
);

const StatusHistorySchema = new Schema(
  {
    from: { type: String, enum: [...BOOKING_STATUSES, null], default: null },
    to: { type: String, enum: BOOKING_STATUSES, required: true },
    at: { type: Date, default: Date.now },
    actorId: { type: String },
    actorRole: { type: String, enum: ACTOR_ROLES, required: true },
    reason: { type: String },
  },
  { _id: false },
);

const BookingSchema = new Schema<IBooking>(
  {
    customerId: { type: Schema.Types.ObjectId, ref: 'User', required: true, index: true },
    partnerId: { type: Schema.Types.ObjectId, ref: 'Partner', default: null, index: true },
    categoryId: { type: Schema.Types.ObjectId, ref: 'Category' },
    serviceId: { type: Schema.Types.ObjectId },
    /** Snapshots so lists/dashboards don't need joins and stay correct if the catalog changes. */
    serviceName: { type: String, required: true },
    customerName: { type: String },
    quantity: { type: Number, default: 1 },
    addOns: [
      {
        addOnId: { type: Schema.Types.ObjectId, required: true },
        quantity: { type: Number, required: true, default: 1 },
        _id: false,
      },
    ],
    addressSnapshot: { type: Schema.Types.Mixed },
    address: {
      line1: { type: String, required: true },
      area: { type: String },
      city: { type: String, required: true },
      pincode: { type: String },
      location: {
        type: { type: String, enum: ['Point'] },
        coordinates: { type: [Number], default: undefined }, // [lng, lat]
      },
    },
    date: { type: String, index: true },
    slot: { type: String, index: true },
    scheduledAt: { type: Date, required: true, index: true },
    priceSnapshot: { type: Schema.Types.Mixed },
    priceBreakdown: { type: PriceBreakdownSchema, default: () => ({}) },
    /** Partner's share after commission. Used for earnings totals. */
    partnerEarning: { type: Number, default: 0, min: 0 },
    status: { type: String, enum: BOOKING_STATUSES, default: 'created', index: true },
    statusHistory: { type: [StatusHistorySchema], default: [] },
    paymentStatus: {
      type: String,
      enum: Object.values(BOOKING_PAYMENT_STATUS),
      default: BOOKING_PAYMENT_STATUS.PENDING,
      index: true,
    },
    paymentDetails: {
      orderId: { type: String, trim: true },
      paymentId: { type: String, trim: true },
      signature: { type: String, trim: true },
      status: { type: String, trim: true },
      paidAt: { type: Date },
    },
    cancellationReason: { type: String, trim: true },
    offers: { type: [OfferSchema], default: [] },
    /** Start/end verification codes; never returned to clients by default. */
    otpCodes: {
      start: { type: String, select: false },
      end: { type: String, select: false },
    },
    /** Seat number within (serviceId, date, slot); unset when the booking stops holding the slot. */
    slotSeat: { type: Number },
    idempotencyKey: { type: String },
    requestHash: { type: String },
    holdExpiresAt: { type: Date },
    startedAt: { type: Date },
    completedAt: { type: Date, index: true },
  },
  { timestamps: true },
);

// Partial (not sparse): only bookings that carry these fields take part in the uniqueness checks,
// so partner-side bookings without a slot seat / idempotency key never collide on nulls.
BookingSchema.index(
  { customerId: 1, idempotencyKey: 1 },
  { unique: true, name: 'uniq_customer_idem_key', partialFilterExpression: { idempotencyKey: { $exists: true } } },
);
BookingSchema.index(
  { serviceId: 1, date: 1, slot: 1, slotSeat: 1 },
  { unique: true, name: 'uniq_active_slot_seat', partialFilterExpression: { slotSeat: { $exists: true } } },
);
/** Customer list screen: scoped by customer, filtered by status, newest first. */
BookingSchema.index({ customerId: 1, status: 1, createdAt: -1 });
BookingSchema.index({ partnerId: 1, scheduledAt: 1 });
BookingSchema.index({ 'offers.partnerId': 1, status: 1 });

export type Booking = IBooking;
export const BookingModel = model<IBooking>('Booking', BookingSchema);
export default BookingModel;