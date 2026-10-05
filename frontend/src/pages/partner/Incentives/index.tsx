import { useEffect, useRef, useState } from "react";
import type { ReactNode } from "react";
import { Link } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { ArrowLeft, CalendarClock, Check, CheckCircle2, Clock, Gift, SlidersHorizontal, Sparkles } from "lucide-react";
import type { LucideIcon } from "lucide-react";
import ErrorState from "@/components/common/ErrorState";
import OfflineState from "@/components/common/OfflineState";
import Skeleton from "@/components/common/Skeleton";
import { useOnlineStatus } from "@/hooks/useOnlineStatus";
import { incentivesApi } from "@/services/incentivesApi";
import type { ApiError } from "@/lib/http";
import type { Incentive, IncentivesList } from "@/types/incentives";
import IncentiveCard from "./IncentiveCard";
import { inr } from "./incentivesFormat";
import "./Incentives.css";

type Filter = "all" | "active" | "upcoming" | "completed" | "expired";
type SectionKey = Exclude<Filter, "all">;
type Counts = Record<Filter, number>;

const FILTERS: { key: Filter; label: string }[] = [
  { key: "all", label: "All" },
  { key: "active", label: "Active" },
  { key: "upcoming", label: "Upcoming" },
  { key: "completed", label: "Completed" },
  { key: "expired", label: "Ended" },
];

const NO_COUNTS: Counts = { all: 0, active: 0, upcoming: 0, completed: 0, expired: 0 };

const buildCounts = (d: IncentivesList): Counts => ({
  all: d.active.length + d.upcoming.length + d.completed.length + d.expired.length,
  active: d.active.length,
  upcoming: d.upcoming.length,
  completed: d.completed.length,
  expired: d.expired.length,
});

function Stat({
  label,
  value,
  hint,
  icon: Icon,
  tone,
}: {
  label: string;
  value: string;
  hint: string;
  icon: LucideIcon;
  tone: "green" | "blue" | "indigo";
}) {
  return (
    <div className={`inc-stat inc-stat--${tone}`}>
      <span className="inc-stat-icon">
        <Icon size={20} aria-hidden />
      </span>
      <div>
        <p className="inc-stat-label">{label}</p>
        <p className="inc-stat-value">{value}</p>
        <p className="inc-stat-hint">{hint}</p>
      </div>
    </div>
  );
}

/** Filter button (top right). Click it to open the list; the chosen option filters the campaigns. */
function FilterMenu({
  value,
  onChange,
  counts,
  className = "",
}: {
  value: Filter;
  onChange: (f: Filter) => void;
  counts: Counts;
  className?: string;
}) {
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!open) return;
    const onPointer = (e: MouseEvent | TouchEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    };
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") setOpen(false);
    };
    document.addEventListener("mousedown", onPointer);
    document.addEventListener("touchstart", onPointer);
    document.addEventListener("keydown", onKey);
    return () => {
      document.removeEventListener("mousedown", onPointer);
      document.removeEventListener("touchstart", onPointer);
      document.removeEventListener("keydown", onKey);
    };
  }, [open]);

  const current = FILTERS.find((f) => f.key === value) ?? FILTERS[0];

  return (
    <div className={`inc-filter ${className}`.trim()} ref={ref}>
      <button
        type="button"
        className="inc-filter-btn"
        aria-haspopup="listbox"
        aria-expanded={open}
        aria-label={`Filter campaigns, showing ${current.label}`}
        onClick={() => setOpen((o) => !o)}
      >
        <SlidersHorizontal size={18} aria-hidden />
      </button>

      {open && (
        <div className="inc-menu" role="listbox" aria-label="Filter campaigns">
          {FILTERS.map((f) => (
            <button
              key={f.key}
              type="button"
              role="option"
              aria-selected={value === f.key}
              className={`inc-menu-item${value === f.key ? " is-on" : ""}`}
              onClick={() => {
                onChange(f.key);
                setOpen(false);
              }}
            >
              <span className="inc-menu-check">{value === f.key && <Check size={15} aria-hidden />}</span>
              <span className="inc-menu-label">{f.label}</span>
              <span className="inc-menu-count">{counts[f.key]}</span>
            </button>
          ))}
        </div>
      )}
    </div>
  );
}

interface SectionProps {
  title: string;
  icon: LucideIcon;
  items: Incentive[];
  /** Shown when the list is empty. Sections without one are hidden when empty. */
  emptyText?: string;
  startDelay: number;
  /** Shown at the right end of the title row (the Filter button). */
  action?: ReactNode;
}

function Section({ title, icon: Icon, items, emptyText, startDelay, action }: SectionProps) {
  if (items.length === 0 && !emptyText) return null;
  return (
    <section className="inc-section" aria-label={title}>
      <div className="inc-section-head">
        <h2 className="inc-section-title">
          <Icon size={16} aria-hidden /> {title} <span className="inc-count">{items.length}</span>
        </h2>
        {action}
      </div>
      {items.length === 0 ? (
        <p className="inc-empty">{emptyText}</p>
      ) : (
        <div className="inc-grid">
          {items.map((i, idx) => (
            <IncentiveCard key={i.id} incentive={i} delay={startDelay + idx * 70} />
          ))}
        </div>
      )}
    </section>
  );
}

function ListSkeleton() {
  return (
    <div className="inc-stack" role="status" aria-label="Loading incentives">
      <div className="inc-stats">
        {[0, 1, 2].map((i) => (
          <Skeleton key={i} className="inc-skel inc-skel--stat" />
        ))}
      </div>
      <div className="inc-grid">
        {[0, 1].map((i) => (
          <Skeleton key={i} className="inc-skel inc-skel--card" />
        ))}
      </div>
    </div>
  );
}

const hasNothing = (d: IncentivesList) => buildCounts(d).all === 0;

export default function PartnerIncentivesPage() {
  const networkOnline = useOnlineStatus();
  // null = the user has not picked a filter yet, so the default comes from the data.
  const [picked, setPicked] = useState<Filter | null>(null);
  const { data, isPending, isError, error, refetch } = useQuery<IncentivesList, ApiError>({
    queryKey: ["partner", "incentives"],
    queryFn: incentivesApi.getList,
    retry: 1,
  });

  const counts = data ? buildCounts(data) : NO_COUNTS;
  // Default: Active. If there are no active campaigns, fall back to All.
  const filter: Filter = picked ?? (counts.active > 0 ? "active" : "all");

  let body;
  if (!data && !networkOnline) {
    body = <OfflineState onRetry={() => void refetch()} />;
  } else if (isPending) {
    body = <ListSkeleton />;
  } else if (isError || !data) {
    body = <ErrorState message={error?.message} onRetry={() => void refetch()} />;
  } else if (hasNothing(data)) {
    body = (
      <div className="inc-blank">
        <Sparkles size={28} aria-hidden />
        <h2>No incentive campaigns yet</h2>
        <p>When a new campaign opens, it shows up here with your progress. Keep completing jobs in the meantime.</p>
      </div>
    );
  } else {
    const show = (k: SectionKey) => filter === "all" || filter === k;
    const empty = (k: SectionKey, text: string) => (filter === k ? text : undefined);

    const sections = [
      { key: "active" as const, title: "Active campaigns", icon: Clock, items: data.active, emptyText: empty("active", "No active campaigns right now.") },
      { key: "upcoming" as const, title: "Upcoming", icon: CalendarClock, items: data.upcoming, emptyText: empty("upcoming", "No upcoming campaigns.") },
      { key: "completed" as const, title: "Completed", icon: CheckCircle2, items: data.completed, emptyText: empty("completed", "No completed campaigns yet.") },
      { key: "expired" as const, title: "Ended", icon: Clock, items: data.expired, emptyText: empty("expired", "No ended campaigns.") },
    ].filter((sec) => show(sec.key) && (sec.items.length > 0 || sec.emptyText));

    // The Filter button (icon only) sits beside the first section title, on every screen size.
    const filterMenu = <FilterMenu value={filter} onChange={setPicked} counts={counts} />;

    body = (
      <div className="inc-layout">
        <aside className="inc-side" aria-label="Summary">
          <div className="inc-stats">
            <Stat label="Rewards earned" value={inr(data.summary.rewardEarned)} hint="Total paid out" icon={Gift} tone="green" />
            <Stat label="Active" value={String(data.summary.activeCount)} hint="Live right now" icon={Clock} tone="blue" />
            <Stat label="Upcoming" value={String(data.summary.upcomingCount)} hint="Starting soon" icon={CalendarClock} tone="indigo" />
          </div>
        </aside>

        <div className="inc-main">
          {sections.map((sec, idx) => (
            <Section
              key={sec.key}
              title={sec.title}
              icon={sec.icon}
              items={sec.items}
              emptyText={sec.emptyText}
              startDelay={0}
              action={idx === 0 ? filterMenu : undefined}
            />
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="inc-page">
      <header className="inc-topbar">
        <Link to="/partner" className="inc-back" aria-label="Back to Home">
          <ArrowLeft size={20} aria-hidden />
        </Link>
        <h1 className="inc-title">Incentives</h1>
      </header>
      {body}
    </div>
  );
}