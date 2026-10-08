import { Schema, model, type InferRawDocType } from 'mongoose';

export const ADDRESS_LABELS = ['Home', 'Work', 'Other'] as const;
export type AddressLabel = (typeof ADDRESS_LABELS)[number];

/**
 * A customer's saved address. Booking never references this live: the booking module copies it
 * into `addressSnapshot` at creation time, so later edits/deletes don't rewrite history.
 *
 * `house` / `street` / `area` are what the customer types. `line1` (house + street) and `line2`
 * (area) are derived from them on every write, because the booking and partner modules read those two.
 */
const AddressSchema = new Schema(
  {
    customerId: { type: Schema.Types.ObjectId, ref: 'User', required: true, index: true },
    label: { type: String, trim: true, enum: ADDRESS_LABELS, default: 'Home' },
    contactName: { type: String, trim: true, maxlength: 100 },
    contactPhone: { type: String, trim: true, maxlength: 20 },
    house: { type: String, trim: true, maxlength: 100 },
    street: { type: String, trim: true, maxlength: 150 },
    area: { type: String, trim: true, maxlength: 150 },
    line1: { type: String, required: true, trim: true, maxlength: 260 },
    line2: { type: String, trim: true, maxlength: 150 },
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
// Database-level guarantee of "one default per customer": a second default cannot be written, even by a race.
AddressSchema.index(
  { customerId: 1 },
  { unique: true, partialFilterExpression: { isDefault: true }, name: 'uniq_default_address_per_customer' },
);

export type IAddress = InferRawDocType<(typeof AddressSchema)['obj']> & { _id: import('mongoose').Types.ObjectId };
export const AddressModel = model('Address', AddressSchema);
export default AddressModel;
