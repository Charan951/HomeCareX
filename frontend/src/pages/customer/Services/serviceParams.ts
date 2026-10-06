import type { AvailabilityFilter, ServiceListParams, ServiceSort } from "@/types/catalog";

/** Cards per page. Well under the API's limit of 50. */
export const PAGE_SIZE = 12;

export const SORT_OPTIONS: { id: ServiceSort; label: string }[] = [
  { id: "popular", label: "Popular" },
  { id: "rating", label: "Top rated" },
  { id: "price-asc", label: "Price: low to high" },
  { id: "price-desc", label: "Price: high to low" },
  { id: "newest", label: "Newest" },
  { id: "relevance", label: "Best match" },
];
const SORT_IDS = SORT_OPTIONS.map((s) => s.id);

export interface Choice<T> {
  id: string;
  label: string;
  value: T;
}

export const RATING_OPTIONS: Choice<number | undefined>[] = [
  { id: "any", label: "Any rating", value: undefined },
  { id: "4.5", label: "4.5 and up", value: 4.5 },
  { id: "4", label: "4.0 and up", value: 4 },
  { id: "3", label: "3.0 and up", value: 3 },
];

export const PRICE_OPTIONS: Choice<{ minPrice?: number; maxPrice?: number }>[] = [
  { id: "any", label: "Any price", value: {} },
  { id: "u500", label: "Under ₹500", value: { maxPrice: 500 } },
  { id: "500-1000", label: "₹500 – ₹1,000", value: { minPrice: 500, maxPrice: 1000 } },
  { id: "1000-2500", label: "₹1,000 – ₹2,500", value: { minPrice: 1000, maxPrice: 2500 } },
  { id: "o2500", label: "₹2,500 and above", value: { minPrice: 2500 } },
];

export const DURATION_OPTIONS: Choice<number | undefined>[] = [
  { id: "any", label: "Any duration", value: undefined },
  { id: "30", label: "Up to 30 min", value: 30 },
  { id: "60", label: "Up to 1 hour", value: 60 },
  { id: "120", label: "Up to 2 hours", value: 120 },
];

export const AVAILABILITY_OPTIONS: Choice<AvailabilityFilter | undefined>[] = [
  { id: "any", label: "Any time", value: undefined },
  { id: "today", label: "Available today", value: "today" },
  { id: "tomorrow", label: "By tomorrow", value: "tomorrow" },
];

const num = (raw: string | null, min: number, max: number, int = false): number | undefined => {
  if (raw === null || raw.trim() === "") return undefined;
  const n = Number(raw);
  if (!Number.isFinite(n) || n < min || n > max || (int && !Number.isInteger(n))) return undefined;
  return n;
};

/**
 * URL -> API params. Anything out of range or malformed is dropped instead of sent, so a hand-edited
 * or stale link can never make the API answer 400. The URL is the single source of truth.
 */
export function parseServiceParams(sp: URLSearchParams): ServiceListParams {
  const q = sp.get("q")?.trim().slice(0, 60);
  const category = sp.get("category")?.trim();
  const availability = sp.get("availability");
  const sort = sp.get("sort") as ServiceSort | null;
  let minPrice = num(sp.get("minPrice"), 0, 1_000_000);
  let maxPrice = num(sp.get("maxPrice"), 0, 1_000_000);
  if (minPrice !== undefined && maxPrice !== undefined && minPrice > maxPrice) {
    minPrice = undefined;
    maxPrice = undefined;
  }
  return {
    q: q || undefined,
    category: category && /^[a-z0-9]+(?:-[a-z0-9]+)*$/.test(category) && category.length <= 80 ? category : undefined,
    rating: num(sp.get("rating"), 0.1, 5),
    minPrice,
    maxPrice,
    duration: num(sp.get("duration"), 5, 1440, true),
    availability: availability === "today" || availability === "tomorrow" ? availability : undefined,
    sort: sort && SORT_IDS.includes(sort) && (sort !== "relevance" || !!q) ? sort : undefined,
    page: num(sp.get("page"), 1, 1000, true) ?? 1,
    limit: PAGE_SIZE,
  };
}

/** API params -> URL. Defaults (page 1, no filters) are omitted to keep links short. */
export function toSearchParams(p: ServiceListParams): URLSearchParams {
  const sp = new URLSearchParams();
  const set = (k: string, v: string | number | undefined) => v !== undefined && sp.set(k, String(v));
  set("q", p.q);
  set("category", p.category);
  set("rating", p.rating);
  set("minPrice", p.minPrice);
  set("maxPrice", p.maxPrice);
  set("duration", p.duration);
  set("availability", p.availability);
  set("sort", p.sort);
  if (p.page > 1) sp.set("page", String(p.page));
  return sp;
}

export const priceChoiceId = (p: Pick<ServiceListParams, "minPrice" | "maxPrice">): string =>
  PRICE_OPTIONS.find((o) => o.value.minPrice === p.minPrice && o.value.maxPrice === p.maxPrice)?.id ?? "any";

/** How many filters (not search or sort) are narrowing the results. */
export const activeFilterCount = (p: ServiceListParams): number =>
  [p.category, p.rating, p.minPrice ?? p.maxPrice, p.duration, p.availability].filter((v) => v !== undefined).length;
