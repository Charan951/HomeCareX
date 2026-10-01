import { Types } from 'mongoose';
import { ERROR_CODES } from '../../constants/ErrorCodes';
import { Errors } from '../../utils/errors';
import { MAX_ADDRESSES_PER_USER } from './addresses.constants';
import { addressesRepository as repo } from './addresses.repository';
import type { AddressDto, AddressRow, CreateAddressInput, UpdateAddressInput } from './addresses.types';

export const toAddressDto = (row: AddressRow): AddressDto => ({
  id: row._id.toString(),
  label: row.label,
  line1: row.line1,
  area: row.area ?? null,
  city: row.city,
  pincode: row.pincode ?? null,
  isDefault: row.isDefault === true,
});

/** Token ids are strings; an invalid one means a bad token → 401 (never trust it as a filter). */
function userObjectId(userId: string): Types.ObjectId {
  if (!Types.ObjectId.isValid(userId)) throw Errors.unauthorized('Invalid session');
  return new Types.ObjectId(userId);
}

const notFound = () => Errors.notFound(ERROR_CODES.NOT_FOUND, 'Address not found');

export const addressesService = {
  async list(userId: string): Promise<AddressDto[]> {
    const rows = await repo.list(userObjectId(userId));
    return rows.map(toAddressDto);
  },

  async create(userId: string, input: CreateAddressInput): Promise<AddressDto> {
    const uid = userObjectId(userId);
    const existing = await repo.count(uid);
    if (existing >= MAX_ADDRESSES_PER_USER) {
      throw Errors.conflict(ERROR_CODES.CONFLICT, `You can save up to ${MAX_ADDRESSES_PER_USER} addresses. Delete one to add another.`);
    }
    // The first address is always the default so the dashboard has something to show.
    const isDefault = existing === 0 || input.isDefault === true;
    const row = await repo.create(uid, { ...input, isDefault });
    if (isDefault) await repo.clearDefaultExcept(uid, new Types.ObjectId(row._id.toString()));
    return toAddressDto(row);
  },

  async update(userId: string, addressId: string, patch: UpdateAddressInput): Promise<AddressDto> {
    const uid = userObjectId(userId);
    const id = new Types.ObjectId(addressId);
    const row = await repo.update(uid, id, patch);
    if (!row) throw notFound(); // also what a stranger's id gets — existence is not revealed
    if (patch.isDefault) await repo.clearDefaultExcept(uid, id);
    return toAddressDto(row);
  },

  /** "Deliver here": make this the default, which is the address the dashboard shows. */
  async setDefault(userId: string, addressId: string): Promise<AddressDto> {
    const row = await repo.makeDefault(userObjectId(userId), new Types.ObjectId(addressId));
    if (!row) throw notFound();
    return toAddressDto(row);
  },

  async remove(userId: string, addressId: string): Promise<{ id: string }> {
    const uid = userObjectId(userId);
    const id = new Types.ObjectId(addressId);
    const existing = await repo.findOwned(uid, id);
    if (!existing) throw notFound();
    await repo.delete(uid, id);
    if (existing.isDefault) await repo.promoteNewest(uid); // never leave the customer with addresses but no default
    return { id: addressId };
  },
};
