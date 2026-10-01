import { Schema, model } from 'mongoose';

/** One document per setting key, e.g. `tax.gstPercent`. `value` is JSON (number, string, array...). */
const SettingSchema = new Schema(
  {
    key: { type: String, required: true, unique: true, trim: true },
    value: { type: Schema.Types.Mixed, required: true },
    description: { type: String },
    updatedBy: { type: Schema.Types.ObjectId, ref: 'User' },
  },
  { timestamps: true },
);

export const SettingModel = model('Setting', SettingSchema);
export default SettingModel;
