import { useEffect, useMemo, useState } from "react";
import { Link, useSearchParams } from "react-router-dom";
import { ChevronRight, Search } from "lucide-react";
import { customerPath } from "@/routes/customerPath";
import { FOCUS_RING } from "@/components/customer/focusRing";
import { SERVICES, CATEGORIES } from "@/mocks/customerMockData";

export default function Services() {
  const [searchParams, setSearchParams] = useSearchParams();

  // Live, as-you-type filtering. Seeded from ?q= (e.g. arriving from the Dashboard
  // search bar), and kept in sync back to the URL (via replace, so typing doesn't
  // spam browser history) so the filtered view stays bookmarkable/shareable.
  const [query, setQuery] = useState(searchParams.get("q") ?? "");

  useEffect(() => {
    const id = setTimeout(() => {
      setSearchParams(query ? { q: query } : {}, { replace: true });
    }, 0);
    return () => clearTimeout(id);
    // eslint-disable-next-line react-hooks/exhaustive-deps -- only mirror `query` into the URL, not the other way
  }, [query]);

  const q = query.trim().toLowerCase();
  const services = useMemo(() => {
    if (!q) return SERVICES;
    return SERVICES.filter((s) => {
      const category = CATEGORIES.find((c) => c.id === s.categoryId);
      return s.name.toLowerCase().includes(q) || category?.name.toLowerCase().includes(q);
    });
  }, [q]);

  return (
    <div className="space-y-4">
      <div>
        <h1 className="text-xl font-semibold text-ink">Services</h1>
        <p className="text-muted text-sm mt-1">Transparent pricing, duration, and ratings for every service.</p>
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
        <p className="text-muted text-sm py-8 text-center">No services match "{query}".</p>
      ) : (
        <div className="grid sm:grid-cols-2 gap-4">
          {services.map((s) => {
            const category = CATEGORIES.find((c) => c.id === s.categoryId);
            return (
              // The whole card is the "Book now" affordance — /customer/book/:serviceSlug
              // is the booking-flow route (owned by Ravi's N-booking module). This link
              // already uses the agreed slug format, so it will work as soon as that
              // route merges — until then it resolves to "Page not found".
              <Link
                key={s.id}
                to={customerPath(`/book/${s.slug}`)}
                className={`group bg-panel border border-line rounded p-4 flex items-start gap-3 hover:border-brand transition-colors ${FOCUS_RING}`}
              >
                <div className="text-2xl">{category?.icon}</div>
                <div className="flex-1 min-w-0">
                  <div className="font-medium text-ink truncate">{s.name}</div>
                  <div className="text-xs text-muted mt-0.5 truncate">{category?.name} · {s.duration}</div>
                  <div className="flex items-center justify-between mt-3">
                    <span className="text-xs text-muted">⭐ {s.rating} ({s.reviewCount.toLocaleString()})</span>
                    <span className="font-semibold text-ink">₹{s.price}</span>
                  </div>
                  <div className="flex items-center gap-0.5 mt-2 text-sm font-medium text-brand">
                    Book now
                    <ChevronRight className="h-4 w-4 transition-transform group-hover:translate-x-0.5" aria-hidden="true" />
                  </div>
                </div>
              </Link>
            );
          })}
        </div>
      )}
    </div>
  );
}
