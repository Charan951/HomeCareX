import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { CalendarCheck, Check, Clock3, Share2 } from "lucide-react";
import clsx from "clsx";
import { FOCUS_RING } from "@/components/customer/focusRing";
import { formatDuration } from "@/components/customer/catalog/format";
import { customerPath } from "@/routes/customerPath";
import { formatPrice } from "@/pages/customer/Shared/visuals";
import type { ServiceDetail } from "@/types/catalog";
import { bookingHref, cssVars } from "../format";
import AvailabilityBadge from "./AvailabilityBadge";
import Stars from "./Stars";

/** Name, rating, "starting at" price, duration, availability and the main Book now button. */
export default function ServiceInfo({ service: s }: { service: ServiceDetail }) {
  const [shareNote, setShareNote] = useState<string | null>(null);

  useEffect(() => {
    if (!shareNote) return;
    const t = window.setTimeout(() => setShareNote(null), 2200);
    return () => window.clearTimeout(t);
  }, [shareNote]);

  const share = async () => {
    const url = window.location.href;
    try {
      if (navigator.share) {
        await navigator.share({ title: s.name, url });
      } else {
        await navigator.clipboard.writeText(url);
        setShareNote("Link copied");
      }
    } catch {
      /* Share sheet dismissed, or clipboard blocked: nothing to report. */
    }
  };

  const jumpToReviews = () => {
    const el = document.getElementById("reviews");
    el?.scrollIntoView({ behavior: window.matchMedia("(prefers-reduced-motion: reduce)").matches ? "auto" : "smooth", block: "start" });
  };

  return (
    <div className="rounded-3xl border border-line bg-panel p-4 shadow-[0_24px_50px_-38px_rgba(67,56,202,.55)] md:p-5 xl:p-6">
      <div className="sd-rise flex items-start justify-between gap-3" style={cssVars({ "--i": 1 })}>
        <Link
          to={`${customerPath("/services")}?category=${encodeURIComponent(s.category.slug)}`}
          className={clsx("inline-flex min-h-[32px] items-center rounded-full bg-brand-soft px-3 text-xs font-semibold text-brand transition-colors hover:bg-brand hover:text-white", FOCUS_RING)}
        >
          {s.category.name}
        </Link>
        <div className="relative">
          <button
            type="button"
            onClick={() => void share()}
            aria-label={`Share ${s.name}`}
            className={clsx("flex h-10 w-10 items-center justify-center rounded-full border border-line text-ink transition-colors hover:border-brand hover:text-brand", FOCUS_RING)}
          >
            {shareNote ? <Check className="h-[18px] w-[18px] text-[#16A34A]" aria-hidden="true" /> : <Share2 className="h-[18px] w-[18px]" aria-hidden="true" />}
          </button>
          <span role="status" className={clsx("absolute right-0 top-12 z-10 whitespace-nowrap rounded-lg bg-ink px-2.5 py-1 text-xs font-medium text-white shadow-lg transition-opacity", shareNote ? "opacity-100" : "pointer-events-none opacity-0")}>
            {shareNote ?? ""}
          </span>
        </div>
      </div>

      <h1 className="sd-rise mt-2.5 text-lg font-bold leading-tight tracking-tight text-ink md:text-[22px]" style={cssVars({ "--i": 2 })}>
        {s.name}
      </h1>

      <div className="sd-rise mt-2 flex flex-wrap items-center gap-x-2 gap-y-1" style={cssVars({ "--i": 3 })}>
        {s.ratingCount > 0 ? (
          <>
            <Stars value={s.rating} size={15} />
            <span className="text-sm font-bold text-ink">{s.rating.toFixed(1)}</span>
            <button type="button" onClick={jumpToReviews} className={clsx("rounded text-sm text-muted underline decoration-line underline-offset-4 hover:text-brand hover:decoration-brand", FOCUS_RING)}>
              {s.ratingCount.toLocaleString("en-IN")} {s.ratingCount === 1 ? "review" : "reviews"}
            </button>
          </>
        ) : (
          <span className="text-sm text-muted">New service. No reviews yet.</span>
        )}
      </div>

      {/* Ticket: price on the left, duration on the right, torn along a dashed edge. */}
      <div className="sd-rise relative mt-4 flex items-stretch rounded-2xl xl:mt-5 bg-brand-soft" style={cssVars({ "--i": 4 })}>
        <div className="min-w-0 flex-1 px-3.5 py-2.5 xl:px-4 xl:py-3">
          <p className="text-xs font-medium text-muted">Starting at</p>
          <p className="mt-0.5 text-xl font-bold leading-none tracking-tight text-ink">{formatPrice(s.basePrice)}</p>
        </div>
        <div className="relative self-stretch border-l-2 border-dashed border-brand/30" aria-hidden="true">
          <span className="absolute -left-[9px] -top-2 h-4 w-4 rounded-full bg-panel" />
          <span className="absolute -bottom-2 -left-[9px] h-4 w-4 rounded-full bg-panel" />
        </div>
        <div className="flex shrink-0 flex-col items-center justify-center gap-0.5 px-4 py-2.5 xl:px-6">
          <Clock3 className="h-4 w-4 text-brand" aria-hidden="true" />
          <p className="text-sm font-semibold text-ink">{formatDuration(s.durationMinutes)}</p>
        </div>
      </div>

      <AvailabilityBadge availability={s.slotAvailability} className="sd-rise mt-2.5" />

      <Link
        to={bookingHref(s.slug)}
        aria-label={`Book ${s.name}`}
        className={clsx(
          "sd-shine sd-rise relative mt-3 flex min-h-[46px] w-full xl:mt-5 xl:min-h-[48px] items-center justify-center gap-2 overflow-hidden rounded-full bg-brand px-6 text-sm font-bold text-white shadow-[0_14px_28px_-14px_rgba(67,56,202,.8)] transition-all hover:bg-[#3730A3] motion-safe:active:scale-[.98]",
          FOCUS_RING,
        )}
        style={cssVars({ "--i": 6 })}
      >
        <CalendarCheck className="h-4 w-4" aria-hidden="true" />
        Book now
      </Link>
      <p className="mt-2 text-center text-[11px] text-muted">Pick your date, time and add-ons in the next steps.</p>
    </div>
  );
}
