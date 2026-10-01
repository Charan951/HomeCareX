import { Schema, model } from 'mongoose';

/** Minimal shape needed by dashboards. The Categories module can extend it (icon, order, ...). */
const CategorySchema = new Schema(
  {
    name: { type: String, trim: true },
    slug: { type: String, trim: true, index: true },
    active: { type: Boolean, default: true },
  },
  { timestamps: true },
);

export const CategoryModel = model('Category', CategorySchema);
export default CategoryModel;
