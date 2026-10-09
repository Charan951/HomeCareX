import mongoose, { Types, type ClientSession } from 'mongoose';
import { AddressModel, type IAddress } from '../../models/Address';

export type AddressSession = ClientSession | undefined;

/** The only update shapes this module uses: set some fields, remove others. */
export interface AddressUpdate {
  $set?: Record<string, unknown>;
  $unset?: Record<string, ''>;
}

/** A standalone mongod (typical local dev) cannot run transactions; Atlas / replica sets can. */
function transactionsUnsupported(err: unknown): boolean {
  const e = err as { code?: number; message?: string };
  return e?.code === 20 || String(e?.message ?? '').includes('Transaction numbers are only allowed');
}

export class AddressesRepository {
  /**
   * Runs `work` in a transaction (retried by the driver on transient conflicts, so `work` must be safe to
   * run twice). Falls back to running without one only when the server cannot do transactions at all;
   * the unique default-address index still protects the single-default rule in that case.
   */
  async inTransaction<T>(work: (session: AddressSession) => Promise<T>): Promise<T> {
    const session = await mongoose.startSession();
    try {
      let result!: T;
      await session.withTransaction(async () => {
        result = await work(session);
      });
      return result;
    } catch (err) {
      if (transactionsUnsupported(err)) return work(undefined);
      throw err;
    } finally {
      await session.endSession();
    }
  }

  listByCustomer(customerId: string): Promise<IAddress[]> {
    return AddressModel.find({ customerId: new Types.ObjectId(customerId) })
      .sort({ isDefault: -1, createdAt: -1 })
      .lean<IAddress[]>()
      .exec();
  }

  countByCustomer(customerId: string, session?: AddressSession): Promise<number> {
    return AddressModel.countDocuments({ customerId: new Types.ObjectId(customerId) })
      .session(session ?? null)
      .exec();
  }

  /** Scoped by owner: another customer's id resolves to null, exactly like a missing one. */
  findOwned(id: string, customerId: string, session?: AddressSession): Promise<IAddress | null> {
    if (!Types.ObjectId.isValid(id)) return Promise.resolve(null);
    return AddressModel.findOne({ _id: id, customerId: new Types.ObjectId(customerId) })
      .session(session ?? null)
      .lean<IAddress>()
      .exec();
  }

  /** The customer's most recently added address (used to pick the next default). */
  findNewest(customerId: string, session?: AddressSession): Promise<IAddress | null> {
    return AddressModel.findOne({ customerId: new Types.ObjectId(customerId) })
      .sort({ createdAt: -1, _id: -1 })
      .session(session ?? null)
      .lean<IAddress>()
      .exec();
  }

  async create(doc: Record<string, unknown>, session?: AddressSession): Promise<IAddress> {
    const [created] = await AddressModel.create([doc], { session });
    return created.toObject() as IAddress;
  }

  clearDefault(customerId: string, session?: AddressSession): Promise<unknown> {
    return AddressModel.updateMany(
      { customerId: new Types.ObjectId(customerId), isDefault: true },
      { $set: { isDefault: false } },
      { session },
    ).exec();
  }

  async setDefault(id: string, customerId: string, session?: AddressSession): Promise<void> {
    await AddressModel.updateOne(
      { _id: id, customerId: new Types.ObjectId(customerId) },
      { $set: { isDefault: true } },
      { session },
    ).exec();
  }

  async update(
    id: string,
    customerId: string,
    update: AddressUpdate,
    session?: AddressSession,
  ): Promise<IAddress | null> {
    if (!Types.ObjectId.isValid(id)) return null;
    return AddressModel.findOneAndUpdate({ _id: id, customerId: new Types.ObjectId(customerId) }, update, {
      new: true,
      session,
    })
      .lean<IAddress>()
      .exec();
  }

  async delete(id: string, customerId: string, session?: AddressSession): Promise<boolean> {
    if (!Types.ObjectId.isValid(id)) return false;
    const result = await AddressModel.deleteOne(
      { _id: id, customerId: new Types.ObjectId(customerId) },
      { session },
    ).exec();
    return result.deletedCount > 0;
  }
}

export const addressesRepository = new AddressesRepository();
