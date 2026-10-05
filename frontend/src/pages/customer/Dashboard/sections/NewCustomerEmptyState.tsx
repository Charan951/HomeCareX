import { Link } from "react-router-dom";
import { PartyPopper } from "lucide-react";
import { customerPath } from "@/routes/customerPath";
import { FOCUS_RING } from "@/components/customer/focusRing";
import type { DashboardCategoryDto } from "@/features/customer";
import CategoryIcon from "./CategoryIcon";

/** Shown instead of the booking-related sections when a customer has never booked. */
export default function NewCustomerEmptyState({ categories }: { categories: DashboardCategoryDto[] }) {
  return (
    <div className="rounded border border-dashed border-line bg-panel px-6 py-10 text-center">
      <PartyPopper className="mx-auto h-8 w-8 text-brand" aria-hidden="true" />
      <h2 className="mt-3 font-semibold text-ink">Welcome to HomeCareX!</h2>
      <p className="mx-auto mt-1 max-w-sm text-sm text-muted">
        You haven't booked a service yet. Pick a category below to get started.
      </p>
      <div className="mx-auto mt-5 grid max-w-sm grid-cols-2 gap-3 text-left sm:grid-cols-3">
        {categories.slice(0, 3).map((c) => (
          <Link
            key={c.id}
            to={customerPath("/services")}
            className={`rounded border border-line bg-canvas p-3 hover:border-brand ${FOCUS_RING}`}
          >
            <div className="text-xl">
              <CategoryIcon icon={c.icon} />
            </div>
            <div className="mt-1 truncate text-xs font-medium text-ink">{c.name}</div>
          </Link>
        ))}
      </div>
      <Link
        to={customerPath("/categories")}
        className={`mt-5 inline-block rounded bg-brand px-4 py-2 text-sm font-medium text-white hover:opacity-90 ${FOCUS_RING}`}
      >
        Browse all categories
      </Link>
    </div>
  );
}
