import { Schema, model, type InferSchemaType } from 'mongoose';

/** A service category shown on the customer dashboard and used by partners (Partner.categories). */
const CategorySchema = new Schema(
  {
    name: { type: String, required: true, trim: true },
    slug: { type: String, required: true, unique: true, lowercase: true, trim: true },
    icon: { type: String },
    sortOrder: { type: Number, default: 0 },
    isActive: { type: Boolean, default: true },
  },
  { timestamps: true },
);

CategorySchema.index({ isActive: 1, sortOrder: 1 });

export type Category = InferSchemaType<typeof CategorySchema>;
export const CategoryModel = model('Category', CategorySchema);
export default CategoryModel;
