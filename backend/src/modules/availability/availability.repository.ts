import { Availability } from './availability.model';
import { UpdateAvailabilityInput } from './availability.validation';

export const findOrCreate = (partnerId: string) =>
  Availability.findOneAndUpdate(
    { partnerId },
    { $setOnInsert: { partnerId } },
    { upsert: true, new: true, setDefaultsOnInsert: true }
  );

export const update = (partnerId: string, data: UpdateAvailabilityInput) =>
  Availability.findOneAndUpdate(
    { partnerId },
    { $set: data },
    { new: true, runValidators: true }
  );