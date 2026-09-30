import { Schema, model } from 'mongoose';

export const PAYMENT_STATUSES = ['created', 'paid', 'failed', 'refunded'] as const;
export const REFUND_STATUSES = ['none', 'requested', 'approved', 'processed', 'rejected'] as const;

/** Minimal shape needed by dashboards. Refund queue = refund.status 'requested' or 'approved'. */
const PaymentSchema = new Schema(
  {
    bookingId: { type: Schema.Types.ObjectId, ref: 'Booking', index: true },
    customerId: { type: Schema.Types.ObjectId, ref: 'User', index: true },
    amount: { type: Number, required: true, min: 0 },
    status: { type: String, enum: PAYMENT_STATUSES, default: 'created', index: true },
    refund: {
      status: { type: String, enum: REFUND_STATUSES, default: 'none' },
      amount: { type: Number, min: 0 },
      requestedAt: { type: Date },
    },
  },
  { timestamps: true },
);

PaymentSchema.index({ 'refund.status': 1 });

export const PaymentModel = model('Payment', PaymentSchema);
export default PaymentModel;
