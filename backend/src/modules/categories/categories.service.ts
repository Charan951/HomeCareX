import { CategoryModel } from '../../models/Category';
import { ServiceModel } from '../../models/Service';
import { HttpError } from '../auth/auth.types';
import { slugify, uniqueSlug } from '../../utils/slug';
import { SEED_CATEGORIES } from './categories.constants';
import {
  categoryCreateSchema,
  categoryUpdateSchema,
} from './categories.validation';
import type { CategoryDto } from './categories.types';

const CI = {
  collation: { locale: 'en', strength: 2 },
} as const;

const toDto = (
  c: InstanceType<typeof CategoryModel>,
  services = 0,
): CategoryDto => ({
  id: c.id,
  name: c.name,
  slug: c.slug,
  description: c.description ?? '',
  icon: c.icon ?? '',
  sortOrder: c.sortOrder ?? 0,
  active: c.active,
  services,
});

/**
 * Inserts missing default categories.
 *
 * Also removes old/incomplete category records that do not have
 * a valid name. This prevents blank categories from appearing
 * in the admin Coupon form.
 *
 * Existing valid categories are preserved.
 */
export async function seedDefaultCategories() {
  // Remove only incomplete/blank category records.
  await CategoryModel.deleteMany({
    $or: [
      { name: { $exists: false } },
      { name: null },
      { name: '' },
    ],
  });

  // Insert any missing default categories.
  for (const [index, category] of SEED_CATEGORIES.entries()) {
    const existing = await CategoryModel.findOne({
      $or: [
        { _id: category.id },
        { slug: category.slug },
        { name: category.name },
      ],
    });

    if (existing) {
      continue;
    }

    await CategoryModel.create({
      _id: category.id,
      name: category.name,
      slug: category.slug,
      icon: category.icon,
      description: category.description,
      sortOrder: index,
      active: true,
    });
  }
}

export const categoriesService = {
  /**
   * Admin: every category with its service count.
   * Public: only active categories.
   */
  async list({ onlyActive = false } = {}): Promise<CategoryDto[]> {
    const [rows, counts] = await Promise.all([
      CategoryModel.find(
        onlyActive ? { active: true } : {},
      )
        .sort({ sortOrder: 1, name: 1 })
        .collation({ locale: 'en' }),

      ServiceModel.aggregate<{
        _id: unknown;
        n: number;
      }>([
        {
          $match: onlyActive ? { active: true } : {},
        },
        {
          $group: {
            _id: '$categoryId',
            n: { $sum: 1 },
          },
        },
      ]),
    ]);

    const byId = new Map(
      counts.map((c) => [String(c._id), c.n]),
    );

    return rows.map((c) =>
      toDto(c, byId.get(c.id) ?? 0),
    );
  },

  async create(input: unknown) {
    const data = categoryCreateSchema.parse(input);

    if (
      await CategoryModel.exists({
        name: data.name,
      }).collation(CI.collation)
    ) {
      throw new HttpError(
        409,
        `“${data.name}” already exists`,
        'DUPLICATE_CATEGORY',
      );
    }

    const slug = await uniqueSlug(
      slugify(data.name),
      (s) =>
        CategoryModel.exists({
          slug: s,
        }).then(Boolean),
    );

    return toDto(
      await CategoryModel.create({
        ...data,
        slug,
      }),
    );
  },

  async update(id: string, input: unknown) {
    const data = categoryUpdateSchema.parse(input);

    const existing = await CategoryModel.findById(id);

    if (!existing) {
      throw new HttpError(
        404,
        'Category not found',
        'NOT_FOUND',
      );
    }

    if (
      data.name &&
      data.name !== existing.name
    ) {
      if (
        await CategoryModel.exists({
          name: data.name,
          _id: { $ne: id },
        }).collation(CI.collation)
      ) {
        throw new HttpError(
          409,
          `“${data.name}” already exists`,
          'DUPLICATE_CATEGORY',
        );
      }
    }

    // Keep the existing slug stable so existing links continue working.
    existing.set(data);

    await existing.save();

    return toDto(
      existing,
      await ServiceModel.countDocuments({
        categoryId: existing._id,
      }),
    );
  },

  /**
   * Block deletion while services still belong to the category.
   * Move or delete those services first, or deactivate the category.
   */
  async remove(id: string) {
    const existing = await CategoryModel.findById(id);

    if (!existing) {
      throw new HttpError(
        404,
        'Category not found',
        'NOT_FOUND',
      );
    }

    const inUse = await ServiceModel.countDocuments({
      categoryId: existing._id,
    });

    if (inUse > 0) {
      throw new HttpError(
        409,
        `${inUse} service${
          inUse === 1 ? ' is' : 's are'
        } still in “${existing.name}”. Move or delete them first, or deactivate the category.`,
        'CATEGORY_IN_USE',
      );
    }

    await existing.deleteOne();
  },
};

