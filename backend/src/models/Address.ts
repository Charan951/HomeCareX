import { Schema, model, type InferSchemaType } from 'mongoose';

/**
 * A saved service address. Belongs to exactly one customer (userId).
 * Contract for: addresses module, booking flow, customer dashboard.
 * Every read MUST filter by userId taken from the verified token.
 */
const AddressSchema = new Schema(
  {
    userId: { type: Schema.Types.ObjectId, ref: 'User', required: true, index: true },
    /** "Home", "Office", "Parents' Home"... */
    label: { type: String, required: true, trim: true, maxlength: 30 },
    line1: { type: String, required: true, trim: true, maxlength: 200 },
    area: { type: String, trim: true, maxlength: 100 },
    city: { type: String, required: true, trim: true, maxlength: 100 },
    pincode: { type: String, match: /^\d{6}$/ },
    location: {
      type: { type: String, enum: ['Point'] },
      coordinates: { type: [Number] }, // [lng, lat]
    },
    isDefault: { type: Boolean, default: false },
  },
  { timestamps: true },
);

AddressSchema.index({ userId: 1, isDefault: -1, updatedAt: -1 });

export type Address = InferSchemaType<typeof AddressSchema>;
export const AddressModel = model('Address', AddressSchema);
export default AddressModel;
