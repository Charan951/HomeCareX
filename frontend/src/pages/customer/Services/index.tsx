import { useEffect, useMemo, useRef, useState } from "react";
import { useSearchParams } from "react-router-dom";
import { SearchX, SlidersHorizontal, X } from "lucide-react";
import clsx from "clsx";
import { EmptyState, ErrorState, OfflineState } from "@/components/customer";
import { FOCUS_RING } from "@/components/customer/focusRing";
import {
  FilterDrawer,
  Pagination,
  ServiceFilters,
  ServiceGrid,
  ServiceGridSkeleton,
  ServiceSearch,
  buildFilterGroups,
  plural,
} from "@/components/customer/catalog";
import { useCategories } from "@/hooks/useCategories";
import { useOnlineStatus } from "@/hooks/useOnlineStatus";
import { useServices } from "@/hooks/useServices";
import type { ServiceListParams } from "@/types/catalog";
import { activeFilterCount, parseServiceParams, toSearchParams } from "./serviceParams";

/**
 * Services discovery page. The URL remains the source of truth so category/filter/search
 * selections stay shareable and existing booking links keep working.
 */
export default function Services() {
  const [searchParams, setSearchParams] = useSearchParams();
  const params = useMemo(() => parseServiceParams(searchParams), [searchParams]);
  const { data, isPending, isError, error, isPlaceholderData, refetch } = useServices(params);
  const categories = useCategories();
  const online = useOnlineStatus();
  const [drawerOpen, setDrawerOpen] = useState(false);
  const headingRef = useRef<HTMLHeadingElement>(null);

  const update = (patch: Partial<ServiceListParams>, { replace = false } = {}) => {
    const next = { ...params, page: 1, ...patch };
    if (!next.q && next.sort === "relevance") next.sort = undefined;
    setSearchParams(toSearchParams(next), { replace });
  };

  const resetFilters = () =>
    update({ category: undefined, rating: undefined, minPrice: undefined, maxPrice: undefined, duration: undefined, availability: undefined });
  const resetAll = () => setSearchParams(new URLSearchParams());

  const lastPage = useRef(params.page);
  useEffect(() => {
    if (lastPage.current === params.page) return;
    lastPage.current = params.page;
    headingRef.current?.focus({ preventScroll: true });
    headingRef.current?.scrollIntoView({ block: "start", behavior: "auto" });
  }, [params.page]);

  const filters = activeFilterCount(params);
  const total = data?.meta.total ?? 0;
  const filterGroups = buildFilterGroups(params, categories.data ?? [], (patch) => update(patch));
  const activeCategory = categories.data?.find((category) => category.slug === params.category);
  // Removable chips for every active filter except category (category has its own chip row).
  const activeChips = filterGroups
    .filter((g) => g.key !== "category" && g.value !== g.options[0].id)
    .map((g) => ({ key: g.key, label: g.label, text: (g.options.find((o) => o.id === g.value) ?? g.options[0]).label, clear: () => g.onPick(g.options[0].id) }));

  let results;
  if (isPending) {
    results = <ServiceGridSkeleton count={params.limit / 2} />;
  } else if (isError && !data) {
    results =
      !online || error?.code === "NETWORK_ERROR" ? (
        <OfflineState onRetry={() => void refetch()} />
      ) : (
        <ErrorState title="We couldn't load services" message={error?.message} onRetry={() => void refetch()} />
      );
  } else if (data && data.items.length === 0 && data.meta.total > 0) {
    results = (
      <EmptyState
        icon={SearchX}
        title="That page doesn't exist"
        description={`There are only ${plural(data.meta.totalPages, "page")} of results.`}
        action={
          <button type="button" onClick={() => update({}, { replace: true })} className={clsx("min-h-[44px] rounded-full bg-brand px-5 text-sm font-semibold text-white", FOCUS_RING)}>
            Go to the first page
          </button>
        }
      />
    );
  } else if (data && data.items.length === 0) {
    results = (
      <EmptyState
        icon={SearchX}
        title="No services match your search"
        description={params.q || filters > 0 ? "Try a different search, or remove some filters." : "Services will appear here soon."}
        action={
          (params.q || filters > 0) && (
            <button type="button" onClick={resetAll} className={clsx("min-h-[44px] rounded-full bg-brand px-5 text-sm font-semibold text-white", FOCUS_RING)}>
              Clear search and filters
            </button>
          )
        }
      />
    );
  } else if (data) {
    results = (
      <>
        <ServiceGrid services={data.items} busy={isPlaceholderData} />
        <Pagination page={data.meta.page} totalPages={data.meta.totalPages} disabled={isPlaceholderData} onPageChange={(page) => setSearchParams(toSearchParams({ ...params, page }))} />
      </>
    );
  }

  return (
    <div className="mx-auto max-w-[1440px] space-y-5 md:space-y-6">
      <header>
        <div className="flex flex-wrap items-end justify-between gap-3">
          <div className="min-w-0">
            <p className="text-xs font-semibold uppercase tracking-[0.16em] text-brand">Services</p>
            <h1 ref={headingRef} tabIndex={-1} className="mt-1 text-[26px] font-bold leading-tight tracking-tight text-ink outline-none md:text-4xl">
              {activeCategory ? activeCategory.name : "Everything your home needs"}
            </h1>
            <p className="mt-1 text-sm text-muted" aria-live="polite">
              {data ? plural(total, "service") : "Book trusted professionals. Transparent prices, no surprises."}
              {data && params.q && <> matching &ldquo;{params.q}&rdquo;</>}
            </p>
          </div>
        </div>
        <div className="mt-4 flex items-center gap-2.5">
          <div className="min-w-0 flex-1">
            <ServiceSearch value={params.q ?? ""} onSearch={(q) => update({ q: q || undefined }, { replace: true })} />
          </div>
          <button
            type="button"
            onClick={() => setDrawerOpen(true)}
            aria-haspopup="dialog"
            className={clsx(
              "inline-flex h-12 shrink-0 items-center justify-center gap-2 whitespace-nowrap rounded-full border bg-panel px-5 text-sm font-semibold transition-colors hover:border-brand",
              filters > 0 ? "border-brand bg-brand-soft text-brand" : "border-line text-ink",
              FOCUS_RING,
            )}
          >
            <SlidersHorizontal className="h-4 w-4" aria-hidden="true" />
            
            {filters > 0 && <span className="rounded-full bg-brand px-2 text-xs leading-5 text-white">{filters}</span>}
          </button>
        </div>
      </header>

      {/* <CategoryChips categories={categories.data ?? []} total={categories.data?.reduce((n, c) => n + c.serviceCount, 0) ?? total} selected={params.category} onSelect={(category) => update({ category })} /> */}

      {activeChips.length > 0 && (
        <div className="flex flex-wrap items-center gap-2" role="group" aria-label="Active filters">
          {activeChips.map((c) => (
            <span key={c.key} className="inline-flex items-center gap-1.5 rounded-full bg-brand-soft py-1 pl-3 pr-1.5 text-[13px] font-semibold text-brand">
              {c.text}
              <button
                type="button"
                onClick={c.clear}
                aria-label={`Remove ${c.label.toLowerCase()} filter`}
                className={clsx("flex h-6 w-6 items-center justify-center rounded-full bg-brand/15 hover:bg-brand/25", FOCUS_RING)}
              >
                <X className="h-3 w-3" aria-hidden="true" />
              </button>
            </span>
          ))}
          <button type="button" onClick={resetFilters} className={clsx("px-2 py-1 text-[13px] font-semibold text-brand", FOCUS_RING)}>
            Clear all
          </button>
        </div>
      )}

      <div id="all-services" className="scroll-mt-24">
        {results}
      </div>

      <FilterDrawer
        open={drawerOpen}
        onClose={() => setDrawerOpen(false)}
        doneLabel={data ? `Show ${plural(total, "service")}` : "Done"}
        subtitle={filters > 0 ? `${filters} applied` : "No filters applied"}
        onClear={filters > 0 ? resetFilters : undefined}
      >
        <ServiceFilters params={params} categories={categories.data ?? []} onChange={(patch) => update(patch)} />
      </FilterDrawer>
    </div>
  );
}

