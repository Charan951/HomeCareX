import { MongoServerError } from 'mongodb';
import * as repo from './blackout.repository';
import { CreateBlackoutInput, UpdateBlackoutInput } from './blackout.validation';

export class BlackoutError extends Error {
  constructor(public status: number, message: string) {
    super(message);
  }
}

export const listBlackouts = (partnerId: string) => repo.list(partnerId);

export const createBlackout = async (partnerId: string, input: CreateBlackoutInput) => {
  try {
    return await repo.create(partnerId, input);
  } catch (err) {
    if (err instanceof MongoServerError && err.code === 11000) {
      throw new BlackoutError(409, 'A blackout date already exists for that day');
    }
    throw err;
  }
};

export const updateBlackout = async (partnerId: string, id: string, input: UpdateBlackoutInput) => {
  const updated = await repo.update(partnerId, id, input);
  if (!updated) throw new BlackoutError(404, 'Blackout date not found');
  return updated;
};

export const deleteBlackout = async (partnerId: string, id: string) => {
  const deleted = await repo.remove(partnerId, id);
  if (!deleted) throw new BlackoutError(404, 'Blackout date not found');
  return deleted;
};