import { Schema, model, type Types } from 'mongoose';

export const PRICING_MODES = ['FIXED', 'HOURLY'] as const;
export type PricingMode = (typeof PRICING_MODES)[number];

export interface PricingAddOn {
  _id: Types.ObjectId;
  name: string;
  price: number;
}

/** Surge applies when the slot START falls in [startTime, endTime). Times are "HH:mm" in the booking timezone. */
export interface SurgeWindow {
  label: string;
  startTime: string;
  endTime: string;
  /** Percent added to (base + add-ons). */
  percent: number;
}

const AddOnSchema = new Schema(
  {
    name: { type: String, required: true, trim: true, maxlength: 60 },
    price: { type: Number, required: true, min: 0 },
  },
  { _id: true },
);

const SurgeWindowSchema = new Schema(
  {
    label: { type: String, required: true, trim: true, maxlength: 40 },
    startTime: { type: String, required: true, match: /^([01]\d|2[0-3]):[0-5]\d$/ },
    endTime: { type: String, required: true, match: /^([01]\d|2[0-3]):[0-5]\d$/ },
    percent: { type: Number, required: true, min: 0, max: 200 },
  },
  { _id: false },
);

/**
 * One pricing rule per scope: category (serviceId null) or one service, optionally for one city
 * (city '' = every city). Amounts are whole rupees. The most specific rule wins at quote time.
 */
const PricingRuleSchema = new Schema(
  {
    categoryId: { type: Schema.Types.ObjectId, ref: 'Category', required: true, index: true },
    serviceId: { type: Schema.Types.ObjectId, ref: 'Service', default: null },
    city: { type: String, trim: true, default: '', maxlength: 100 },
    mode: { type: String, enum: PRICING_MODES, required: true },
    basePrice: { type: Number, required: true, min: 0 },
    addOns: { type: [AddOnSchema], default: [] },
    durationMinutes: { type: Number, required: true, min: 5, max: 1440, default: 60 },
    surgeWindows: { type: [SurgeWindowSchema], default: [] },
    cancellationFee: { type: Number, required: true, min: 0, default: 0 },
    active: { type: Boolean, default: true },
    updatedBy: { type: String, default: '' },
  },
  { timestamps: true },
);

PricingRuleSchema.index({ categoryId: 1, serviceId: 1, city: 1 }, { unique: true });

export const PricingRuleModel = model('PricingRule', PricingRuleSchema);
export default PricingRuleModel;
