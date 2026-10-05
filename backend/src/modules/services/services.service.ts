import { Types, type FilterQuery } from 'mongoose';
import { CategoryModel } from '../../models/Category';
import { BookingModel } from '../../models/Booking';
import { ServiceModel } from '../../models/Service';
import { HttpError } from '../auth/auth.types';
import { slugify, uniqueSlug } from '../../utils/slug';
import { serviceAdminQuerySchema, serviceCreateSchema, serviceUpdateSchema } from './services.validation';
import type { ServiceDto } from './services.types';

type ServiceDoc = InstanceType<typeof ServiceModel>;
type CategoryLite = { id: string; name: string; slug: string };

const toDto = (s: ServiceDoc, cat: CategoryLite | null): ServiceDto => ({
  id: s.id,
  slug: s.slug,
  name: s.name,
  description: s.description ?? '',
  categoryId: String(s.categoryId),
  category: cat,
  basePrice: s.basePrice,
  durationMinutes: s.durationMinutes,
  addOns: s.addOns.map((a) => ({ id: String(a._id), name: a.name, price: a.price })),
  active: s.isActive,
});

async function categoryMap(ids: unknown[]): Promise<Map<string, CategoryLite>> {
  const rows = await CategoryModel.find({ _id: { $in: ids } }, 'name slug');
  return new Map(rows.map((c) => [c.id, { id: c.id, name: c.name, slug: c.slug }]));
}

const toAddOns = (addOns?: { id?: string; name: string; price: number }[]) =>
  addOns?.map((a) => ({ ...(a.id ? { _id: new Types.ObjectId(a.id) } : {}), name: a.name, price: a.price }));

async function assertCategory(id: string) {
  if (!(await CategoryModel.exists({ _id: id }))) throw new HttpError(400, 'Category does not exist', 'CATEGORY_NOT_FOUND');
}

/** Admin only (every service, active or not). Customer-facing reads live in modules/catalog. */
export const servicesService = {
  async list(query: unknown): Promise<ServiceDto[]> {
    const { category, q, active } = serviceAdminQuerySchema.parse(query);
    const filter: FilterQuery<ServiceDoc> = {};
    if (active) filter.isActive = active === 'true';
    if (category) {
      const cat = await CategoryModel.findOne(Types.ObjectId.isValid(category) ? { _id: category } : { slug: category }, '_id');
      if (!cat) return [];
      filter.categoryId = cat._id;
    }
    if (q) filter.name = { $regex: q.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'), $options: 'i' };

    const rows = await ServiceModel.find(filter).sort({ name: 1 }).collation({ locale: 'en' });
    const cats = await categoryMap([...new Set(rows.map((r) => String(r.categoryId)))]);
    return rows.map((r) => toDto(r, cats.get(String(r.categoryId)) ?? null));
  },

  async get(id: string): Promise<ServiceDto> {
    const s = await ServiceModel.findOne(Types.ObjectId.isValid(id) ? { _id: id } : { slug: id });
    if (!s) throw new HttpError(404, 'Service not found', 'NOT_FOUND');
    const cat = (await categoryMap([s.categoryId])).get(String(s.categoryId)) ?? null;
    return toDto(s, cat);
  },

  async create(input: unknown) {
    const { active, addOns, ...data } = serviceCreateSchema.parse(input);
    await assertCategory(data.categoryId);
    const slug = await uniqueSlug(slugify(data.name), (s) => ServiceModel.exists({ slug: s }).then(Boolean));
    const created = await ServiceModel.create({ ...data, slug, addOns: toAddOns(addOns), ...(active !== undefined ? { isActive: active } : {}) });
    return this.get(created.id);
  },

  async update(id: string, input: unknown) {
    const { active, addOns, ...rest } = serviceUpdateSchema.parse(input);
    const existing = await ServiceModel.findById(id);
    if (!existing) throw new HttpError(404, 'Service not found', 'NOT_FOUND');
    if (rest.categoryId) await assertCategory(rest.categoryId);
    existing.set(rest); // slug stays stable so booking links keep working
    if (active !== undefined) existing.set('isActive', active);
    if (addOns) existing.set('addOns', toAddOns(addOns));
    await existing.save();
    return this.get(id);
  },

  /** Services with booking history can't be deleted (would orphan bookings); deactivate them instead. */
  async remove(id: string) {
    const existing = await ServiceModel.findById(id);
    if (!existing) throw new HttpError(404, 'Service not found', 'NOT_FOUND');
    if (await BookingModel.exists({ serviceId: existing._id })) {
      throw new HttpError(409, 'This service has bookings. Deactivate it instead of deleting.', 'SERVICE_IN_USE');
    }
    await existing.deleteOne();
  },
};
