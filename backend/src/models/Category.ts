import { Schema, model } from 'mongoose';

/** A service category shown on the customer dashboard and used by partners (Partner.categories). */
const CategorySchema = new Schema(
  {
    name: { type: String, trim: true },
    slug: { type: String, trim: true, index: true },
    icon: { type: String },
    sortOrder: { type: Number, default: 0 },
    active: { type: Boolean, default: true },
  },
  { timestamps: true },
);

export const CategoryModel = model('Category', CategorySchema);
export default CategoryModel;
