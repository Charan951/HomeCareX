import { Schema, model, models, type Document, type Model } from 'mongoose';

/**
 * One row per Razorpay webhook event we have accepted. The unique `eventId` is the idempotency
 * guard: inserting a duplicate fails with E11000, so a replayed delivery is acknowledged and
 * skipped without touching bookings or payments a second time.
 */
export interface IPaymentEvent extends Document {
  eventId: string;
  event: string;
  razorpayOrderId?: string;
  razorpayPaymentId?: string;
  createdAt: Date;
}

const PaymentEventSchema = new Schema<IPaymentEvent>(
  {
    eventId: { type: String, required: true, unique: true, trim: true },
    event: { type: String, required: true, trim: true },
    razorpayOrderId: { type: String, trim: true },
    razorpayPaymentId: { type: String, trim: true },
  },
  { timestamps: { createdAt: true, updatedAt: false } },
);

export const PaymentEventModel: Model<IPaymentEvent> =
  (models.PaymentEvent as Model<IPaymentEvent>) || model<IPaymentEvent>('PaymentEvent', PaymentEventSchema);
export default PaymentEventModel;
