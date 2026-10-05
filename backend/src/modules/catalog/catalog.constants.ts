import { SERVICE_AVAILABILITY } from '../../models/Service';

export const SERVICE_SORTS = ['popular', 'rating', 'price-asc', 'price-desc', 'newest', 'relevance'] as const;
export type ServiceSort = (typeof SERVICE_SORTS)[number];

export const AVAILABILITY_FILTERS = SERVICE_AVAILABILITY.filter((a) => a !== 'scheduled');

export const PAGE_DEFAULT = 1;
export const PAGE_MAX = 1000;
export const LIMIT_DEFAULT = 12;
export const LIMIT_MAX = 50;
export const PRICE_MAX = 1_000_000;
export const Q_MAX_LENGTH = 60;

export const CATALOG_CONSTANTS = { SERVICE_SORTS, PAGE_DEFAULT, PAGE_MAX, LIMIT_DEFAULT, LIMIT_MAX, PRICE_MAX, Q_MAX_LENGTH };
