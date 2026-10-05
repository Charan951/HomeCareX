import { useEffect, useMemo, useRef, useState } from "react";
import { useSearchParams } from "react-router-dom";
import { ArrowRight, SearchX, ShieldCheck, SlidersHorizontal } from "lucide-react";
import clsx from "clsx";
import { EmptyState, ErrorState, OfflineState } from "@/components/customer";
import { FOCUS_RING } from "@/components/customer/focusRing";
import {
  CategoryChips,
  FilterBar,
  FilterDrawer,
  Pagination,
  ServiceFilters,
  ServiceGrid,
  ServiceGridSkeleton,
  ServiceSearch,
  ServiceSort,
  buildFilterGroups,
  plural,
} from "@/components/customer/catalog";
import { useCategories } from "@/hooks/useCategories";
import { useMediaQuery } from "@/hooks/useMediaQuery";
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
  const isDesktop = useMediaQuery("(min-width: 1024px)");
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
          <ServiceSort value={params.sort} hasQuery={!!params.q} onChange={(sort) => update({ sort })} className="hidden sm:block [&_select]:h-11 [&_select]:min-w-[170px] [&_select]:rounded-full" />
        </div>
        <div className="mt-4 max-w-4xl">
          <ServiceSearch value={params.q ?? ""} onSearch={(q) => update({ q: q || undefined }, { replace: true })} />
        </div>
      </header>

      <CategoryChips categories={categories.data ?? []} total={categories.data?.reduce((n, c) => n + c.serviceCount, 0) ?? total} selected={params.category} onSelect={(category) => update({ category })} />

      <div className="hidden lg:block">
        <FilterBar groups={filterGroups.filter((g) => g.key !== "category")} activeCount={filters} onClear={resetFilters} />
      </div>

      <div className="flex items-center justify-between gap-3 lg:hidden">
        <button
          type="button"
          onClick={() => setDrawerOpen(true)}
          aria-haspopup="dialog"
          className={clsx("inline-flex h-11 items-center gap-1.5 rounded-full border bg-panel px-4 text-xs font-semibold text-ink transition hover:border-brand/30 hover:bg-brand-soft", filters > 0 ? "border-brand text-brand" : "border-line", FOCUS_RING)}
        >
          <SlidersHorizontal className="h-3.5 w-3.5" aria-hidden="true" />
          Filters{filters > 0 && ` (${filters})`}
        </button>
        <ServiceSort value={params.sort} hasQuery={!!params.q} onChange={(sort) => update({ sort })} className="sm:hidden [&_select]:h-11 [&_select]:rounded-full [&_select]:text-xs [&_select]:min-w-[150px]" />
      </div>

      <section className="overflow-hidden rounded-[22px] border border-brand/10 bg-gradient-to-r from-brand-soft to-[#FFF1E6]" aria-label="Same-day availability">
        <div className="flex items-center gap-3 px-4 py-3 md:px-5">
          <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-white text-brand shadow-sm"><ShieldCheck className="h-5 w-5" aria-hidden="true" /></span>
          <div className="min-w-0 flex-1">
            <p className="text-sm font-semibold text-ink">Need it done today?</p>
            <p className="text-xs text-muted">Filter by availability and find services ready for your preferred time.</p>
          </div>
          <button
            type="button"
            aria-pressed={params.availability === "today"}
            onClick={() => update({ availability: params.availability === "today" ? undefined : "today" })}
            className={clsx("hidden min-h-11 shrink-0 items-center justify-center rounded-full bg-brand px-4 text-xs font-semibold text-white transition hover:bg-[#3730A3] sm:inline-flex", FOCUS_RING)}
          >
            {params.availability === "today" ? "Showing available today" : "Show available today"} <ArrowRight className="ml-1.5 h-3.5 w-3.5" aria-hidden="true" />
          </button>
        </div>
      </section>

      <div id="all-services" className="scroll-mt-24">
        {results}
      </div>

      <FilterDrawer
        open={drawerOpen && !isDesktop}
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

