import { z } from 'zod';
import { DesignationModel } from '../../models/Designation';
import { UserModel } from '../../models/User';
import { HttpError } from '../auth/auth.types';

export const DEFAULT_DESIGNATIONS = ['Plumber', 'Electrician', 'Cleaner', 'Painter', 'Appliance Repair', 'Maintenance'];

export const designationBodySchema = z.object({
  name: z.string().trim().min(2, 'Name must be at least 2 characters').max(40, 'Name must be 40 characters or fewer'),
});

const CI = { collation: { locale: 'en', strength: 2 } } as const; // case-insensitive matching

/** Inserts the default list the first time. Never re-adds ones an admin deleted (only runs on an empty collection). */
export async function seedDefaultDesignations() {
  if ((await DesignationModel.estimatedDocumentCount()) === 0) {
    await DesignationModel.insertMany(DEFAULT_DESIGNATIONS.map((name) => ({ name })), { ordered: false }).catch(() => undefined);
  }
}

const toDto = (d: InstanceType<typeof DesignationModel>, partners = 0) => ({ id: d.id, name: d.name, partners });

export const designationsService = {
  async list() {
    const [rows, counts] = await Promise.all([
      DesignationModel.find().sort({ name: 1 }).collation({ locale: 'en' }),
      UserModel.aggregate<{ _id: string; n: number }>([
        { $match: { role: 'partner', designation: { $exists: true, $ne: null } } },
        { $group: { _id: '$designation', n: { $sum: 1 } } },
      ]),
    ]);
    const byName = new Map(counts.map((c) => [c._id, c.n]));
    return rows.map((d) => toDto(d, byName.get(d.name) ?? 0));
  },

  /** True when `name` is a known designation (case-insensitive). Returns the canonical spelling. */
  async canonical(name: string): Promise<string | null> {
    const d = await DesignationModel.findOne({ name }, 'name', CI);
    return d?.name ?? null;
  },

  async create(input: unknown) {
    const { name } = designationBodySchema.parse(input);
    if (await DesignationModel.exists({ name }).collation(CI.collation)) {
      throw new HttpError(409, `“${name}” already exists`, 'DUPLICATE_DESIGNATION');
    }
    return toDto(await DesignationModel.create({ name }));
  },

  /** Renaming also updates every partner that has the old name, so nobody is left with a dangling designation. */
  async rename(id: string, input: unknown) {
    const { name } = designationBodySchema.parse(input);
    const existing = await DesignationModel.findById(id);
    if (!existing) throw new HttpError(404, 'Designation not found', 'NOT_FOUND');
    const clash = await DesignationModel.findOne({ name, _id: { $ne: id } }, '_id', CI);
    if (clash) throw new HttpError(409, `“${name}” already exists`, 'DUPLICATE_DESIGNATION');

    const oldName = existing.name;
    existing.name = name;
    await existing.save();
    const { modifiedCount } = await UserModel.updateMany({ role: 'partner', designation: oldName }, { $set: { designation: name } });
    return toDto(existing, modifiedCount);
  },

  /** Blocked while partners still use it; reassign them first. */
  async remove(id: string) {
    const existing = await DesignationModel.findById(id);
    if (!existing) throw new HttpError(404, 'Designation not found', 'NOT_FOUND');
    const inUse = await UserModel.countDocuments({ role: 'partner', designation: existing.name });
    if (inUse > 0) {
      throw new HttpError(
        409,
        `${inUse} partner${inUse === 1 ? ' is' : 's are'} still “${existing.name}”. Change their designation first.`,
        'DESIGNATION_IN_USE',
      );
    }
    await existing.deleteOne();
  },
};
