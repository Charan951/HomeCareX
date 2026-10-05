import { Schema, model, type InferRawDocType } from 'mongoose';

/**
 * A customer's saved address. Booking never references this live: the booking module copies it
 * into `addressSnapshot` at creation time, so later edits/deletes don't rewrite history.
 */
const AddressSchema = new Schema(
  {
    customerId: { type: Schema.Types.ObjectId, ref: 'User', required: true, index: true },
    label: { type: String, trim: true, maxlength: 50, default: 'Home' },
    contactName: { type: String, trim: true, maxlength: 100 },
    contactPhone: { type: String, trim: true, maxlength: 20 },
    line1: { type: String, required: true, trim: true, maxlength: 200 },
    line2: { type: String, trim: true, maxlength: 200 },
    landmark: { type: String, trim: true, maxlength: 200 },
    city: { type: String, required: true, trim: true, maxlength: 100 },
    state: { type: String, required: true, trim: true, maxlength: 100 },
    pincode: { type: String, required: true, match: /^\d{4,10}$/ },
    // Optional: filled from the serviceable area's centre when the client has no geocoder.
    location: { lat: { type: Number }, lng: { type: Number } },
    isDefault: { type: Boolean, default: false },
  },
  { timestamps: true },
);

AddressSchema.index({ customerId: 1, createdAt: -1 });

export type IAddress = InferRawDocType<(typeof AddressSchema)['obj']> & { _id: import('mongoose').Types.ObjectId };
export const AddressModel = model('Address', AddressSchema);
export default AddressModel;
