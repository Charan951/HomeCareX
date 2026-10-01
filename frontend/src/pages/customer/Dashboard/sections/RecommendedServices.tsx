import { Link } from "react-router-dom";
import { customerPath } from "@/routes/customerPath";
import { FOCUS_RING } from "@/components/customer/focusRing";
import type { Category, Service } from "@/mocks/customerMockData";

interface RecommendedServicesProps {
  services: Service[];
  categories: Category[];
}

/**
 * Horizontally-scrolling "recommended for you" row. Links straight into the
 * booking flow at /customer/book/:serviceSlug (Ravi's N-booking module) using
 * the agreed slug format — resolves to "Page not found" until that route merges.
 */
export default function RecommendedServices({ services, categories }: RecommendedServicesProps) {
  return (
    <div className="-mx-4 flex gap-3 overflow-x-auto px-4 pb-1 sm:mx-0 sm:px-0">
      {services.map((s) => {
        const category = categories.find((c) => c.id === s.categoryId);
        return (
          <Link
            key={s.id}
            to={customerPath(`/book/${s.slug}`)}
            className={`w-44 shrink-0 rounded border border-line bg-panel p-3 hover:border-brand ${FOCUS_RING}`}
          >
            <div className="text-2xl">{category?.icon}</div>
            <div className="mt-2 truncate text-sm font-medium text-ink">{s.name}</div>
            <div className="mt-0.5 flex items-center justify-between text-xs text-muted">
              <span>⭐ {s.rating}</span>
              <span className="font-medium text-ink">₹{s.price}</span>
            </div>
          </Link>
        );
      })}
    </div>
  );
}
