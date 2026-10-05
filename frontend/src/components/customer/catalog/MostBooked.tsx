import { useRef } from "react";
import { Link } from "react-router-dom";
import { ChevronLeft, ChevronRight, Star } from "lucide-react";
import clsx from "clsx";
import { customerPath } from "@/routes/customerPath";
import { formatPrice, serviceVisual } from "@/pages/customer/Shared/visuals";
import { useServices } from "@/hooks/useServices";
import Icon3D from "../Icon3D";
import { FOCUS_RING } from "../focusRing";
import { NO_SCROLLBAR } from "../noScrollbar";
import { Skeleton } from "../Skeleton";
import { formatDuration } from "./format";

const PARAMS = { sort: "popular", page: 1, limit: 8 } as const;

/** Swipeable row of the most popular services. Renders nothing if there are none or loading fails. */
export function MostBooked() {
  const { data, isPending } = useServices(PARAMS);
  const rail = useRef<HTMLUListElement>(null);
  const scroll = (dir: 1 | -1) => rail.current?.scrollBy({ left: dir * 480, behavior: "smooth" });

  if (isPending) {
    return (
      <section aria-hidden="true" className="space-y-3">
        <Skeleton className="h-7 w-52 rounded-lg" />
        <div className="flex gap-3.5 overflow-hidden">
          {[0, 1, 2, 3].map((i) => (
            <Skeleton key={i} className="h-52 w-[232px] shrink-0 rounded-[22px]" />
          ))}
        </div>
      </section>
    );
  }
  const items = data?.items ?? [];
  if (items.length === 0) return null;

  return (
    <section aria-labelledby="most-booked" className="min-w-0 space-y-3">
      <div className="flex items-center justify-between">
        <h2 id="most-booked" className="text-lg font-bold tracking-tight text-ink md:text-xl">
          Most booked services
        </h2>
        <div className="hidden gap-1.5 md:flex">
          {([-1, 1] as const).map((d) => (
            <button
              key={d}
              type="button"
              onClick={() => scroll(d)}
              aria-label={d === -1 ? "Scroll back" : "Scroll forward"}
              className={clsx("flex h-9 w-9 items-center justify-center rounded-full border border-line bg-panel text-ink hover:bg-canvas", FOCUS_RING)}
            >
              {d === -1 ? <ChevronLeft className="h-4 w-4" aria-hidden="true" /> : <ChevronRight className="h-4 w-4" aria-hidden="true" />}
            </button>
          ))}
        </div>
      </div>

      <ul ref={rail} className={clsx("relative flex snap-x snap-mandatory gap-3.5 overflow-x-auto overscroll-x-contain p-1 pb-3", NO_SCROLLBAR)}>
        {items.map((s, i) => {
          const v = serviceVisual(s.slug, s.category.slug);
          return (
            <li key={s.id} className="relative w-[232px] shrink-0 snap-start">
              <Link
                to={customerPath(`/book/${s.slug}`)}
                className={clsx(
                  "group block h-full rounded-[22px] border border-line bg-panel p-2 transition-shadow duration-200 hover:shadow-[0_18px_30px_-18px_rgba(67,56,202,.5)]",
                  FOCUS_RING,
                )}
              >
                <div className={clsx("relative flex h-32 items-center justify-center overflow-hidden rounded-[16px]", v.tint)}>
                  {v.image ? (
                    <img src={v.image} alt="" loading="lazy" decoding="async" className="absolute inset-0 h-full w-full object-cover" />
                  ) : (
                    <Icon3D hints={[s.icon, s.name, s.category.slug]} size={72} delay={i * 0.5} />
                  )}
                </div>
                <h3 className="mx-1.5 mt-2.5 line-clamp-1 text-sm font-semibold text-ink">{s.name}</h3>
                <p className="mx-1.5 mt-0.5 flex items-center gap-1 text-[13px] text-muted">
                  <Star className="h-3.5 w-3.5 fill-accent text-accent" aria-hidden="true" />
                  <span className="sr-only">Rated </span>
                  {s.rating.toFixed(1)} ({s.ratingCount.toLocaleString("en-IN")})
                </p>
                <p className="mx-1.5 mb-1.5 mt-0.5 text-[13px] text-muted">
                  <span className="font-bold text-ink">{formatPrice(s.basePrice)}</span> · {formatDuration(s.durationMinutes)}
                </p>
              </Link>
            </li>
          );
        })}
      </ul>
    </section>
  );
}
