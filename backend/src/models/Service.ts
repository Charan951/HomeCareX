import { Schema, model, type Types } from 'mongoose';

export interface ServiceAddOn {
  _id: Types.ObjectId;
  name: string;
  price: number;
}

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
  },
  { timestamps: true },
);

export const ServiceModel = model('Service', ServiceSchema);
export default ServiceModel;
