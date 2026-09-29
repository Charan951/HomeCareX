import { Types } from "mongoose";
import { DayOfWeek } from './availability.constants';

export interface IWorkingHoursDay {
        day: DayOfWeek;
        start: string;
        end: string;
        off: boolean;
}

export interface IAvailability {
        partnerId: Types.ObjectId;
        isOnline: boolean;
        workingHours: IWorkingHoursDay[];
        createdAt: Date;
        updatedAt: Date;
}

