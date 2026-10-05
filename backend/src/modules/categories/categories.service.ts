import { CategoryModel } from '../../models/Category';
import { ServiceModel } from '../../models/Service';
import { HttpError } from '../auth/auth.types';
import { slugify, uniqueSlug } from '../../utils/slug';
import { categoryCreateSchema, categoryUpdateSchema } from './categories.validation';
import type { CategoryDto } from './categories.types';

const CI = { collation: { locale: 'en', strength: 2 } } as const;

const toDto = (c: InstanceType<typeof CategoryModel>, services = 0): CategoryDto => ({
  id: c.id,
  name: c.name,
  slug: c.slug,
  description: c.description ?? '',
  icon: c.icon ?? '',
  sortOrder: c.sortOrder ?? 0,
  active: c.isActive,
  services,
});

/** API uses `active`; the model (shared with the dashboard) stores it as `isActive`. */
const toModelFields = ({ active, ...rest }: { active?: boolean; [k: string]: unknown }) => ({
  ...rest,
  ...(active !== undefined ? { isActive: active } : {}),
});

/** Admin: every category (active or not) with its total service count. Public reads live in modules/catalog. */
export const categoriesService = {
  async list(): Promise<CategoryDto[]> {
    const [rows, counts] = await Promise.all([
      CategoryModel.find({}).sort({ sortOrder: 1, name: 1 }).collation({ locale: 'en' }),
      ServiceModel.aggregate<{ _id: unknown; n: number }>([{ $group: { _id: '$categoryId', n: { $sum: 1 } } }]),
    ]);
    const byId = new Map(counts.map((c) => [String(c._id), c.n]));
    return rows.map((c) => toDto(c, byId.get(c.id) ?? 0));
  },

  async create(input: unknown) {
    const data = categoryCreateSchema.parse(input);
    if (await CategoryModel.exists({ name: data.name }).collation(CI.collation)) {
      throw new HttpError(409, `“${data.name}” already exists`, 'DUPLICATE_CATEGORY');
    }
    const slug = await uniqueSlug(slugify(data.name), (s) => CategoryModel.exists({ slug: s }).then(Boolean));
    return toDto(await CategoryModel.create({ ...toModelFields(data), slug }));
  },

  async update(id: string, input: unknown) {
    const data = categoryUpdateSchema.parse(input);
    const existing = await CategoryModel.findById(id);
    if (!existing) throw new HttpError(404, 'Category not found', 'NOT_FOUND');
    if (data.name && data.name !== existing.name) {
      if (await CategoryModel.exists({ name: data.name, _id: { $ne: id } }).collation(CI.collation)) {
        throw new HttpError(409, `“${data.name}” already exists`, 'DUPLICATE_CATEGORY');
      }
    }
    existing.set(toModelFields(data)); // slug stays stable so existing links keep working
    await existing.save();
    return toDto(existing, await ServiceModel.countDocuments({ categoryId: existing._id }));
  },

  /** Blocked while services still belong to it; move or delete them first (or just deactivate the category). */
  async remove(id: string) {
    const existing = await CategoryModel.findById(id);
    if (!existing) throw new HttpError(404, 'Category not found', 'NOT_FOUND');
    const inUse = await ServiceModel.countDocuments({ categoryId: existing._id });
    if (inUse > 0) {
      throw new HttpError(
        409,
        `${inUse} service${inUse === 1 ? ' is' : 's are'} still in “${existing.name}”. Move or delete them first, or deactivate the category.`,
        'CATEGORY_IN_USE',
      );
    }
    await existing.deleteOne();
  },
};
