import { Schema, model, Types } from 'mongoose';

export interface IBlackoutDate {
  partnerId: Types.ObjectId;
  date: string; // "YYYY-MM-DD"
  reason: string;
  createdAt: Date;
  updatedAt: Date;
}

const DATE_REGEX = /^\d{4}-\d{2}-\d{2}$/;

const blackoutSchema = new Schema<IBlackoutDate>(
  {
    partnerId: { type: Schema.Types.ObjectId, required: true, index: true },
    date: { type: String, required: true, match: DATE_REGEX },
    reason: { type: String, required: true, trim: true, maxlength: 200 },
  },
  { timestamps: true }
);

// One entry per partner per date — the database itself blocks duplicates.
blackoutSchema.index({ partnerId: 1, date: 1 }, { unique: true });

export const BlackoutDate = model<IBlackoutDate>('BlackoutDate', blackoutSchema);
export default BlackoutDate;