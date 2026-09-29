import { Schema, model, Types, type InferRawDocType } from 'mongoose';
import {
  ACTOR_ROLES,
  BOOKING_STATUS,
  BOOKING_STATUS_VALUES,
  SLOT_HOLDING_STATUSES,
} from '../modules/bookings/bookings.constants';

const AddressSnapshotSchema = new Schema(
  {
    label: String,
    contactName: String,
    contactPhone: String,
    line1: { type: String, required: true },
    line2: String,
    landmark: String,
    city: { type: String, required: true },
    state: { type: String, required: true },
    pincode: { type: String, required: true },
    location: { lat: { type: Number, required: true }, lng: { type: Number, required: true } },
    sourceAddressId: Types.ObjectId,
  },
  { _id: false },
);

const PriceLineSchema = new Schema(
  {
    kind: { type: String, enum: ['BASE', 'ADDON'], required: true },
    refId: { type: Schema.Types.ObjectId, required: true },
    name: { type: String, required: true },
    unitPrice: { type: Number, required: true, min: 0 },
    quantity: { type: Number, required: true, min: 1 },
    amount: { type: Number, required: true, min: 0 },
  },
  { _id: false },
);

const PriceSnapshotSchema = new Schema(
  {
    currency: { type: String, enum: ['INR'], default: 'INR' },
    lines: { type: [PriceLineSchema], required: true },
    subtotal: { type: Number, required: true, min: 0 },
    discount: { type: Number, default: 0, min: 0 },
    couponCode: String,
    convenienceFee: { type: Number, default: 0, min: 0 },
    total: { type: Number, required: true, min: 0 },
    computedAt: { type: Date, required: true },
  },
  { _id: false },
);

const HistorySchema = new Schema(
  {
    from: { type: String, enum: [...BOOKING_STATUS_VALUES, null], default: null },
    to: { type: String, enum: BOOKING_STATUS_VALUES, required: true },
    at: { type: Date, default: Date.now },
    actorId: Schema.Types.ObjectId,
    actorRole: { type: String, enum: ACTOR_ROLES, required: true },
    note: String,
  },
  { _id: false },
);

const BookingSchema = new Schema(
  {
    customerId: { type: Schema.Types.ObjectId, ref: 'User', required: true, index: true },
    serviceId: { type: Schema.Types.ObjectId, ref: 'Category', required: true },
    quantity: { type: Number, required: true, min: 1 },
    addOns: {
      type: [
        new Schema(
          { addOnId: { type: Schema.Types.ObjectId, required: true }, quantity: { type: Number, required: true, min: 1 } },
          { _id: false },
        ),
      ],
      default: [],
    },
    addressSnapshot: { type: AddressSnapshotSchema, required: true },
    date: { type: String, required: true, match: /^\d{4}-\d{2}-\d{2}$/ },
    slot: { type: String, required: true, match: /^\d{2}:\d{2}-\d{2}:\d{2}$/ },
    priceSnapshot: { type: PriceSnapshotSchema, required: true },
    status: { type: String, enum: BOOKING_STATUS_VALUES, default: BOOKING_STATUS.PENDING_PAYMENT, required: true },
    partnerId: { type: Schema.Types.ObjectId, ref: 'Partner', index: true },
    // Hidden by default. Customer view adds it explicitly; partner/list queries never select it.
    otp: {
      type: new Schema({ code: String, verifiedAt: Date }, { _id: false }),
      select: false,
    },
    history: { type: [HistorySchema], default: [] },

    // ---- server-internal ----
    slotSeat: { type: Number, required: true, min: 1 },
    idempotencyKey: { type: String, required: true },
    requestHash: { type: String, required: true },
    holdExpiresAt: Date,
  },
  { timestamps: true },
);

/**
 * FINAL safety net against double-booking (Redis lock is the fast path).
 * One ACTIVE booking per (service, date, slot, seat). Seats = slot capacity.
 * Releasing a seat = moving status out of SLOT_HOLDING_STATUSES.
 */
BookingSchema.index(
  { serviceId: 1, date: 1, slot: 1, slotSeat: 1 },
  {
    unique: true,
    partialFilterExpression: { status: { $in: SLOT_HOLDING_STATUSES } },
    name: 'uniq_active_slot_seat',
  },
);

/** Idempotency: same customer + same key = same booking. */
BookingSchema.index({ customerId: 1, idempotencyKey: 1 }, { unique: true, name: 'uniq_customer_idem_key' });

/** For the hold-expiry sweeper job. */
BookingSchema.index(
  { holdExpiresAt: 1 },
  { partialFilterExpression: { status: BOOKING_STATUS.PENDING_PAYMENT }, name: 'idx_pending_hold_expiry' },
);

BookingSchema.index({ status: 1, date: 1 });

export type IBooking = InferRawDocType<(typeof BookingSchema)['obj']>;
export const BookingModel = model('Booking', BookingSchema);
export default BookingModel;