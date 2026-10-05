import type { Types } from 'mongoose';
import type { ServiceSort } from './catalog.constants';
import type { ServiceQuery } from './catalog.validation';

type SortSpec = Record<string, 1 | -1>;

export interface BuiltServiceQuery {
  filter: Record<string, unknown>;
  sort: SortSpec;
  /** True when results are ranked by text relevance (needs a textScore projection). */
  textScore: boolean;
}

/** `_id` is always the last key so pages never overlap or skip when values tie. */
const SORTS: Record<Exclude<ServiceSort, 'relevance'>, SortSpec> = {
  popular: { bookingsCount: -1, ratingAvg: -1, _id: 1 },
  rating: { ratingAvg: -1, ratingCount: -1, _id: 1 },
  'price-asc': { basePrice: 1, _id: 1 },
  'price-desc': { basePrice: -1, _id: 1 },
  newest: { createdAt: -1, _id: 1 },
};

/** Pure: turns validated params into a Mongo filter + sort. Only active services in the given categories. */
export function buildServiceQuery(query: ServiceQuery, categoryIds: Types.ObjectId[]): BuiltServiceQuery {
  const filter: Record<string, unknown> = { active: { $ne: false }, categoryId: { $in: categoryIds } };

  if (query.q) filter.$text = { $search: query.q };
  if (query.rating !== undefined && query.rating > 0) filter.ratingAvg = { $gte: query.rating };
  if (query.minPrice !== undefined || query.maxPrice !== undefined) {
    filter.basePrice = {
      ...(query.minPrice !== undefined ? { $gte: query.minPrice } : {}),
      ...(query.maxPrice !== undefined ? { $lte: query.maxPrice } : {}),
    };
  }
  if (query.duration !== undefined) filter.durationMinutes = { $lte: query.duration };
  if (query.availability === 'today') filter.availability = 'today';
  if (query.availability === 'tomorrow') filter.availability = { $in: ['today', 'tomorrow'] };

  const wanted = query.sort ?? (query.q ? 'relevance' : 'popular');
  if (wanted === 'relevance' && query.q) {
    return { filter, sort: { bookingsCount: -1, _id: 1 }, textScore: true };
  }
  return { filter, sort: SORTS[wanted === 'relevance' ? 'popular' : wanted], textScore: false };
}
