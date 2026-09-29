import { Schema, model, type InferSchemaType } from 'mongoose';
import { ACTOR_ROLES, BOOKING_STATUSES } from '../modules/bookings/bookings.constants';

/** Money fields are INR, rounded to 2 decimals. */
const PriceBreakdownSchema = new Schema(
  {
    base: { type: Number, default: 0 },
    addOns: { type: Number, default: 0 },
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

const BookingSchema = new Schema(
  {
    customerId: { type: Schema.Types.ObjectId, ref: 'User', required: true, index: true },
    /** Partner._id (not the User id). Null until a partner accepts. */
    partnerId: { type: Schema.Types.ObjectId, ref: 'Partner', default: null, index: true },
    categoryId: { type: Schema.Types.ObjectId, ref: 'Category', required: true },
    /** Snapshots so lists/dashboards don't need joins and stay correct if the catalog changes. */
    serviceName: { type: String, required: true },
    customerName: { type: String, required: true },
    status: { type: String, enum: BOOKING_STATUSES, default: 'created', index: true },
    statusHistory: { type: [StatusHistorySchema], default: [] },
    scheduledAt: { type: Date, required: true, index: true },
    address: {
      line1: { type: String, required: true },
      area: { type: String },
      city: { type: String, required: true },
      pincode: { type: String },
      location: {
        type: { type: String, enum: ['Point'] },
        coordinates: { type: [Number] }, // [lng, lat]
      },
    },
    priceBreakdown: { type: PriceBreakdownSchema, default: () => ({}) },
    /** Partner's share after commission. Used for earnings totals. */
    partnerEarning: { type: Number, default: 0, min: 0 },
    offers: { type: [OfferSchema], default: [] },
    /** Start/end verification codes; never returned to clients by default. */
    otpCodes: {
      start: { type: String, select: false },
      end: { type: String, select: false },
    },
    startedAt: { type: Date },
    completedAt: { type: Date, index: true },
  },
  { timestamps: true },
);

BookingSchema.index({ partnerId: 1, scheduledAt: 1 });
BookingSchema.index({ 'offers.partnerId': 1, status: 1 });

export type Booking = InferSchemaType<typeof BookingSchema>;
export const BookingModel = model('Booking', BookingSchema);
export default BookingModel;