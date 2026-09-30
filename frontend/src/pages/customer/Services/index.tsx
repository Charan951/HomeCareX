import { Link, useSearchParams } from "react-router-dom";
import { SERVICES, CATEGORIES } from "../../../mocks/customerMockData";
import { customerPath } from "@/routes/customerPath";
import { FOCUS_RING } from "@/components/customer/focusRing";
import BookLink from "@/components/customer/BookLink";
import { EmptyState } from "@/components/customer";

export default function Services() {
  const [searchParams] = useSearchParams();
  const categoryId = searchParams.get("category");
  const activeCategory = CATEGORIES.find((c) => c.id === categoryId);
  const visible = activeCategory ? SERVICES.filter((s) => s.categoryId === activeCategory.id) : SERVICES;

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

      {visible.length === 0 ? (
        <EmptyState title="No services here yet" description="Check back soon or browse another category." />
      ) : (
        <div className="grid sm:grid-cols-2 gap-4">
          {visible.map((s) => {
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
