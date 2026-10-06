import { Link } from "react-router-dom";
import clsx from "clsx";
import { customerPath } from "@/routes/customerPath";
import { FOCUS_RING } from "@/components/customer/focusRing";
import { Icon3D, tintAt } from "@/components/customer";
import type { DashboardCategoryDto } from "@/features/customer";

/** Shown instead of the booking-related sections when a customer has never booked. */
export default function NewCustomerEmptyState({ categories }: { categories: DashboardCategoryDto[] }) {
  return (
    <div className="rounded-[20px] border border-dashed border-brand/25 bg-white px-6 py-10 text-center shadow-[0_9px_26px_rgba(30,27,46,.05)]">
      <Icon3D hints={["🎉"]} size={72} className="mx-auto" />
      <h2 className="mt-3 text-lg font-semibold text-ink">Welcome to HomeCareX!</h2>
      <p className="mx-auto mt-1 max-w-sm text-sm text-muted">
        You haven't booked a service yet. Pick a category below to get started.
      </p>
      <div className="mx-auto mt-5 grid max-w-md grid-cols-3 gap-3 text-center">
        {categories.slice(0, 3).map((c, i) => (
          <Link
            key={c.id}
            to={customerPath("/services")}
            className={clsx("group rounded-2xl p-3 transition-transform duration-300 hover:-translate-y-1", tintAt(i), FOCUS_RING)}
          >
            <Icon3D hints={[c.icon, c.name, c.slug]} size={44} delay={i * -0.8} className="mx-auto" />
            <div className="mt-1.5 truncate text-xs font-medium text-ink">{c.name}</div>
          </Link>
        ))}
      </div>
      <Link
        to={customerPath("/categories")}
        className={`mt-5 inline-block rounded-full bg-brand px-5 py-2.5 text-sm font-semibold text-white transition-transform hover:scale-[1.03] ${FOCUS_RING}`}
      >
        Browse all categories
      </Link>
    </div>
  );
}
