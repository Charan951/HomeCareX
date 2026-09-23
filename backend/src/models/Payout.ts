import { Schema, model } from 'mongoose';

const PayoutSchema = new Schema({}, { timestamps: true });

export const PayoutModel = model('Payout', PayoutSchema);
export default PayoutModel;
