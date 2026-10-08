import { Schema, model, models, type Document, type Model, Types } from 'mongoose';

export const REFUND_REQUEST_STATUSES = [
  'requested',
  'approved',
  'processed',
  'rejected',
] as const;

export type RefundRequestStatus = (typeof REFUND_REQUEST_STATUSES)[number];

export const REFUND_METHODS = ['RAZORPAY', 'WALLET'] as const;

export type RefundMethod = (typeof REFUND_METHODS)[number];

export interface IRefund extends Document {
  paymentId: Types.ObjectId;
  bookingId: Types.ObjectId;
  customerId: Types.ObjectId;

  amount: number;
  currency: string;
  reason: string;
  method: RefundMethod;

  status: RefundRequestStatus;

  razorpayRefundId?: string;

  requestedBy?: Types.ObjectId;
  approvedBy?: Types.ObjectId;
  rejectedBy?: Types.ObjectId;

  requestedAt: Date;
  approvedAt?: Date;
  processedAt?: Date;
  rejectedAt?: Date;

  rejectionReason?: string;

  createdAt: Date;
  updatedAt: Date;
}

const RefundSchema = new Schema<IRefund>(
  {
    paymentId: {
      type: Schema.Types.ObjectId,
      ref: 'Payment',
      required: true,
      index: true,
    },

    bookingId: {
      type: Schema.Types.ObjectId,
      ref: 'Booking',
      required: true,
      index: true,
    },

    customerId: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      index: true,
    },

    amount: {
      type: Number,
      required: true,
      min: 0.01,
    },

    currency: {
      type: String,
      default: 'INR',
      required: true,
      uppercase: true,
    },

    reason: {
      type: String,
      required: true,
      trim: true,
      maxlength: 500,
    },

    method: {
      type: String,
      enum: REFUND_METHODS,
      default: 'RAZORPAY',
      required: true,
    },

    status: {
      type: String,
      enum: REFUND_REQUEST_STATUSES,
      default: 'requested',
      required: true,
      index: true,
    },

    razorpayRefundId: {
      type: String,
      index: true,
      sparse: true,
    },

    requestedBy: {
      type: Schema.Types.ObjectId,
      ref: 'User',
    },

    approvedBy: {
      type: Schema.Types.ObjectId,
      ref: 'User',
    },

    rejectedBy: {
      type: Schema.Types.ObjectId,
      ref: 'User',
    },

    requestedAt: {
      type: Date,
      default: Date.now,
      required: true,
    },

    approvedAt: Date,

    processedAt: Date,

    rejectedAt: Date,

    rejectionReason: {
      type: String,
      trim: true,
      maxlength: 500,
    },
  },
  {
    timestamps: true,
    versionKey: false,
  },
);

RefundSchema.index({ status: 1, createdAt: -1 });
RefundSchema.index({ customerId: 1, createdAt: -1 });
RefundSchema.index({ bookingId: 1, createdAt: -1 });

export const RefundModel: Model<IRefund> =
  (models.Refund as Model<IRefund>) ||
  model<IRefund>('Refund', RefundSchema);
  