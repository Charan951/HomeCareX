import { Schema, model, type InferSchemaType } from 'mongoose';

/** How soon a partner can usually be there. Drives the catalog's availability filter. */
export const SERVICE_AVAILABILITY = ['today', 'tomorrow', 'scheduled'] as const;
export type ServiceAvailability = (typeof SERVICE_AVAILABILITY)[number];

const AddOnSchema = new Schema(
  {
    name: { type: String, required: true, trim: true, maxlength: 60 },
    price: { type: Number, required: true, min: 0 },
  },
  { _id: true },
);

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
    /** Added for the catalog (n03). Optional with defaults, so existing documents stay valid. */
    availability: { type: String, enum: SERVICE_AVAILABILITY, default: 'scheduled' },
    addOns: { type: [AddOnSchema], default: [] },
  },
  { timestamps: true },
);

ServiceSchema.index({ isActive: 1, bookingsCount: -1, ratingAvg: -1 });
/** Powers GET /services?q= (name weighs more than description). */
ServiceSchema.index({ name: 'text', description: 'text' }, { weights: { name: 5, description: 1 }, name: 'service_text' });

export type Service = InferSchemaType<typeof ServiceSchema>;
export const ServiceModel = model('Service', ServiceSchema);
export default ServiceModel;
