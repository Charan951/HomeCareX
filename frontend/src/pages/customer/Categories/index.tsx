import { useMemo, useState } from "react";
import { Link } from "react-router-dom";
import { Headset, LayoutGrid } from "lucide-react";
import clsx from "clsx";
import { customerPath } from "@/routes/customerPath";
import { EmptyState, ErrorState, OfflineState } from "@/components/customer";
import { FOCUS_RING } from "@/components/customer/focusRing";
import { CategoryGrid, CategorySearch, CategorySkeleton, MostBooked, plural } from "@/components/customer/catalog";
import { useCategories } from "@/hooks/useCategories";
import { useOnlineStatus } from "@/hooks/useOnlineStatus";

/**
 * Categories: live from GET /categories (active only, in the order admins set). Search filters by
 * name and description. Each card opens the Services page pre-filtered to that category.
 */
export default function Categories() {
  const [query, setQuery] = useState("");
  const { data, isPending, isError, error, refetch } = useCategories();
  const online = useOnlineStatus();

  const q = query.trim().toLowerCase();
  const categories = useMemo(
    () => (data ?? []).filter((c) => !q || c.name.toLowerCase().includes(q) || c.description.toLowerCase().includes(q)),
    [data, q],
  );
  const totalServices = useMemo(() => (data ?? []).reduce((sum, c) => sum + c.serviceCount, 0), [data]);

  let body;
  if (isPending) {
    body = <CategorySkeleton />;
  } else if (isError || !data) {
    body =
      !online || error?.code === "NETWORK_ERROR" ? (
        <OfflineState onRetry={() => void refetch()} />
      ) : (
        <ErrorState title="We couldn't load categories" message={error?.message} onRetry={() => void refetch()} />
      );
  } else if (data.length === 0) {
    body = <EmptyState icon={LayoutGrid} title="No categories yet" description="New service categories are on the way. Please check back soon." />;
  } else if (categories.length === 0) {
    body = (
      <EmptyState
        title={`No categories match "${query.trim()}"`}
        description="Try a different word, or tell us what you need and we'll arrange it."
        action={
          <button type="button" onClick={() => setQuery("")} className={clsx("min-h-[44px] rounded-full bg-brand px-5 text-sm font-semibold text-white", FOCUS_RING)}>
            Clear search
          </button>
        }
      />
    );
  } else {
    body = <CategoryGrid categories={categories} />;
  }

  return (
    <div className="mx-auto w-full min-w-0 max-w-[1200px] space-y-5 md:space-y-6">
      <div className="flex flex-col gap-4 md:flex-row md:items-end md:justify-between">
        <header>
          <h1 className="text-2xl font-bold tracking-tight text-ink">Categories</h1>
          <p className="mt-1 text-sm text-muted">
            <span className="md:hidden">What do you need done today?</span>
            <span className="hidden md:inline">Pick what you need done. Trusted, verified professionals at your door.</span>
          </p>
          {data && data.length > 0 && (
            <p className="mt-2 text-xs font-medium text-brand" aria-live="polite">
              {plural(data.length, "category", "categories")} · {plural(totalServices, "service")}
            </p>
          )}
        </header>
        <CategorySearch value={query} onChange={setQuery} className="md:w-[380px] md:shrink-0" />
      </div>

      {body}

      {!q && data && data.length > 0 && <MostBooked />}

      <section className="flex flex-col gap-3 rounded-[22px] bg-gradient-to-br from-[#3730A3] via-brand to-[#6558E8] p-4 text-white shadow-[0_18px_36px_-16px_rgba(67,56,202,.6)] sm:flex-row sm:items-center sm:justify-between md:p-5">
        <div className="flex items-center gap-3">
          <span aria-hidden="true" className="flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl bg-white/15 ring-1 ring-white/25">
            <Headset className="h-5 w-5" />
          </span>
          <div>
            <h2 className="text-sm font-semibold md:text-base">Can't find what you need?</h2>
            <p className="text-xs text-white/75 md:text-[13px]">Tell us and we'll arrange a professional.</p>
          </div>
        </div>
        <Link
          to={customerPath("/support")}
          className={clsx(
            "inline-flex h-11 items-center justify-center rounded-full bg-accent px-5 text-sm font-semibold text-[#3A1A00] transition-transform motion-safe:hover:-translate-y-0.5 motion-safe:active:scale-95",
            FOCUS_RING,
          )}
        >
          Contact support
        </Link>
      </section>
    </div>
  );
}
