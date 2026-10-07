import { Schema, model } from 'mongoose';

const CouponUsageSchema = new Schema(
  {
    couponId: {
      type: Schema.Types.ObjectId,
      ref: 'Coupon',
      required: true,
      index: true,
    },

    userId: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      index: true,
    },

    bookingId: {
      type: Schema.Types.ObjectId,
      ref: 'Booking',
      default: null,
    },

    usedAt: {
      type: Date,
      default: Date.now,
    },
  },
  {
    timestamps: true,
  },
);

CouponUsageSchema.index({ couponId: 1, userId: 1 });

export const CouponUsageModel = model('CouponUsage', CouponUsageSchema);

export default CouponUsageModel;