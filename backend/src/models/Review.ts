import { Schema, model } from 'mongoose';

const ReviewSchema = new Schema({}, { timestamps: true });

export const ReviewModel = model('Review', ReviewSchema);
export default ReviewModel;
