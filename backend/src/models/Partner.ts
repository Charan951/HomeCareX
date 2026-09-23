import { Schema, model } from 'mongoose';

const PartnerSchema = new Schema({}, { timestamps: true });

export const PartnerModel = model('Partner', PartnerSchema);
export default PartnerModel;
