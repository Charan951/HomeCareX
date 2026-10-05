import { useEffect, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { CalendarDays, CalendarRange, Clock, IndianRupee, Wallet } from "lucide-react";
import type { LucideIcon } from "lucide-react";
import ErrorState from "@/components/common/ErrorState";
import OfflineState from "@/components/common/OfflineState";
import Skeleton from "@/components/common/Skeleton";
import { useOnlineStatus } from "@/hooks/useOnlineStatus";
import { earningsApi } from "@/services/earningsApi";
import type { ApiError } from "@/lib/http";
import type { EarningsSummary } from "@/types/earnings";
import "./Earnings.css";
import EarningsHistory from "./EarningsHistory";
import { inr } from "./earningsFormat";



/** Counts up from 0 to `target` once. Skipped if the user prefers reduced motion. */
function useCountUp(target: number, durationMs = 800): number {
  const [value, setValue] = useState(0);
  useEffect(() => {
    if (target === 0 || window.matchMedia("(prefers-reduced-motion: reduce)").matches) {
      setValue(target);
      return;
    }
    let frame = 0;
    const startedAt = performance.now();
    const tick = (now: number) => {
      const t = Math.min((now - startedAt) / durationMs, 1);
      setValue(target * (1 - Math.pow(1 - t, 3)));
      if (t < 1) frame = requestAnimationFrame(tick);
    };
    frame = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(frame);
  }, [target, durationMs]);
  return value;
}

function Money({ value, className }: { value: number; className: string }) {
  const animated = useCountUp(value);
  return (
    <p className={className} aria-label={inr(value)}>
      {inr(Math.round(animated * 100) / 100)}
    </p>
  );
}

interface PeriodCardProps {
  label: string;
  hint: string;
  value: number;
  base: number; // largest of the three periods, used to size the bar
  caption: string;
  icon: LucideIcon;
  delay: number;
}

function PeriodCard({ label, hint, value, base, caption, icon: Icon, delay }: PeriodCardProps) {
  const pct = base > 0 ? Math.round((value / base) * 100) : 0;
  return (
    <div className="earn-period" style={{ animationDelay: `${delay}ms` }}>
      <div className="earn-period-head">
        <span className="earn-chip">
          <Icon size={20} aria-hidden />
        </span>
        <div>
          <p className="earn-period-label">{label}</p>
          <p className="earn-period-hint">{hint}</p>
        </div>
      </div>
      <Money value={value} className="earn-period-value" />
      <div className="earn-meter" aria-hidden>
        <div className="earn-meter-fill" style={{ width: `${pct}%`, animationDelay: `${delay + 200}ms` }} />
      </div>
      <p className="earn-period-caption">{caption}</p>
    </div>
  );
}

function SummarySkeleton() {
  return (
    <div className="earn-stack" role="status" aria-label="Loading earnings">
      <Skeleton className="earn-skel earn-skel--hero" />
      <div className="earn-periods">
        {[0, 1, 2].map((i) => (
          <Skeleton key={i} className="earn-skel earn-skel--period" />
        ))}
      </div>
    </div>
  );
}

const isEmpty = (s: EarningsSummary) => s.total === 0 && s.pending === 0;

export default function PartnerEarningsPage() {
  const networkOnline = useOnlineStatus();
  const { data, isPending, isError, error, refetch } = useQuery<EarningsSummary, ApiError>({
    queryKey: ["partner", "earnings", "summary"],
    queryFn: earningsApi.getSummary,
    retry: 1,
  });

  let body;
  if (!data && !networkOnline) {
    body = <OfflineState onRetry={() => void refetch()} />;
  } else if (isPending) {
    body = <SummarySkeleton />;
  } else if (isError || !data) {
    body = <ErrorState message={error?.message} onRetry={() => void refetch()} />;
  } else {
    const paidOut = Math.max(0, data.total - data.pending);
    const paidPct = data.total > 0 ? Math.round((paidOut / data.total) * 100) : 0;
    const base = Math.max(data.today, data.week, data.month);
    const pctOfMonth = (v: number) => (data.month > 0 ? Math.round((v / data.month) * 100) : 0);

    body = (
      <div className="earn-stack">
        {/* Hero: total earned + pending payout */}
        <section className="earn-hero" aria-label="Earnings overview">
          <div className="earn-hero-main">
            <p className="earn-eyebrow">
              <Wallet size={16} aria-hidden /> Total earned
            </p>
            <Money value={data.total} className="earn-hero-value" />
            <p className="earn-pill">
              <IndianRupee size={14} aria-hidden /> All time, after commission
            </p>
          </div>

          <div className="earn-hero-side">
            <div className="earn-bubbles" aria-hidden>
              {[0, 1, 2, 3, 4, 5].map((i) => (
                <span key={i} className={`earn-bubble earn-bubble--${i}`} />
              ))}
            </div>
            <p className="earn-eyebrow earn-eyebrow--light">
              <Clock size={16} aria-hidden /> Pending payout
            </p>
            <Money value={data.pending} className="earn-side-value" />
            <div
              className="earn-progress"
              role="progressbar"
              aria-label="Share of earnings already paid out"
              aria-valuemin={0}
              aria-valuemax={100}
              aria-valuenow={paidPct}
            >
              <div className="earn-progress-fill" style={{ width: `${paidPct}%` }} />
            </div>
            <p className="earn-side-text">
              {data.total > 0 ? `${paidPct}% paid out · ${inr(paidOut)} settled` : "Nothing to pay out yet"}
            </p>
          </div>
        </section>

        {/* Periods */}
        <h2 className="earn-section">
          <CalendarDays size={16} aria-hidden /> By period
        </h2>
        <div className="earn-periods">
          <PeriodCard
            label="Today"
            hint="Since midnight"
            value={data.today}
            base={base}
            caption={data.month > 0 ? `${pctOfMonth(data.today)}% of this month` : "No earnings today"}
            icon={IndianRupee}
            delay={150}
          />
          <PeriodCard
            label="This week"
            hint="Since Monday"
            value={data.week}
            base={base}
            caption={data.month > 0 ? `${pctOfMonth(data.week)}% of this month` : "No earnings this week"}
            icon={CalendarDays}
            delay={230}
          />
          <PeriodCard
            label="This month"
            hint="Since the 1st"
            value={data.month}
            base={base}
            caption={data.month > 0 ? "Month to date" : "No earnings this month"}
            icon={CalendarRange}
            delay={310}
          />
        </div>

        {isEmpty(data) && (
          <p className="earn-empty" style={{ animationDelay: "400ms" }}>
            No earnings yet. They appear here as soon as you complete your first job.
          </p>
        )}
      </div>
    );
  }

  return (
    <div className="earn-page">
      <h1 className="earn-sr-only">Earnings</h1>
      <p className="earn-subtitle">Track what you have earned and what is waiting to be paid out</p>
      {body}
      {data && <EarningsHistory />}
    </div>
  );
}