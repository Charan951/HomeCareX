import { Schema, model } from 'mongoose';

/** Service category (Home Cleaning, Appliance Repair...). Managed by admins; services and partners reference it. */
const CategorySchema = new Schema(
  {
    name: { type: String, required: true, trim: true, unique: true, collation: { locale: 'en', strength: 2 } },
    slug: { type: String, required: true, trim: true, unique: true, index: true },
    description: { type: String, trim: true, default: '' },
    icon: { type: String, trim: true, default: '' },
    sortOrder: { type: Number, default: 0 },
    active: { type: Boolean, default: true },
  },
  { timestamps: true },
);

export const CategoryModel = model('Category', CategorySchema);
export default CategoryModel;
