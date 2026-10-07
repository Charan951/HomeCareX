import { Schema, model } from 'mongoose';

export const COUPON_TYPES = ['PERCENT', 'FLAT'] as const;
export type CouponType = (typeof COUPON_TYPES)[number];

const CouponSchema = new Schema(
  {
    code: {
      type: String,
      required: true,
      unique: true,
      uppercase: true,
      trim: true,
      minlength: 3,
      maxlength: 30,
      index: true,
    },

    type: {
      type: String,
      enum: COUPON_TYPES,
      required: true,
    },

    value: {
      type: Number,
      required: true,
      min: 0,
    },

    maxDiscount: {
      type: Number,
      min: 0,
      default: null,
    },

    minOrder: {
      type: Number,
      min: 0,
      default: 0,
    },

    startAt: {
      type: Date,
      required: true,
    },

    endAt: {
      type: Date,
      required: true,
    },

    totalLimit: {
      type: Number,
      min: 0,
      default: null,
    },

    perUserLimit: {
      type: Number,
      min: 0,
      default: null,
    },

    usedCount: {
      type: Number,
      min: 0,
      default: 0,
    },

    categoryIds: {
      type: [Schema.Types.ObjectId],
      ref: 'Category',
      default: [],
    },

    active: {
      type: Boolean,
      default: true,
      index: true,
    },
  },
  {
    timestamps: true,
  },
);

CouponSchema.index({ code: 1 }, { unique: true });
CouponSchema.index({ active: 1, startAt: 1, endAt: 1 });

export const CouponModel = model('Coupon', CouponSchema);

export default CouponModel;