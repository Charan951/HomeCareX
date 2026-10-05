import { Schema, model, type InferSchemaType, Types } from 'mongoose';

const ReviewSchema = new Schema(
  {
    customerId: { type: Schema.Types.ObjectId, ref: 'User', required: true, index: true },
    customerName: { type: String, required: true, trim: true, maxlength: 100 },
    customerEmail: { type: String, required: true, trim: true, lowercase: true, maxlength: 254 },
    rating: { type: Number, required: true, min: 1, max: 5 },
    message: { type: String, required: true, trim: true, minlength: 20, maxlength: 2000 },
    status: { type: String, required: true, enum: ['pending', 'approved', 'rejected'], default: 'pending', index: true },
  },
  { timestamps: true },
);

ReviewSchema.index({ createdAt: -1 });

export type Review = InferSchemaType<typeof ReviewSchema> & { _id: Types.ObjectId };
export const ReviewModel = model('Review', ReviewSchema);
export default ReviewModel;
