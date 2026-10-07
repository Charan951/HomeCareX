import { Schema, model, type InferSchemaType } from 'mongoose';

export const OTP_PURPOSES = ['PASSWORD_RESET'] as const;
export type OtpPurpose = (typeof OTP_PURPOSES)[number];

const OtpSchema = new Schema(
  {
    userId: { type: Schema.Types.ObjectId, ref: 'User', index: true },
    identifier: { type: String, required: true, lowercase: true, trim: true, index: true },
    hashedCode: { type: String, required: true, select: false },
    purpose: { type: String, enum: OTP_PURPOSES, default: 'PASSWORD_RESET', required: true },
    expiresAt: { type: Date, required: true, index: true },
    attempts: { type: Number, default: 0 },
    usedAt: { type: Date },
  },
  { timestamps: true }
);

OtpSchema.index({ identifier: 1, purpose: 1, createdAt: -1 });

export type Otp = InferSchemaType<typeof OtpSchema>;
export const OtpModel = model('Otp', OtpSchema);
export default OtpModel;
