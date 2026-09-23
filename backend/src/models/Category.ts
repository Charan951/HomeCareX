import { Schema, model } from 'mongoose';

const CategorySchema = new Schema({}, { timestamps: true });

export const CategoryModel = model('Category', CategorySchema);
export default CategoryModel;
