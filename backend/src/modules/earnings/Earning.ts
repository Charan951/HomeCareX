import { Schema, model, type InferSchemaType } from 'mongoose';
import { EARNING_STATUSES } from './earnings.constants';

const EarningSchema = new Schema(
  {
    /** Partner._id (matches Booking.partnerId). */
    partnerId: { type: Schema.Types.ObjectId, ref: 'Partner', required: true },
    /** Unique: one earning per booking. This index is what makes the job.completed listener idempotent. */
    bookingId: { type: Schema.Types.ObjectId, ref: 'Booking', required: true, unique: true },
    gross: { type: Number, required: true, min: 0 },
    commissionRate: { type: Number, required: true, min: 0, max: 1 },
    commission: { type: Number, required: true, min: 0 },
    net: { type: Number, required: true, min: 0 },
    status: { type: String, enum: EARNING_STATUSES, default: 'pending' },
    earnedAt: { type: Date, required: true },
    settledAt: { type: Date, default: null },
  },
  { timestamps: true },
);

EarningSchema.index({ partnerId: 1, earnedAt: -1 });
EarningSchema.index({ partnerId: 1, status: 1 });

export type Earning = InferSchemaType<typeof EarningSchema>;
export const EarningModel = model('Earning', EarningSchema);
export default EarningModel;