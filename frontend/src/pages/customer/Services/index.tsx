import { useEffect, useMemo, useState } from "react";
import { Link, useSearchParams } from "react-router-dom";
import { Search } from "lucide-react";
import { customerPath } from "@/routes/customerPath";
import { FOCUS_RING } from "@/components/customer/focusRing";
import BookLink from "@/components/customer/BookLink";
import { EmptyState } from "@/components/customer";
import { SERVICES, CATEGORIES } from "@/mocks/customerMockData";

export default function Services() {
  const [searchParams, setSearchParams] = useSearchParams();
  const categoryId = searchParams.get("category");
  const activeCategory = CATEGORIES.find((c) => c.id === categoryId);

  // Live, as-you-type filtering. Seeded from ?q= (e.g. arriving from the Dashboard
  // search bar), and kept in sync back to the URL (via replace, so typing doesn't
  // spam browser history) so the filtered view stays bookmarkable/shareable.
  const [query, setQuery] = useState(searchParams.get("q") ?? "");

  useEffect(() => {
    const id = setTimeout(() => {
      const next: Record<string, string> = {};
      if (activeCategory) next.category = activeCategory.id;
      if (query) next.q = query;
      setSearchParams(next, { replace: true });
    }, 0);
    return () => clearTimeout(id);
    // eslint-disable-next-line react-hooks/exhaustive-deps -- only mirror `query` into the URL, not the other way
  }, [query]);

  const q = query.trim().toLowerCase();
  const services = useMemo(() => {
    const inCategory = activeCategory ? SERVICES.filter((s) => s.categoryId === activeCategory.id) : SERVICES;
    if (!q) return inCategory;
    return inCategory.filter((s) => {
      const category = CATEGORIES.find((c) => c.id === s.categoryId);
      return s.name.toLowerCase().includes(q) || category?.name.toLowerCase().includes(q);
    });
  }, [q, activeCategory]);

  return (
    <div className="space-y-4">
      <div>
        <h1 className="text-xl font-semibold text-ink">{activeCategory ? activeCategory.name : "Services"}</h1>
        <p className="text-muted text-sm mt-1">Transparent pricing, duration, and ratings for every service.</p>
        {activeCategory && (
          <Link
            to={customerPath("/services")}
            className={`mt-2 inline-flex min-h-[44px] items-center text-sm font-medium text-brand hover:underline ${FOCUS_RING}`}
          >
            ← Show all services
          </Link>
        )}
      </div>

      <div className="relative">
        <label htmlFor="services-search" className="sr-only">
          Search services
        </label>
        <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted" aria-hidden="true" />
        <input
          id="services-search"
          type="search"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="Search for a service, e.g. AC repair"
          className={`w-full rounded border border-line bg-panel py-2.5 pl-9 pr-3 text-sm text-ink placeholder:text-muted ${FOCUS_RING}`}
        />
      </div>

      {q && (
        <p className="text-xs text-muted" aria-live="polite">
          {services.length} {services.length === 1 ? "result" : "results"} for "{query}"
        </p>
      )}

      {services.length === 0 ? (
        q ? (
          <p className="text-muted text-sm py-8 text-center">No services match "{query}".</p>
        ) : (
          <EmptyState title="No services here yet" description="Check back soon or browse another category." />
        )
      ) : (
        <div className="grid sm:grid-cols-2 gap-4">
          {services.map((s) => {
            const category = CATEGORIES.find((c) => c.id === s.categoryId);
            return (
              <div key={s.id} className="bg-panel border border-line rounded p-4 flex items-start gap-3">
                <div className="text-2xl" aria-hidden="true">{category?.icon}</div>
                <div className="flex-1 min-w-0">
                  <div className="font-medium text-ink">{s.name}</div>
                  <div className="text-xs text-muted mt-0.5">{category?.name} · {s.duration}</div>
                  <div className="flex items-center justify-between mt-3">
                    <span className="text-xs text-muted">⭐ {s.rating} ({s.reviewCount.toLocaleString()})</span>
                    <span className="font-semibold text-ink">₹{s.price}</span>
                  </div>
                  <BookLink slug={s.slug} serviceName={s.name} className="mt-3 w-full" />
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
