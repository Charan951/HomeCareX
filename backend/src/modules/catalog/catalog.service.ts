import { Types } from 'mongoose';
import { ERROR_CODES } from '../../constants/errorCodes';
import { HttpError } from '../auth/auth.types';
import { summarizeAvailability } from './catalog.availability';
import { buildServiceQuery } from './catalog.query';
import { catalogRepository as repo, type CategoryRow, type ServiceRow } from './catalog.repository';
import type { PageMeta, PublicCategoryDto, PublicServiceDetailDto, PublicServiceDto } from './catalog.types';
import { categoryQuerySchema, serviceParamSchema, serviceQuerySchema } from './catalog.validation';

type CategoryLite = PublicServiceDto['category'];

const toCategoryLite = (c: CategoryRow): CategoryLite => ({ id: String(c._id), name: c.name, slug: c.slug });

const toService = (s: ServiceRow, cat: CategoryLite): PublicServiceDto => ({
  id: String(s._id),
  slug: s.slug,
  name: s.name,
  description: s.description ?? '',
  icon: s.icon ?? '',
  category: cat,
  basePrice: s.basePrice,
  durationMinutes: s.durationMinutes,
  rating: s.ratingAvg ?? 0,
  ratingCount: s.ratingCount ?? 0,
  availability: s.availability ?? 'scheduled',
});

export const catalogService = {
  /** Active categories in admin-defined order, each with its number of active services. */
  async listCategories(query: unknown): Promise<PublicCategoryDto[]> {
    categoryQuerySchema.parse(query);
    const [cats, stats] = await Promise.all([repo.activeCategories(), repo.activeServiceStats()]);
    const top = Math.max(0, ...[...stats.values()].map((x) => x.bookings));
    // Exactly one category is "popular": the first with the highest bookings (none while nothing is booked yet).
    const popularId = top > 0 ? cats.find((c) => stats.get(String(c._id))?.bookings === top)?._id : undefined;
    return cats.map((c) => ({
      id: String(c._id),
      name: c.name,
      slug: c.slug,
      description: c.description ?? '',
      icon: c.icon ?? '',
      sortOrder: c.sortOrder ?? 0,
      serviceCount: stats.get(String(c._id))?.count ?? 0,
      fromPrice: stats.get(String(c._id))?.fromPrice ?? 0,
      popular: popularId !== undefined && String(popularId) === String(c._id),
    }));
  },

  /** Validated, filtered, sorted, paginated. A page past the end returns an empty list, not an error. */
  async searchServices(query: unknown): Promise<{ items: PublicServiceDto[]; meta: PageMeta }> {
    const parsed = serviceQuerySchema.parse(query);
    const { page, limit } = parsed;

    const cats = await repo.activeCategories();
    let scope = cats;
    if (parsed.category) {
      scope = cats.filter((c) => String(c._id) === parsed.category || c.slug === parsed.category);
    }
    const emptyMeta: PageMeta = { page, limit, total: 0, totalPages: 0 };
    if (scope.length === 0) return { items: [], meta: emptyMeta };

    const built = buildServiceQuery(parsed, scope.map((c) => new Types.ObjectId(String(c._id))));
    const [rows, total] = await Promise.all([repo.findServices(built, (page - 1) * limit, limit), repo.countServices(built)]);

    const byId = new Map(cats.map((c) => [String(c._id), toCategoryLite(c)]));
    const items = rows.flatMap((r) => {
      const cat = byId.get(String(r.categoryId));
      return cat ? [toService(r, cat)] : [];
    });
    return { items, meta: { page, limit, total, totalPages: Math.ceil(total / limit) } };
  },

  async getService(params: unknown): Promise<PublicServiceDetailDto> {
    const { idOrSlug } = serviceParamSchema.parse(params);
    const row = await repo.findService(idOrSlug);
    const cat = row && (await repo.activeCategories()).find((c) => String(c._id) === String(row.categoryId));
    if (!row || !cat) throw new HttpError(404, 'Service not found', ERROR_CODES.NOT_FOUND);
    // Only for services that exist and are active, so 404s never touch the slot service.
    const slotAvailability = await summarizeAvailability(String(row._id));
    return {
      ...toService(row, toCategoryLite(cat)),
      media: (row.media ?? []).map((m) => ({ url: m.url, alt: m.alt ?? '' })),
      inclusions: row.inclusions ?? [],
      exclusions: row.exclusions ?? [],
      addOns: (row.addOns ?? []).map((a) => ({ id: String(a._id), name: a.name, price: a.price })),
      faqs: (row.faqs ?? []).map((f) => ({ id: String(f._id), question: f.question, answer: f.answer })),
      slotAvailability,
    };
  },
};
