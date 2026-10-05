import { CategoryModel } from '../../models/Category';
import { ServiceModel } from '../../models/Service';
import { SEED_CATEGORIES } from '../categories/categories.constants';
import { SEED_SERVICES } from '../services/services.constants';

/**
 * Upserts the 7 launch categories and 30 services by slug. Safe to re-run: existing documents keep
 * their ids, and nothing an admin created (other slugs) is touched. `$setOnInsert` is used for
 * fields admins may edit, so re-seeding never overwrites an admin's changes.
 */
export async function upsertCatalogSeed(): Promise<{ categories: number; services: number }> {
  const categoryIds = new Map<string, unknown>();
  for (const [i, c] of SEED_CATEGORIES.entries()) {
    await CategoryModel.updateOne(
      { slug: c.slug },
      { $setOnInsert: { slug: c.slug, name: c.name, icon: c.icon, description: c.description, sortOrder: i + 1, isActive: true } },
      { upsert: true },
    );
    const doc = await CategoryModel.findOne({ slug: c.slug }, '_id').lean();
    if (doc) categoryIds.set(c.slug, doc._id);
  }

  let services = 0;
  for (const sv of SEED_SERVICES) {
    const categoryId = categoryIds.get(sv.category);
    if (!categoryId) continue;
    await ServiceModel.updateOne(
      { slug: sv.slug },
      {
        $setOnInsert: {
          slug: sv.slug, name: sv.name, categoryId, description: sv.description, basePrice: sv.basePrice,
          durationMinutes: sv.durationMinutes, ratingAvg: sv.ratingAvg, ratingCount: sv.ratingCount,
          bookingsCount: sv.bookingsCount, availability: sv.availability, addOns: sv.addOns ?? [], isActive: true,
        },
      },
      { upsert: true },
    );
    services += 1;
  }
  return { categories: SEED_CATEGORIES.length, services };
}

/** On boot: only seeds an empty catalog, so categories an admin deletes stay deleted. */
export async function seedCatalogIfEmpty(): Promise<void> {
  const [cats, svcs] = await Promise.all([CategoryModel.estimatedDocumentCount(), ServiceModel.estimatedDocumentCount()]);
  if (cats === 0 && svcs === 0) await upsertCatalogSeed();
}
