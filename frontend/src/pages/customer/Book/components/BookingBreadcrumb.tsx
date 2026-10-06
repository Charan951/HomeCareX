import { Link } from "react-router-dom";
import { ChevronRight } from "lucide-react";
import clsx from "clsx";
import { FOCUS_RING } from "@/components/customer/focusRing";
import { customerPath } from "@/routes/customerPath";

/** Services › {service} › Book: the same trail as the service details page, so the customer can step back out. */
export default function BookingBreadcrumb({ slug, name }: { slug: string; name: string }) {
  const sep = (
    <li aria-hidden="true" className="shrink-0">
      <ChevronRight className="h-4 w-4" />
    </li>
  );
  return (
    <nav aria-label="Breadcrumb" className="min-w-0">
      <ol className="flex items-center gap-1.5 text-sm text-muted">
        <li className="shrink-0">
          <Link to={customerPath("/services")} className={clsx("rounded hover:text-brand", FOCUS_RING)}>
            Services
          </Link>
        </li>
        {sep}
        <li className="min-w-0 truncate">
          <Link to={customerPath(`/services/${slug}`)} className={clsx("rounded hover:text-brand", FOCUS_RING)}>
            {name}
          </Link>
        </li>
        {sep}
        <li aria-current="page" className="shrink-0 font-medium text-ink">
          Book
        </li>
      </ol>
    </nav>
  );
}
