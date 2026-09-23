import { Schema, model } from 'mongoose';

const PaymentSchema = new Schema({}, { timestamps: true });

export const PaymentModel = model('Payment', PaymentSchema);
export default PaymentModel;
