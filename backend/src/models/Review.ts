import { Schema, model, type InferSchemaType, Types } from 'mongoose';

const ReviewSchema = new Schema(
  {
    customerId: { type: Schema.Types.ObjectId, ref: 'User', required: true, index: true },
    customerName: { type: String, required: true, trim: true, maxlength: 100 },
    customerEmail: { type: String, required: true, trim: true, lowercase: true, maxlength: 254 },
    rating: { type: Number, required: true, min: 1, max: 5 },
    message: { type: String, required: true, trim: true, minlength: 20, maxlength: 2000 },
    status: { type: String, required: true, enum: ['pending', 'approved', 'rejected'], default: 'pending', index: true },
    /**
     * Service details page (n04). Both links are optional so the existing site-wide testimonials
     * (no service) keep working. A review is "visible" on a service page when it is approved and
     * its serviceId matches.
     */
    serviceId: { type: Schema.Types.ObjectId, ref: 'Service' },
    bookingId: { type: Schema.Types.ObjectId, ref: 'Booking' },
    /** Set by the server only: true when the review comes from a completed booking of this service. */
    verified: { type: Boolean, default: false },
  },
  { timestamps: true },
);

ReviewSchema.index({ createdAt: -1 });
/** Powers GET /services/:id/reviews (visible reviews of one service, newest first) and its star distribution. */
ReviewSchema.index({ serviceId: 1, status: 1, createdAt: -1 });
/** One review per booking. Partial, so reviews without a booking are never constrained. */
ReviewSchema.index({ bookingId: 1 }, { unique: true, partialFilterExpression: { bookingId: { $type: 'objectId' } } });

export type Review = InferSchemaType<typeof ReviewSchema> & { _id: Types.ObjectId };
export const ReviewModel = model('Review', ReviewSchema);
export default ReviewModel;
