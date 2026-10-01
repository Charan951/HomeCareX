import { Schema, model, type InferSchemaType } from 'mongoose';

/** A bookable service in the catalog (e.g. "Deep Home Cleaning"). Prices are INR. */
const ServiceSchema = new Schema(
  {
    name: { type: String, required: true, trim: true },
    slug: { type: String, required: true, unique: true, lowercase: true, trim: true },
    categoryId: { type: Schema.Types.ObjectId, ref: 'Category', required: true, index: true },
    description: { type: String, trim: true },
    icon: { type: String },
    basePrice: { type: Number, required: true, min: 0 },
    durationMinutes: { type: Number, required: true, min: 15 },
    /** Denormalised from reviews so listings need no join. */
    ratingAvg: { type: Number, default: 0, min: 0, max: 5 },
    ratingCount: { type: Number, default: 0, min: 0 },
    /** Used to rank "Recommended for you". */
    bookingsCount: { type: Number, default: 0, min: 0 },
    isActive: { type: Boolean, default: true },
  },
  { timestamps: true },
);

ServiceSchema.index({ isActive: 1, bookingsCount: -1, ratingAvg: -1 });

export type Service = InferSchemaType<typeof ServiceSchema>;
export const ServiceModel = model('Service', ServiceSchema);
export default ServiceModel;
