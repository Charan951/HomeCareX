import * as repo from './availability.repository';
import { UpdateAvailabilityInput } from './availability.validation';
import Availability from './availability.model';
import * as blackoutRepo from './blackout.repository';

export class AvailabilityError extends Error {
  constructor(public status: number, message: string) {
    super(message);
  }
}

export interface Slot {
  date: string;  // YYYY-MM-DD
  start: string; // HH:mm, 24-hour
  end: string;   // HH:mm, 24-hour
}

// MOCK: Upendra's onboarding contract. Always true for now.
const isOnboardingComplete = async (_partnerId: string): Promise<boolean> => true;

const JS_DAY_TO_NAME = ['sunday', 'monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday'] as const;

export const getAvailability = (partnerId: string) => repo.findOrCreate(partnerId);

export const updateAvailability = async (
  partnerId: string,
  input: UpdateAvailabilityInput
) => {
  if (input.isOnline === true && !(await isOnboardingComplete(partnerId))) {
    throw new AvailabilityError(403, 'Complete onboarding before going online');
  }
  await repo.findOrCreate(partnerId);
  return repo.update(partnerId, input);
};

export const isAvailable = async (partnerId: string, slot: Slot): Promise<boolean> => {
  const availability = await Availability.findOne({ partnerId });
  if (!availability || !availability.isOnline) return false;

  const blackedOut = await blackoutRepo.existOnDate(partnerId, slot.date);
  if (blackedOut) return false;

  const dayName = JS_DAY_TO_NAME[new Date(`${slot.date}T00:00:00Z`).getUTCDay()];
  const day = availability.workingHours.find((d) => d.day === dayName);
  if (!day || day.off) return false;

  return slot.start >= day.start && slot.end <= day.end;
};