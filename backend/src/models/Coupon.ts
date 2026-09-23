import { Schema, model } from 'mongoose';

const CouponSchema = new Schema({}, { timestamps: true });

export const CouponModel = model('Coupon', CouponSchema);
export default CouponModel;
