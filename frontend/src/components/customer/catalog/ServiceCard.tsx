import { Link } from "react-router-dom";
import { ArrowUpRight, Clock3, Star } from "lucide-react";
import clsx from "clsx";
import { customerPath } from "@/routes/customerPath";
import { Icon3D, formatPrice, serviceVisual } from "@/pages/customer/Shared/visuals";
import type { CatalogService } from "@/types/catalog";
import { FOCUS_RING } from "../focusRing";
import { formatDuration } from "./format";

const badgeFor = (s: CatalogService): string | null => {
  if (s.rating >= 4.8 && s.ratingCount >= 500) return "Top rated";
  if (s.ratingCount >= 1000) return "Popular";
  return null;
};

const AVAILABILITY_LABEL: Record<CatalogService["availability"], string | null> = {
  today: "Available today",
  tomorrow: "By tomorrow",
  scheduled: null,
};

export function ServiceCard({ service: s, index }: { service: CatalogService; index: number }) {
  const v = serviceVisual(s.slug, s.category.slug);
  const badge = badgeFor(s);
  const when = AVAILABILITY_LABEL[s.availability];

  return (
    <Link
      to={customerPath(`/book/${s.slug}`)}
      style={{ animationDelay: `${Math.min(index * 55, 330)}ms` }}
      className={clsx(
        "service-card-enter group flex h-full flex-col overflow-hidden rounded-[24px] border border-line bg-panel p-2 transition-all duration-300 sm:p-2.5",
        "hover:-translate-y-1 hover:border-brand/25 hover:shadow-[0_22px_45px_-26px_rgba(67,56,202,.6)] motion-safe:active:scale-[.99]",
        FOCUS_RING,
      )}
    >
      <div className={clsx("relative flex h-40 w-full shrink-0 items-center justify-center overflow-hidden rounded-[19px] sm:h-44", v.tint)}>
        {v.image ? (
          <img
            src={v.image}
            alt=""
            loading={index < 3 ? "eager" : "lazy"}
            decoding="async"
            style={{ objectPosition: v.focus }}
            className="absolute inset-0 h-full w-full object-cover transition-transform duration-700 group-hover:scale-[1.045]"
          />
        ) : null}
        <div className={clsx("absolute inset-0", v.image ? "bg-gradient-to-t from-black/20 via-transparent to-white/10" : "bg-white/0")} aria-hidden="true" />
        <div className="absolute -right-8 -top-10 h-28 w-28 rounded-full bg-white/40 blur-2xl transition-transform duration-500 group-hover:scale-125" aria-hidden="true" />
        {badge && (
          <span className="absolute left-3 top-3 z-10 rounded-full border border-white/80 bg-white/90 px-2.5 py-1 text-[10px] font-bold text-[#B45309] shadow-sm backdrop-blur">
            {badge}
          </span>
        )}
        {!v.image && (
          <Icon3D
            asset={v.asset}
            emoji={s.icon}
            delayMs={index * 500}
            className="relative z-[1] h-24 w-24 transition-transform duration-500 group-hover:scale-110 group-hover:rotate-[-4deg]"
          />
        )}
        {when && (
          <span className="absolute bottom-3 left-3 z-10 inline-flex items-center gap-1.5 rounded-full bg-[#166534]/90 px-2.5 py-1 text-[10.5px] font-medium text-white shadow-sm backdrop-blur">
            <span className="h-1.5 w-1.5 rounded-full bg-[#86EFAC]" aria-hidden="true" />
            {when}
          </span>
        )}
        <span className="absolute bottom-3 right-3 flex h-8 w-8 items-center justify-center rounded-full bg-white/90 text-brand shadow-sm backdrop-blur transition-transform duration-300 group-hover:translate-x-0.5 group-hover:-translate-y-0.5">
          <ArrowUpRight className="h-4 w-4" aria-hidden="true" />
        </span>
      </div>

      <div className="flex min-w-0 flex-1 flex-col px-1.5 pb-1 pt-3">
        <div className="flex items-start justify-between gap-2">
          <div className="min-w-0">
            <h2 className="line-clamp-2 text-[15px] font-bold leading-5 text-ink">{s.name}</h2>
            <p className="mt-1 truncate text-xs text-muted">{s.category.name}</p>
          </div>
        </div>

        <div className="mt-3 flex flex-wrap items-center gap-x-3 gap-y-1.5 text-xs text-ink/70">
          <span className="inline-flex items-center gap-1 font-semibold text-ink">
            <Star className="h-3.5 w-3.5 fill-accent text-accent" aria-hidden="true" />
            {s.ratingCount > 0 ? s.rating.toFixed(1) : "New"}
            {s.ratingCount > 0 && <span className="font-normal text-muted">({s.ratingCount.toLocaleString("en-IN")})</span>}
          </span>
          <span className="inline-flex items-center gap-1 text-muted">
            <Clock3 className="h-3.5 w-3.5" aria-hidden="true" />
            {formatDuration(s.durationMinutes)}
          </span>
        </div>

        <div className="mt-auto flex items-end justify-between gap-3 pt-4">
          <div>
            <p className="text-[10px] font-medium uppercase tracking-wide text-muted">Starting at</p>
            <p className="mt-0.5 text-lg font-bold tracking-tight text-ink">{formatPrice(s.basePrice)}</p>
          </div>
          <span className="rounded-full bg-brand px-4 py-2 text-xs font-bold text-white shadow-sm transition-all duration-200 group-hover:bg-[#3730A3] group-hover:shadow-md">
            Book now
          </span>
        </div>
      </div>
    </Link>
  );
}
