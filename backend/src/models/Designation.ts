import { Schema, model } from 'mongoose';

/** Partner specialist types (Plumber, Electrician...). Managed by admins; partners reference them by name. */
const DesignationSchema = new Schema(
  {
    name: { type: String, required: true, trim: true, unique: true, collation: { locale: 'en', strength: 2 } },
  },
  { timestamps: true },
);

export const DesignationModel = model('Designation', DesignationSchema);
export default DesignationModel;
