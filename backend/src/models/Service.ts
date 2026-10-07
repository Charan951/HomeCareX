import { Schema, model, type Types } from 'mongoose';

/** How soon a partner can usually be there. Drives the catalog's availability filter. */
export const SERVICE_AVAILABILITY = ['today', 'tomorrow', 'scheduled'] as const;
export type ServiceAvailability = (typeof SERVICE_AVAILABILITY)[number];

export interface ServiceAddOn {
  _id: Types.ObjectId;
  name: string;
  price: number;
}

/** One gallery item. Array order is display order: the first item is the main image. */
export interface ServiceMedia {
  url: string;
  alt: string;
}

export interface ServiceFaq {
  _id: Types.ObjectId;
  question: string;
  answer: string;
}

const MediaSchema = new Schema(
  {
    url: { type: String, required: true, trim: true, maxlength: 500 },
    alt: { type: String, trim: true, default: '', maxlength: 160 },
  },
  { _id: false },
);

const FaqSchema = new Schema(
  {
    question: { type: String, required: true, trim: true, maxlength: 200 },
    answer: { type: String, required: true, trim: true, maxlength: 1000 },
  },
  { _id: true },
);

const AddOnSchema = new Schema(
  {
    name: { type: String, required: true, trim: true, maxlength: 60 },
    price: { type: Number, required: true, min: 0 },
  },
  { _id: true },
);

/** A bookable service (AC Service, Deep Cleaning...) that belongs to one Category. Prices are in rupees. */
const ServiceSchema = new Schema(
  {
    categoryId: { type: Schema.Types.ObjectId, ref: 'Category', required: true, index: true },
    name: { type: String, required: true, trim: true, maxlength: 80 },
    slug: { type: String, required: true, trim: true, unique: true, index: true },
    description: { type: String, trim: true, default: '' },
    basePrice: { type: Number, required: true, min: 0 },
    durationMinutes: { type: Number, required: true, min: 5, max: 1440, default: 60 },
    addOns: { type: [AddOnSchema], default: [] },
    active: { type: Boolean, default: true },
    /** Catalog listing fields (n03). Optional with defaults, so existing documents stay valid. */
    icon: { type: String, trim: true, default: '' },
    /** Denormalised from reviews so listings need no join. */
    ratingAvg: { type: Number, default: 0, min: 0, max: 5 },
    ratingCount: { type: Number, default: 0, min: 0 },
    /** Used to rank "Most booked" / "Recommended for you". */
    bookingsCount: { type: Number, default: 0, min: 0 },
    availability: { type: String, enum: SERVICE_AVAILABILITY, default: 'scheduled' },
    /** Service details page (n04). All optional with empty defaults, so existing documents stay valid. */
    media: { type: [MediaSchema], default: [] },
    inclusions: { type: [{ type: String, trim: true, maxlength: 200 }], default: [] },
    exclusions: { type: [{ type: String, trim: true, maxlength: 200 }], default: [] },
    faqs: { type: [FaqSchema], default: [] },
  },
  { timestamps: true },
);

ServiceSchema.index({ active: 1, bookingsCount: -1, ratingAvg: -1 });
/** Powers GET /services?q= (name weighs more than description). */
ServiceSchema.index({ name: 'text', description: 'text' }, { weights: { name: 5, description: 1 }, name: 'service_text' });

export const ServiceModel = model('Service', ServiceSchema);
export default ServiceModel;
