import clsx from "clsx";
import { Star } from "lucide-react";
import type { CatalogCategory, ServiceListParams, ServiceSort } from "@/types/catalog";
import {
  AVAILABILITY_OPTIONS,
  DURATION_OPTIONS,
  PRICE_OPTIONS,
  RATING_OPTIONS,
  SORT_OPTIONS,
  priceChoiceId,
} from "@/pages/customer/Services/serviceParams";
import { FOCUS_RING } from "../focusRing";

export interface FilterOption {
  id: string;
  label: string;
  /** Compact label for chips / segmented controls. Falls back to `label`. */
  short?: string;
}

export interface FilterGroup {
  key: "category" | "price" | "rating" | "availability" | "duration";
  label: string;
  options: FilterOption[];
  /** Id of the selected option. The first option is always the "no filter" choice. */
  value: string;
  onPick: (id: string) => void;
}

const SHORT: Record<string, string> = {
  "4.5": "4.5+",
  "4": "4.0+",
  "3": "3.0+",
  "500-1000": "₹500 – ₹1,000",
  o2500: "₹2,500+",
  today: "Today",
  tomorrow: "By tomorrow",
  "30": "30 min",
  "60": "1 hr",
  "120": "2 hr",
  any: "Any",
};

const withShort = (options: { id: string; label: string }[], useShort = true): FilterOption[] =>
  options.map((o) => ({ id: o.id, label: o.label, short: useShort ? SHORT[o.id] : undefined }));

/** Single source of truth for the filter groups: used by the desktop FilterBar and the mobile sheet. */
export function buildFilterGroups(
  params: ServiceListParams,
  categories: CatalogCategory[],
  onChange: (patch: Partial<ServiceListParams>) => void,
): FilterGroup[] {
  const pick = <T,>(options: { id: string; value: T }[], id: string): T | undefined => options.find((o) => o.id === id)?.value;
  return [
    {
      key: "category",
      label: "Category",
      options: [{ id: "all", label: "All categories", short: "All" }, ...categories.map((c) => ({ id: c.slug, label: c.name }))],
      value: params.category ?? "all",
      onPick: (v) => onChange({ category: v === "all" ? undefined : v }),
    },
    {
      key: "price",
      label: "Price",
      options: withShort(PRICE_OPTIONS),
      value: priceChoiceId(params),
      onPick: (v) => {
        const range = pick(PRICE_OPTIONS, v) ?? {};
        onChange({ minPrice: range.minPrice, maxPrice: range.maxPrice });
      },
    },
    {
      key: "rating",
      label: "Rating",
      options: withShort(RATING_OPTIONS),
      value: RATING_OPTIONS.find((o) => o.value === params.rating)?.id ?? "any",
      onPick: (v) => onChange({ rating: pick(RATING_OPTIONS, v) }),
    },
    {
      key: "availability",
      label: "Availability",
      options: withShort(AVAILABILITY_OPTIONS).map((o) => (o.id === "any" ? { ...o, short: "Any time" } : o)),
      value: params.availability ?? "any",
      onPick: (v) => onChange({ availability: pick(AVAILABILITY_OPTIONS, v) }),
    },
    {
      key: "duration",
      label: "Duration",
      options: withShort(DURATION_OPTIONS),
      value: DURATION_OPTIONS.find((o) => o.value === params.duration)?.id ?? "any",
      onPick: (v) => onChange({ duration: pick(DURATION_OPTIONS, v) }),
    },
  ];
}

interface Props {
  params: ServiceListParams;
  categories: CatalogCategory[];
  onChange: (patch: Partial<ServiceListParams>) => void;
}

/** Sort + filter groups as chips and segmented controls. Lives inside the FilterDrawer (side panel on desktop, bottom sheet on mobile). */
export function ServiceFilters({ params, categories, onChange }: Props) {
  const groups = buildFilterGroups(params, categories, onChange);
  const hasQuery = !!params.q;
  const sortValue: ServiceSort = params.sort ?? (hasQuery ? "relevance" : "popular");
  const sortOptions = SORT_OPTIONS.filter((o) => o.id !== "relevance" || hasQuery);
  return (
    <div>
      <section className="border-b border-line pb-4">
        <h3 id="filter-sort" className="mb-2.5 text-[13px] font-semibold text-ink">
          Sort by
        </h3>
        <div role="radiogroup" aria-labelledby="filter-sort" className="flex flex-wrap gap-2">
          {sortOptions.map((o) => {
            const on = sortValue === o.id;
            return (
              <button
                key={o.id}
                type="button"
                role="radio"
                aria-checked={on}
                onClick={() => onChange({ sort: o.id })}
                className={clsx(
                  "inline-flex min-h-[38px] items-center rounded-full border px-3.5 text-[13px] transition-colors",
                  on ? "border-brand bg-brand-soft font-medium text-brand" : "border-line bg-panel text-ink hover:bg-canvas",
                  FOCUS_RING,
                )}
              >
                {o.label}
              </button>
            );
          })}
        </div>
      </section>
      {groups.map((g, i) => {
        const segmented = g.key === "availability" || g.key === "duration";
        return (
          <section key={g.key} className={clsx("py-4", i > 0 && "border-t border-line")}>
            <h3 id={`filter-${g.key}`} className="mb-2.5 text-[13px] font-semibold text-ink">
              {g.label}
            </h3>
            {segmented ? (
              <div role="radiogroup" aria-labelledby={`filter-${g.key}`} className="flex gap-0.5 rounded-xl bg-canvas p-[3px]">
                {g.options.map((o) => {
                  const on = g.value === o.id;
                  return (
                    <button
                      key={o.id}
                      type="button"
                      role="radio"
                      aria-checked={on}
                      onClick={() => g.onPick(o.id)}
                      className={clsx(
                        "min-h-[38px] flex-1 rounded-[9px] px-1 text-[13px] transition-colors",
                        on ? "border border-line bg-panel font-medium text-ink" : "border border-transparent text-muted",
                        FOCUS_RING,
                      )}
                    >
                      {o.short ?? o.label}
                    </button>
                  );
                })}
              </div>
            ) : (
              <div role="radiogroup" aria-labelledby={`filter-${g.key}`} className="flex flex-wrap gap-2">
                {g.options.map((o) => {
                  const on = g.value === o.id;
                  return (
                    <button
                      key={o.id}
                      type="button"
                      role="radio"
                      aria-checked={on}
                      onClick={() => g.onPick(o.id)}
                      className={clsx(
                        "inline-flex min-h-[38px] items-center gap-1.5 rounded-full border px-3.5 text-[13px] transition-colors",
                        on ? "border-brand bg-brand-soft font-medium text-brand" : "border-line bg-panel text-ink hover:bg-canvas",
                        FOCUS_RING,
                      )}
                    >
                      {g.key === "rating" && o.id !== "any" && <Star className="h-3.5 w-3.5 fill-amber-400 text-amber-400" aria-hidden="true" />}
                      {o.short ?? o.label}
                    </button>
                  );
                })}
              </div>
            )}
          </section>
        );
      })}
    </div>
  );
}
