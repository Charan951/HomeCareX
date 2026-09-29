import { Schema, model } from 'mongoose';
import { DAYS_OF_WEEK, TIME_REGEX } from './availability.constants';
import { IAvailability, IWorkingHoursDay } from './availability.types';

const workingHoursDaySchema = new Schema<IWorkingHoursDay>(
  {
    day: { type: String, enum: DAYS_OF_WEEK, required: true },
    start: { type: String, match: TIME_REGEX, required: true },
    end: { type: String, match: TIME_REGEX, required: true },
    off: { type: Boolean, default: false },
  },
  { _id: false }
);

const defaultWorkingHours = (): IWorkingHoursDay[] =>
  DAYS_OF_WEEK.map((day) => ({
    day,
    start: '09:00',
    end: '18:00',
    off: day === 'sunday',
  }));

const availabilitySchema = new Schema<IAvailability>(
  {
    partnerId: {
      type: Schema.Types.ObjectId,
      required: true,
      unique: true, // one availability document per partner
      index: true,
    },
    isOnline: { type: Boolean, default: false },
    workingHours: { type: [workingHoursDaySchema], default: defaultWorkingHours },
  },
  { timestamps: true }
);

export const Availability = model<IAvailability>('Availability', availabilitySchema);
export default Availability;