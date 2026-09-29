import { z } from 'zod';
import { DAYS_OF_WEEK, TIME_REGEX } from './availability.constants';

const timeSchema = z.string().regex(TIME_REGEX, 'Use 24-hour HH:mm');

const daySchema = z
  .object({
    day: z.enum(DAYS_OF_WEEK),
    start: timeSchema,
    end: timeSchema,
    off: z.boolean(),
  })
  .refine((d) => d.off || d.end > d.start, {
    message: 'End time must be after start time',
    path: ['end'],
  });

export const updateAvailabilitySchema = z
  .object({
    isOnline: z.boolean().optional(),
    workingHours: z
      .array(daySchema)
      .length(7, 'Send all 7 days')
      .refine((arr) => new Set(arr.map((d) => d.day)).size === 7, {
        message: 'Each day must appear exactly once',
      })
      .optional(),
  })
  .strict()
  .refine((b) => b.isOnline !== undefined || b.workingHours !== undefined, {
    message: 'Send isOnline or workingHours',
  });

export type UpdateAvailabilityInput = z.infer<typeof updateAvailabilitySchema>;