import { Schema, model, type InferSchemaType } from 'mongoose';

/**
 * Incentive campaign: "complete `targetJobs` jobs between `startsAt` and `endsAt` to earn `rewardAmount`".
 * Campaigns are shared by all partners. Each partner's progress is NOT stored: it is counted from their
 * completed bookings (see incentives.service.ts), so it can never drift from the real job data.
 */
const IncentiveSchema = new Schema(
  {
    title: { type: String, required: true, trim: true, maxlength: 120 },
    description: { type: String, trim: true, maxlength: 500, default: '' },
    /** Jobs a partner must complete inside the window. */
    targetJobs: {
      type: Number,
      required: true,
      min: 1,
      max: 1000,
      validate: { validator: Number.isInteger, message: 'targetJobs must be a whole number' },
    },
    /** INR paid when the target is reached. */
    rewardAmount: { type: Number, required: true, min: 0 },
    /** Window is [startsAt, endsAt): a job completed exactly at endsAt does not count. */
    startsAt: { type: Date, required: true },
    endsAt: { type: Date, required: true },
    /** Eligibility: partner's average rating must be at least this. null = no rating rule. */
    minRating: { type: Number, min: 0, max: 5, default: null },
    /** Eligibility: only jobs in these categories count. Empty = every category counts. */
    categoryIds: [{ type: Schema.Types.ObjectId, ref: 'Category' }],
    /** Admin switch. Inactive campaigns are hidden from partners (list and detail). */
    isActive: { type: Boolean, default: true },
    createdBy: { type: Schema.Types.ObjectId, ref: 'User' },
  },
  { timestamps: true },
);

IncentiveSchema.pre('validate', function () {
  if (this.startsAt && this.endsAt && this.endsAt <= this.startsAt) {
    this.invalidate('endsAt', 'endsAt must be after startsAt');
  }
});

IncentiveSchema.index({ isActive: 1, endsAt: 1, startsAt: 1 });

export type Incentive = InferSchemaType<typeof IncentiveSchema>;
export const IncentiveModel = model('Incentive', IncentiveSchema);
export default IncentiveModel;