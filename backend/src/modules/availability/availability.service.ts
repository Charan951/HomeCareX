import * as repo from './availability.repository';
import { UpdateAvailabilityInput } from './availability.validation';

export class AvailabilityError extends Error {
  constructor(public status: number, message: string) {
    super(message);
  }
}

// MOCK: Upendra's onboarding contract. Always true for now.
const isOnboardingComplete = async (_partnerId: string): Promise<boolean> => true;

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
