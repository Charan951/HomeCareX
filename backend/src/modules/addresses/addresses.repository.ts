import { Types } from 'mongoose';
import AddressModel from '../../models/Address';
import type { AddressRow, CreateAddressInput, UpdateAddressInput } from './addresses.types';

const FIELDS = 'label line1 area city pincode isDefault';

/**
 * SECURITY: every method takes `userId` (from the verified token) and puts it in the
 * filter, so a customer can never read or change another customer's address — even
 * with a guessed id.
 */
export const addressesRepository = {
  /** Default first, then most recently updated. */
  list(userId: Types.ObjectId) {
    return AddressModel.find({ userId })
      .sort({ isDefault: -1, updatedAt: -1 })
      .select(FIELDS)
      .lean<AddressRow[]>()
      .exec();
  },

  findOwned(userId: Types.ObjectId, id: Types.ObjectId) {
    return AddressModel.findOne({ _id: id, userId }).select(FIELDS).lean<AddressRow | null>().exec();
  },

  count(userId: Types.ObjectId) {
    return AddressModel.countDocuments({ userId }).exec();
  },

  async create(userId: Types.ObjectId, input: CreateAddressInput & { isDefault: boolean }): Promise<AddressRow> {
    const doc = await AddressModel.create({
      userId,
      label: input.label,
      line1: input.line1,
      city: input.city,
      isDefault: input.isDefault,
      ...(input.area ? { area: input.area } : {}),
      ...(input.pincode ? { pincode: input.pincode } : {}),
    });
    return doc.toObject() as unknown as AddressRow;
  },

  async update(userId: Types.ObjectId, id: Types.ObjectId, patch: UpdateAddressInput): Promise<AddressRow | null> {
    const $set: Record<string, unknown> = {};
    const $unset: Record<string, 1> = {};
    for (const key of ['label', 'line1', 'city'] as const) if (patch[key] !== undefined) $set[key] = patch[key];
    for (const key of ['area', 'pincode'] as const) {
      if (patch[key] === undefined) continue;
      if (patch[key] === null) $unset[key] = 1;
      else $set[key] = patch[key];
    }
    if (patch.isDefault) $set.isDefault = true;
    const update: Record<string, unknown> = {};
    if (Object.keys($set).length) update.$set = $set;
    if (Object.keys($unset).length) update.$unset = $unset;
    return AddressModel.findOneAndUpdate({ _id: id, userId }, update, { new: true })
      .select(FIELDS)
      .lean<AddressRow | null>()
      .exec();
  },

  async delete(userId: Types.ObjectId, id: Types.ObjectId): Promise<boolean> {
    const res = await AddressModel.deleteOne({ _id: id, userId }).exec();
    return res.deletedCount === 1;
  },

  /** Make `id` the only default for this user. */
  async makeDefault(userId: Types.ObjectId, id: Types.ObjectId): Promise<AddressRow | null> {
    const chosen = await AddressModel.findOneAndUpdate({ _id: id, userId }, { $set: { isDefault: true } }, { new: true })
      .select(FIELDS)
      .lean<AddressRow | null>()
      .exec();
    if (!chosen) return null;
    await AddressModel.updateMany({ userId, _id: { $ne: id }, isDefault: true }, { $set: { isDefault: false } }).exec();
    return chosen;
  },

  /** Unset the default on every other address (used after create / update with isDefault). */
  async clearDefaultExcept(userId: Types.ObjectId, keepId: Types.ObjectId): Promise<void> {
    await AddressModel.updateMany({ userId, _id: { $ne: keepId }, isDefault: true }, { $set: { isDefault: false } }).exec();
  },

  /** After deleting the default, promote the most recently updated remaining address. */
  async promoteNewest(userId: Types.ObjectId): Promise<void> {
    const newest = await AddressModel.findOne({ userId }).sort({ updatedAt: -1 }).select('_id').lean<{ _id: Types.ObjectId } | null>().exec();
    if (newest) await AddressModel.updateOne({ _id: newest._id, userId }, { $set: { isDefault: true } }).exec();
  },
};
