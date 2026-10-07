import { Link } from "react-router-dom";
import { Clock3, Star } from "lucide-react";
import clsx from "clsx";
import { FOCUS_RING } from "@/components/customer/focusRing";
import { formatDuration } from "@/components/customer/catalog/format";
import { customerPath } from "@/routes/customerPath";
import type { ServiceDetail } from "@/types/catalog";
import { cssVars } from "../format";
import AvailabilityBadge from "./AvailabilityBadge";
import ShareButton from "./ShareButton";

/**
 * Phone layout: the service info sits straight under the gallery with no card around it.
 * The only Book now button on phones is the sticky bar (StickyCTA), so this block has none.
 */
export default function MobileInfo({ service: s }: { service: ServiceDetail }) {
  const jumpToReviews = () => {
    const el = document.getElementById("reviews");
    el?.scrollIntoView({ behavior: window.matchMedia("(prefers-reduced-motion: reduce)").matches ? "auto" : "smooth", block: "start" });
  };

  return (
    <div className="md:hidden">
      <div className="sd-rise flex items-center justify-between gap-3" style={cssVars({ "--i": 1 })}>
        <Link
          to={`${customerPath("/services")}?category=${encodeURIComponent(s.category.slug)}`}
          className={clsx("inline-flex min-h-[32px] items-center rounded-full bg-brand-soft px-3 text-xs font-semibold text-brand transition-colors hover:bg-brand hover:text-white", FOCUS_RING)}
        >
          {s.category.name}
        </Link>
        <ShareButton title={s.name} />
      </div>

      <h1 className="sd-rise mt-2 text-xl font-bold leading-tight tracking-tight text-ink" style={cssVars({ "--i": 2 })}>
        {s.name}
      </h1>

      <div className="sd-rise mt-1.5 flex flex-wrap items-center gap-x-2 gap-y-1 text-sm text-muted" style={cssVars({ "--i": 3 })}>
        {s.ratingCount > 0 ? (
          <>
            <Star className="h-4 w-4 fill-accent text-accent" aria-hidden="true" />
            <span className="font-bold text-ink">{s.rating.toFixed(1)}</span>
            <span aria-hidden="true">·</span>
            <button type="button" onClick={jumpToReviews} className={clsx("rounded underline decoration-line underline-offset-4 hover:text-brand hover:decoration-brand", FOCUS_RING)}>
              {s.ratingCount.toLocaleString("en-IN")} {s.ratingCount === 1 ? "review" : "reviews"}
            </button>
          </>
        ) : (
          <span>New service</span>
        )}
        <span aria-hidden="true">·</span>
        <span className="inline-flex items-center gap-1">
          <Clock3 className="h-4 w-4" aria-hidden="true" />
          {formatDuration(s.durationMinutes)}
        </span>
      </div>

      <AvailabilityBadge availability={s.slotAvailability} className="sd-rise mt-3" />
    </div>
  );
}
