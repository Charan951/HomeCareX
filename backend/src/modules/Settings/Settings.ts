import { Schema, model, type InferSchemaType } from 'mongoose';

/** Platform-wide settings. One document, key = 'platform'. */
const SettingsSchema = new Schema(
  {
    key: { type: String, required: true, unique: true, default: 'platform' },
    /** Platform commission as a fraction of gross (0.2 = 20%). */
    commissionRate: { type: Number, required: true, default: 0.2, min: 0, max: 1 },
  },
  { timestamps: true },
);

export type Settings = InferSchemaType<typeof SettingsSchema>;
export const SettingsModel = model('Settings', SettingsSchema);
export default SettingsModel;