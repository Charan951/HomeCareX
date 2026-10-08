import { CategoryModel } from '../../models/Category';
import { ServiceModel } from '../../models/Service';
import { seedDefaultCategories } from '../categories/categories.service';
import { SERVICE_DESCRIPTIONS } from './catalog.descriptionsSeedData';
import { SERVICE_DETAILS_SEED } from './catalog.detailsSeedData';
import { CATALOG_SEED_SERVICES } from './catalog.seedData';

/**
 * Upserts the 30 launch services by slug into the default categories (seeded first, fixed ids).
 * Safe to re-run: existing documents keep their ids, and nothing an admin created (other slugs) is
 * touched. `$setOnInsert` is used for fields admins may edit, so re-seeding never overwrites an
 * admin's changes. Services that already exist (e.g. from services.constants.ts) only gain the
 * catalog stats (rating, bookings, availability) while they have no ratings yet.
 * The details-page content (gallery, inclusions, exclusions, FAQs) is filled in only for fields that
 * are still empty, so an admin's edits are never overwritten and re-running is safe. The same goes for the
 * description: it is upgraded to the full text only while it is empty or still the original one-line seed.
 */
export async function upsertCatalogSeed(opts: BackfillOptions = {}): Promise<{ categories: number; services: number }> {
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
  await backfillServiceDetails(opts);
  return { categories: categoryIds.size, services };
}

export interface BackfillOptions {
  /**
   * Replace each launch service's gallery with the seed photos even when it already has some. Off by default so an
   * admin's own photos are never overwritten; turn it on (`--refresh-media`) after the seed photo sets change.
   */
  refreshMedia?: boolean;
}

/** Matches a field that is missing or an empty array. */
const isEmpty = (field: string) => ({ $or: [{ [field]: { $exists: false } }, { [field]: { $size: 0 } }] });

/** One bulk write: each launch service gets its details content for every field that is still empty. */
export async function backfillServiceDetails({ refreshMedia = false }: BackfillOptions = {}): Promise<number> {
  const ops = CATALOG_SEED_SERVICES.flatMap((sv) => {
    const full = SERVICE_DESCRIPTIONS[sv.slug];
    const describe = full
      ? [{ updateOne: { filter: { slug: sv.slug, $or: [{ description: { $exists: false } }, { description: '' }, { description: sv.description }] }, update: { $set: { description: full } } } }]
      : [];
    // Add-ons are only written on insert, so a service that already existed without them (older seed, or
    // created before add-ons were defined) would never get them. Fill them in while the list is still empty.
    const addOnFill = sv.addOns?.length
      ? [{ updateOne: { filter: { slug: sv.slug, ...isEmpty('addOns') }, update: { $set: { addOns: sv.addOns } } } }]
      : [];
    const d = SERVICE_DETAILS_SEED[sv.slug];
    if (!d) return [...describe, ...addOnFill];
    const fill = (field: string, value: unknown, force = false) => ({ updateOne: { filter: { slug: sv.slug, ...(force ? {} : isEmpty(field)) }, update: { $set: { [field]: value } } } });
    return [
      ...describe,
      ...addOnFill,
      fill('media', d.images.map((url, i) => ({ url, alt: `${sv.name} (photo ${i + 1})` })), refreshMedia),
      fill('inclusions', d.inclusions),
      fill('exclusions', d.exclusions),
      fill('faqs', d.faqs.map(([question, answer]) => ({ question, answer }))),
    ];
  });
  if (ops.length === 0) return 0;
  const res = await ServiceModel.bulkWrite(ops);
  return res.modifiedCount;
}