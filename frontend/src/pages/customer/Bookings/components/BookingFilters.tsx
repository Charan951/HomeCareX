import { useEffect, useRef, useState } from "react";
import { SlidersHorizontal } from "lucide-react";
import clsx from "clsx";
import { useDebouncedCallback } from "@/hooks/useDebouncedCallback";
import { FOCUS_RING } from "@/components/customer/focusRing";
import type { BookingSort, BookingTab } from "@/types/bookingList";
import { SORT_OPTIONS, STATUS_OPTIONS, isSort } from "../bookingTabs";

export const FILTER_PANEL_ID = "booking-filter-panel";

/* ------------------------------------------------------------------ */
/* Filter icon button (goes at the right of the tabs)                  */
/* ------------------------------------------------------------------ */

export function FilterToggle({
  open,
  activeCount,
  onToggle,
}: {
  open: boolean;
  /** How many filters are set; shown as a small badge. */
  activeCount: number;
  onToggle: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onToggle}
      aria-expanded={open}
      aria-controls={FILTER_PANEL_ID}
      aria-label={
        activeCount > 0 ? `Filters, ${activeCount} active` : "Filters"
      }
      className={clsx(
        "relative flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl border transition-colors",
        open || activeCount > 0
          ? "border-brand bg-brand-soft text-brand"
          : "border-line bg-panel text-ink hover:bg-canvas",
        FOCUS_RING,
      )}
    >
      <SlidersHorizontal className="h-[18px] w-[18px]" aria-hidden="true" />
      {activeCount > 0 && (
        <span
          aria-hidden="true"
          className="absolute -right-1.5 -top-1.5 flex h-[18px] min-w-[18px] items-center justify-center rounded-full bg-brand px-1 text-[10px] font-bold leading-none text-white"
        >
          {activeCount}
        </span>
      )}
    </button>
  );
}

/* ------------------------------------------------------------------ */
/* Filter panel                                                        */
/* ------------------------------------------------------------------ */

interface Props {
  tab: BookingTab;
  status: string;
  date: string;
  service: string;
  sort: BookingSort;
  hasFilters: boolean;
  /** Panel is shown only when true. It stays mounted so a half-typed service name is not lost. */
  open: boolean;
  onChange: (patch: {
    status?: string;
    date?: string;
    service?: string;
    sort?: BookingSort;
  }) => void;
  onClear: () => void;
}

const FIELD = clsx(
  "h-11 w-full rounded-xl border border-line bg-white px-3 text-sm text-ink placeholder:text-muted",
  FOCUS_RING,
);
const LABEL = "mb-1 block text-xs font-medium text-muted";

/** Status (this tab's own statuses), service date, service, and sort. Booking ID lives in the search box. */
export function BookingFilters({
  tab,
  status,
  date,
  service,
  sort,
  hasFilters,
  open,
  onChange,
  onClear,
}: Props) {
  const [serviceText, setServiceText] = useState(service);
  const sent = useRef(service);
  /** What is in the box right now, so a late pause-timer for older text is ignored. */
  const latest = useRef(service);
  const commitService = useDebouncedCallback((v: string) => {
    const trimmed = v.trim();
    if (v !== latest.current || trimmed === sent.current) return;
    sent.current = trimmed;
    onChange({ service: trimmed });
  }, 350);

  useEffect(() => {
    if (service === sent.current) return;
    sent.current = service;
    latest.current = service;
    setServiceText(service);
  }, [service]);

  return (
    <section
      id={FILTER_PANEL_ID}
      aria-label="Filter bookings"
      hidden={!open}
      className={clsx(
        "grid-cols-2 gap-3 rounded-2xl border border-line bg-[#f8f9fc] p-4 lg:grid-cols-4",
        open ? "grid" : "hidden",
      )}
    >
      <div>
        <label htmlFor="booking-filter-status" className={LABEL}>
          Status
        </label>
        <select
          id="booking-filter-status"
          value={status}
          onChange={(e) => onChange({ status: e.target.value })}
          className={FIELD}
        >
          <option value="">All statuses</option>
          {STATUS_OPTIONS[tab].map((o) => (
            <option key={o.value} value={o.value}>
              {o.label}
            </option>
          ))}
        </select>
      </div>

      <div>
        <label htmlFor="booking-filter-date" className={LABEL}>
          Service date
        </label>
        <input
          id="booking-filter-date"
          type="date"
          value={date}
          onChange={(e) => onChange({ date: e.target.value })}
          className={FIELD}
        />
      </div>

      <div className="col-span-2 lg:col-span-1">
        <label htmlFor="booking-filter-service" className={LABEL}>
          Service
        </label>
        <input
          id="booking-filter-service"
          type="text"
          value={serviceText}
          maxLength={100}
          autoComplete="off"
          placeholder="e.g. AC repair"
          onChange={(e) => {
            latest.current = e.target.value;
            setServiceText(e.target.value);
            commitService(e.target.value);
          }}
          className={FIELD}
        />
      </div>

      <div className="col-span-2 lg:col-span-1">
        <label htmlFor="booking-filter-sort" className={LABEL}>
          Sort by
        </label>
        <select
          id="booking-filter-sort"
          value={sort}
          onChange={(e) => {
            if (isSort(e.target.value)) onChange({ sort: e.target.value });
          }}
          className={FIELD}
        >
          {SORT_OPTIONS.map((o) => (
            <option key={o.value} value={o.value}>
              {o.label}
            </option>
          ))}
        </select>
      </div>

      {hasFilters && (
        <div className="col-span-2 lg:col-span-4">
          <button
            type="button"
            onClick={onClear}
            className={clsx(
              "min-h-[44px] rounded-xl px-2 text-sm font-semibold text-brand hover:underline",
              FOCUS_RING,
            )}
          >
            Clear filters
          </button>
        </div>
      )}
    </section>
  );
}
