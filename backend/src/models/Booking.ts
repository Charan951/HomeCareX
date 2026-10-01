import { Schema, model, models, type Document, type Model, Types } from 'mongoose';

export const BOOKING_STATUS = {
  PENDING: 'PENDING',
  PENDING_PAYMENT: 'PENDING_PAYMENT',
  CONFIRMED: 'CONFIRMED',
  ASSIGNED: 'ASSIGNED',
  IN_PROGRESS: 'IN_PROGRESS',
  COMPLETED: 'COMPLETED',
  CANCELLED: 'CANCELLED',
  PAYMENT_FAILED: 'PAYMENT_FAILED',
} as const;
export type BookingStatus = (typeof BOOKING_STATUS)[keyof typeof BOOKING_STATUS];

export const BOOKING_PAYMENT_STATUS = {
  PENDING: 'PENDING',
  PAID: 'PAID',
  FAILED: 'FAILED',
  REFUNDED: 'REFUNDED',
} as const;
export type BookingPaymentStatus = (typeof BOOKING_PAYMENT_STATUS)[keyof typeof BOOKING_PAYMENT_STATUS];

export interface IBooking extends Document {
  customerId: Types.ObjectId;
  serviceId: Types.ObjectId;
  quantity: number;
  addOns: Array<{ addOnId: Types.ObjectId; quantity: number }>;
  addressSnapshot: {
    line1: string;
    line2?: string;
    city: string;
    state: string;
    pincode: string;
    location?: { lat: number; lng: number };
    sourceAddressId?: Types.ObjectId;
  };
  date: string;
  slot: string;
  priceSnapshot: {
    currency: string;
    lines: Array<{
      kind: 'BASE' | 'ADDON';
      refId: Types.ObjectId;
      name: string;
      unitPrice: number;
      quantity: number;
      amount: number;
    }>;
    subtotal: number;
    discount: number;
    convenienceFee: number;
    total: number;
    computedAt: Date;
  };
  status: BookingStatus;
  paymentStatus: BookingPaymentStatus;
  paymentDetails?: {
    orderId?: string;
    paymentId?: string;
    signature?: string;
    status?: string;
    paidAt?: Date;
  };
  cancellationReason?: string;
  history: Array<{
    from: string | null;
    to: string;
    at: Date;
    actorId?: Types.ObjectId;
    actorRole: string;
    note?: string;
  }>;
  slotSeat: number;
  idempotencyKey?: string;
  requestHash?: string;
  holdExpiresAt?: Date;
  partnerId?: Types.ObjectId;
  createdAt: Date;
  updatedAt: Date;
}

const bookingSchema = new Schema<IBooking>(
  {
    customerId: { type: Schema.Types.ObjectId, ref: 'User', required: true, index: true },
    serviceId: { type: Schema.Types.ObjectId, required: true },
    quantity: { type: Number, required: true, default: 1 },
    addOns: [
      {
        addOnId: { type: Schema.Types.ObjectId, required: true },
        quantity: { type: Number, required: true, default: 1 },
      },
    ],
    addressSnapshot: { type: Schema.Types.Mixed, required: true },
    date: { type: String, required: true, index: true },
    slot: { type: String, required: true, index: true },
    priceSnapshot: { type: Schema.Types.Mixed, required: true },
    status: {
      type: String,
      enum: Object.values(BOOKING_STATUS),
      default: BOOKING_STATUS.PENDING_PAYMENT,
      required: true,
      index: true,
    },
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
    history: [
      {
        from: { type: String, default: null },
        to: { type: String, required: true },
        at: { type: Date, default: Date.now },
        actorId: { type: Schema.Types.ObjectId },
        actorRole: { type: String, required: true },
        note: { type: String },
      },
    ],
    slotSeat: { type: Number, required: true },
    idempotencyKey: { type: String, index: true },
    requestHash: { type: String },
    holdExpiresAt: { type: Date },
    partnerId: { type: Schema.Types.ObjectId, ref: 'Partner' },
  },
  { timestamps: true }
);

bookingSchema.index(
  { customerId: 1, idempotencyKey: 1 },
  { unique: true, sparse: true, name: 'uniq_customer_idem_key' }
);

// Only lock the slot seat if the booking has not been cancelled or failed
bookingSchema.index(
  { serviceId: 1, date: 1, slot: 1, slotSeat: 1 },
  {
    unique: true,
    name: 'uniq_active_slot_seat',
    partialFilterExpression: {
      status: { $nin: [BOOKING_STATUS.CANCELLED, BOOKING_STATUS.PAYMENT_FAILED] },
    },
  }
);

// Export both `Booking` and `BookingModel` to prevent undefined import errors across all modules
export const Booking: Model<IBooking> =
  (models.Booking as Model<IBooking>) ||
  model<IBooking>('Booking', bookingSchema);
export const BookingModel = Booking;
export default Booking;