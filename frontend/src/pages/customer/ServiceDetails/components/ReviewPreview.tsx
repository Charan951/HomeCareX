import { useEffect, useState } from "react";
import { BadgeCheck, Loader2, MessageSquareText, Star } from "lucide-react";
import clsx from "clsx";
import { EmptyState, ErrorState, OfflineState } from "@/components/customer";
import { FOCUS_RING } from "@/components/customer/focusRing";
import { Skeleton } from "@/components/customer/Skeleton";
import { useInView } from "@/hooks/useInView";
import { useOnlineStatus } from "@/hooks/useOnlineStatus";
import { useServiceReviews } from "@/hooks/useServiceReviews";
import type { ReviewSummary, ServiceReview } from "@/types/catalog";
import { cssVars, formatReviewDate, initialOf, prefersReducedMotion } from "../format";
import Stars from "./Stars";

const AVATAR_TINTS = ["bg-[#ECEBFB] text-brand", "bg-[#FFEADB] text-[#C2410C]", "bg-[#E4F4EC] text-[#15803D]", "bg-[#FDE7F0] text-[#BE185D]", "bg-[#E3F0FC] text-[#1D4ED8]"];
const STARS = ["5", "4", "3", "2", "1"] as const;

/** Counts up to `value` once `start` is true (instantly when motion is reduced). */
function CountUp({ value, start }: { value: number; start: boolean }) {
  const [shown, setShown] = useState(0);
  useEffect(() => {
    if (!start) return;
    if (prefersReducedMotion()) {
      setShown(value);
      return;
    }
    const t0 = performance.now();
    let raf = 0;
    const tick = (now: number) => {
      const p = Math.min(1, (now - t0) / 900);
      setShown(value * (1 - Math.pow(1 - p, 3)));
      if (p < 1) raf = requestAnimationFrame(tick);
    };
    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
  }, [start, value]);
  return <>{shown.toFixed(1)}</>;
}

function Summary({ summary, seen }: { summary: ReviewSummary; seen: boolean }) {
  return (
    <div className="grid gap-6 rounded-3xl border border-line bg-panel p-5 md:grid-cols-[200px_minmax(0,1fr)] md:items-center md:gap-8 md:p-6">
      <div className="flex items-center gap-4 md:flex-col md:items-start md:gap-2">
        <p className="text-[56px] font-bold leading-none tracking-tight text-ink tabular-nums">
          <CountUp value={summary.average} start={seen} />
        </p>
        <div>
          <Stars value={summary.average} size={18} />
          <p className="mt-1 text-sm text-muted">Based on {summary.count.toLocaleString("en-IN")} {summary.count === 1 ? "review" : "reviews"}</p>
        </div>
      </div>
      <ul className="space-y-2" aria-label="Reviews by star rating">
        {STARS.map((star, i) => {
          const n = summary.distribution[star];
          const pct = summary.count > 0 ? (n / summary.count) * 100 : 0;
          return (
            <li key={star} className="flex items-center gap-3 text-sm">
              <span className="flex w-8 shrink-0 items-center gap-1 font-semibold text-ink">
                {star}
                <Star className="h-3.5 w-3.5 fill-accent text-accent" aria-hidden="true" />
              </span>
              <span className="h-2.5 min-w-0 flex-1 overflow-hidden rounded-full bg-line/70">
                <span className="sd-bar block h-full rounded-full bg-gradient-to-r from-accent to-[#FFB27A]" style={cssVars({ "--w": `${pct}%`, "--i": i })} />
              </span>
              <span className="w-10 shrink-0 text-right tabular-nums text-muted">
                <span className="sr-only">{n} reviews</span>
                <span aria-hidden="true">{n.toLocaleString("en-IN")}</span>
              </span>
            </li>
          );
        })}
      </ul>
    </div>
  );
}

function ReviewCard({ review: r, index }: { review: ServiceReview; index: number }) {
  return (
    <li className="rounded-3xl border border-line bg-panel p-5">
      <div className="flex items-start gap-3">
        <span className={clsx("flex h-11 w-11 shrink-0 items-center justify-center rounded-full text-base font-bold", AVATAR_TINTS[index % AVATAR_TINTS.length])} aria-hidden="true">
          {initialOf(r.author)}
        </span>
        <div className="min-w-0 flex-1">
          <div className="flex flex-wrap items-center gap-x-2.5 gap-y-1">
            <p className="text-sm font-semibold text-ink">{r.author}</p>
            {r.verified && (
              <span className="inline-flex items-center gap-1 rounded-full bg-[#E4F4EC] px-2 py-0.5 text-[11px] font-semibold text-[#15803D]">
                <BadgeCheck className="h-3.5 w-3.5" aria-hidden="true" />
                Verified booking
              </span>
            )}
          </div>
          <div className="mt-1 flex items-center gap-2">
            <Stars value={r.rating} size={14} />
            <time dateTime={r.createdAt} className="text-xs text-muted">
              {formatReviewDate(r.createdAt)}
            </time>
          </div>
        </div>
      </div>
      <p className="mt-3 whitespace-pre-line break-words text-sm leading-7 text-ink/80">{r.comment}</p>
    </li>
  );
}

function ReviewsSkeleton() {
  return (
    <div role="status" aria-label="Loading reviews" className="space-y-4">
      <Skeleton className="h-44 rounded-3xl" />
      <Skeleton className="h-32 rounded-3xl" />
      <Skeleton className="h-32 rounded-3xl" />
    </div>
  );
}

/** Average, count per star, and a few verified-tagged comments with "Show more". Fails on its own without blanking the page. */
export default function ReviewPreview({ serviceId }: { serviceId: string }) {
  const q = useServiceReviews(serviceId);
  const online = useOnlineStatus();
  const [ref, seen] = useInView<HTMLDivElement>(0.2);

  const pages = q.data?.pages ?? [];
  const summary = pages[0]?.summary;
  const reviews = pages.flatMap((p) => p.reviews);
  const total = pages[0]?.meta.total ?? 0;

  let body;
  if (q.isPending) {
    body = <ReviewsSkeleton />;
  } else if (q.isError && !q.data) {
    body =
      !online || q.error.code === "NETWORK_ERROR" ? (
        <OfflineState message="Reviews will load once you're back online." onRetry={() => void q.refetch()} />
      ) : (
        <ErrorState title="We couldn't load reviews" message={q.error.message} onRetry={() => void q.refetch()} />
      );
  } else if (!summary || summary.count === 0) {
    body = <EmptyState icon={MessageSquareText} title="No reviews yet" description="Reviews appear here after customers complete a booking of this service." />;
  } else {
    body = (
      <div ref={ref} className={clsx("space-y-4", seen && "sd-in")}>
        <Summary summary={summary} seen={seen} />
        <ul className="grid gap-4 lg:grid-cols-2">
          {reviews.map((r, i) => (
            <ReviewCard key={r.id} review={r} index={i} />
          ))}
        </ul>
        <div className="flex flex-col items-center gap-2 pt-1" aria-live="polite">
          <p className="text-xs text-muted">
            Showing {reviews.length.toLocaleString("en-IN")} of {total.toLocaleString("en-IN")}
          </p>
          {q.hasNextPage && (
            <button
              type="button"
              onClick={() => void q.fetchNextPage()}
              disabled={q.isFetchingNextPage}
              className={clsx("inline-flex min-h-[48px] items-center gap-2 rounded-full border border-line bg-panel px-6 text-sm font-semibold text-ink transition-colors hover:border-brand hover:text-brand disabled:opacity-60", FOCUS_RING)}
            >
              {q.isFetchingNextPage && <Loader2 className="h-4 w-4 animate-spin" aria-hidden="true" />}
              {q.isFetchingNextPage ? "Loading…" : "Show more reviews"}
            </button>
          )}
          {q.isFetchNextPageError && <p role="alert" className="text-sm text-danger">Couldn&apos;t load more reviews. Try again.</p>}
        </div>
      </div>
    );
  }

  return (
    <section id="reviews" aria-labelledby="reviews-title" className="scroll-mt-40">
      <h2 id="reviews-title" className="mb-4 text-xl font-bold tracking-tight text-ink md:text-2xl">
        Customer reviews
      </h2>
      {body}
    </section>
  );
}
