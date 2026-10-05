import { CategoryModel } from '../../models/Category';
import { ServiceModel } from '../../models/Service';
import { seedDefaultCategories } from '../categories/categories.service';
import { CATALOG_SEED_SERVICES } from './catalog.seedData';

/**
 * Upserts the 30 launch services by slug into the default categories (seeded first, fixed ids).
 * Safe to re-run: existing documents keep their ids, and nothing an admin created (other slugs) is
 * touched. `$setOnInsert` is used for fields admins may edit, so re-seeding never overwrites an
 * admin's changes. Services that already exist (e.g. from services.constants.ts) only gain the
 * catalog stats (rating, bookings, availability) while they have no ratings yet.
 */
export async function upsertCatalogSeed(): Promise<{ categories: number; services: number }> {
  await seedDefaultCategories();
  const cats = await CategoryModel.find({}, '_id slug').lean();
  const categoryIds = new Map(cats.map((c) => [c.slug, c._id]));

  let services = 0;
  for (const sv of CATALOG_SEED_SERVICES) {
    const categoryId = categoryIds.get(sv.category);
    if (!categoryId) continue;
    const stats = { ratingAvg: sv.ratingAvg, ratingCount: sv.ratingCount, bookingsCount: sv.bookingsCount, availability: sv.availability };
    await ServiceModel.updateOne(
      { slug: sv.slug },
      {
        $setOnInsert: {
          slug: sv.slug, name: sv.name, categoryId, description: sv.description, basePrice: sv.basePrice,
          durationMinutes: sv.durationMinutes, addOns: sv.addOns ?? [], active: true, ...stats,
        },
      },
      { upsert: true },
    );
    await ServiceModel.updateOne(
      { slug: sv.slug, $or: [{ ratingCount: { $exists: false } }, { ratingCount: 0 }] },
      { $set: stats },
    );
    services += 1;
  }
  return { categories: categoryIds.size, services };
}
