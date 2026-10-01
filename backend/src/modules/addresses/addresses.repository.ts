import { Types } from 'mongoose';
import { AddressModel, type IAddress } from '../../models/Address';

export class AddressesRepository {
  listByCustomer(customerId: string): Promise<IAddress[]> {
    return AddressModel.find({ customerId: new Types.ObjectId(customerId) })
      .sort({ isDefault: -1, createdAt: -1 })
      .lean<IAddress[]>()
      .exec();
  }

  countByCustomer(customerId: string): Promise<number> {
    return AddressModel.countDocuments({ customerId: new Types.ObjectId(customerId) }).exec();
  }

  /** Scoped by owner: another customer's id resolves to null, exactly like a missing one. */
  findOwned(id: string, customerId: string): Promise<IAddress | null> {
    if (!Types.ObjectId.isValid(id)) return Promise.resolve(null);
    return AddressModel.findOne({ _id: id, customerId: new Types.ObjectId(customerId) }).lean<IAddress>().exec();
  }

  async create(doc: Record<string, unknown>): Promise<IAddress> {
    const created = await AddressModel.create(doc);
    return created.toObject() as IAddress;
  }

  clearDefault(customerId: string): Promise<unknown> {
    return AddressModel.updateMany(
      { customerId: new Types.ObjectId(customerId), isDefault: true }, 
      { $set: { isDefault: false } }
    ).exec();
  }

  async update(id: string, customerId: string, updateData: Record<string, unknown>): Promise<IAddress | null> {
    if (!Types.ObjectId.isValid(id)) return null;
    return AddressModel.findOneAndUpdate(
      { _id: id, customerId: new Types.ObjectId(customerId) },
      { $set: updateData },
      { new: true }
    ).lean<IAddress>().exec();
  }

  async delete(id: string, customerId: string): Promise<boolean> {
    if (!Types.ObjectId.isValid(id)) return false;
    const result = await AddressModel.deleteOne({
      _id: id,
      customerId: new Types.ObjectId(customerId),
    }).exec();
    return result.deletedCount > 0;
  }
}

export const addressesRepository = new AddressesRepository();