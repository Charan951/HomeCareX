import { useMemo, useState, type ReactNode } from "react";
import { useQuery } from "@tanstack/react-query";
import { Link } from "react-router-dom";
import { Plus } from "lucide-react";
import clsx from "clsx";
import { bookingApi, type NormalizedApiError } from "@/services/bookingApi";
import { EmptyState, ErrorState, LoadingState } from "@/components/customer";
import { FOCUS_RING } from "@/components/customer/focusRing";
import { NO_SCROLLBAR } from "@/components/customer/noScrollbar";
import { PaymentResult } from "@/components/customer/payments";
import { canPayOnline, usePayBooking } from "@/features/payments";
import { customerPath } from "@/routes/customerPath";
import type { BookingView } from "@/types/booking";
import {
  BTN_OUTLINE,
  BTN_PRIMARY,
  HistoryList,
  HistoryRow,
  LiveCard,
  SectionHeading,
  UpcomingCard,
} from "./BookingCards";
import {
  cancelNote,
  getBookingCode,
  getBookingId,
  getServiceName,
  getTotal,
  phaseOf,
  rupees,
  whenKey,
  type BookingListItem,
  type Phase,
} from "./bookingModel";

type TabId = "all" | Phase;

const TABS: { id: TabId; label: string }[] = [
  { id: "all", label: "All" },
  { id: "live", label: "Live" },
  { id: "upcoming", label: "Upcoming" },
  { id: "completed", label: "Completed" },
  { id: "cancelled", label: "Cancelled" },
];

/** Section order, used by the "All" tab; a single tab just shows its own section. */
const SECTIONS: { phase: Phase; title: string }[] = [
  { phase: "live", title: "Happening now" },
  { phase: "upcoming", title: "Coming up" },
  { phase: "completed", title: "Completed" },
  { phase: "cancelled", title: "Cancelled" },
];

const EMPTY_COPY: Record<TabId, { title: string; description: string }> = {
  all: {
    title: "No bookings yet",
    description:
      "Book a service and you can follow it here from confirmation to completion.",
  },
  live: {
    title: "Nothing happening right now",
    description:
      "When a partner is on the way or working, you can follow it live here.",
  },
  upcoming: {
    title: "No upcoming bookings",
    description: "Services you've scheduled will show up here.",
  },
  completed: {
    title: "No completed bookings",
    description: "Finished services will show up here.",
  },
  cancelled: {
    title: "No cancelled bookings",
    description: "Cancelled bookings and their refunds will show up here.",
  },
};

type Grouped = Record<Phase, BookingListItem[]>;

export default function MyBookingsPage() {
  const [selectedTab, setSelectedTab] = useState<TabId | null>(null);
  const { state: payState, pay, reset, busy: payBusy } = usePayBooking();

  const { data, isLoading, isError, error, refetch } = useQuery<
    BookingView[],
    NormalizedApiError
  >({
    queryKey: ["customer-bookings"],
    queryFn: () => bookingApi.getBookings(),
  });

  // Sort into sections once per fetch. `now` is shared so every card agrees on what has expired.
  const { grouped, now } = useMemo(() => {
    const nowMs = Date.now();
    const groups: Grouped = {
      live: [],
      upcoming: [],
      completed: [],
      cancelled: [],
    };
    for (const b of (data ?? []) as unknown as BookingListItem[]) {
      const phase = phaseOf(b, nowMs);
      if (phase) groups[phase].push(b);
    }
    // Soonest first for what's still to come; history keeps the API's newest-first order.
    groups.live.sort((a, b) => whenKey(a).localeCompare(whenKey(b)));
    groups.upcoming.sort((a, b) => whenKey(a).localeCompare(whenKey(b)));
    return { grouped: groups, now: nowMs };
  }, [data]);

  const counts: Record<TabId, number> = {
    all:
      grouped.live.length +
      grouped.upcoming.length +
      grouped.completed.length +
      grouped.cancelled.length,
    live: grouped.live.length,
    upcoming: grouped.upcoming.length,
    completed: grouped.completed.length,
    cancelled: grouped.cancelled.length,
  };

  // Until the customer picks a tab: lead with what's live, otherwise show everything.
  const activeTab: TabId = selectedTab ?? (counts.live > 0 ? "live" : "all");
  const ready = !isLoading && !isError;
  const visible = SECTIONS.filter(
    (s) =>
      (activeTab === "all" || activeTab === s.phase) &&
      grouped[s.phase].length > 0,
  );

  /** Pay-now strip and the payment result for one booking. Kept here so payment state lives in one place. */
  const renderFooter = (b: BookingListItem): ReactNode => {
    const id = getBookingId(b);
    const payable = canPayOnline(b, now);
    const result =
      payState.bookingId === id && payState.phase !== "idle" ? payState : null;
    if (!payable && !result) return null;

    const name = getServiceName(b);
    const thisBusy =
      result?.phase === "pending" || result?.phase === "processing";
    const retry = result?.phase === "failed" || result?.phase === "cancelled";
    const awaitingPayment = b.status === "pending_payment";

    return (
      <>
        {payable && (
          <div className="flex flex-wrap items-center justify-between gap-3 px-4 py-3 sm:px-5">
            <p className="text-sm text-muted">
              {awaitingPayment ? "Payment pending" : "Cash on service"} ·{" "}
              <span className="font-semibold text-ink">
                {rupees(getTotal(b))}
              </span>{" "}
              due
            </p>
            <button
              type="button"
              onClick={() => void pay(id)}
              disabled={payBusy}
              className={clsx(
                "inline-flex min-h-[44px] items-center justify-center rounded-xl bg-brand px-5 text-sm font-semibold text-white transition-opacity hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-60",
                FOCUS_RING,
              )}
            >
              {thisBusy ? "Please wait…" : retry ? "Try again" : "Pay now"}
              <span className="sr-only">
                {" "}
                for {name}, {getBookingCode(b)}
              </span>
            </button>
          </div>
        )}
        {result && result.phase !== "idle" && (
          <div className="px-4 pb-4 pt-1 sm:px-5">
            <PaymentResult
              phase={result.phase}
              message={result.message}
              actions={
                !thisBusy && (
                  <button
                    type="button"
                    onClick={reset}
                    className={clsx(
                      "min-h-[44px] rounded border border-line bg-white px-3 text-sm font-medium text-ink hover:bg-canvas",
                      FOCUS_RING,
                    )}
                  >
                    Dismiss
                  </button>
                )
              }
            />
          </div>
        )}
      </>
    );
  };

  const renderSection = (phase: Phase, title: string) => {
    const items = grouped[phase];
    const headingId = `bookings-${phase}`;
    return (
      <section key={phase} aria-labelledby={headingId} className="space-y-3">
        <SectionHeading id={headingId} title={title} count={items.length} />

        {phase === "live" && (
          <div className="space-y-4">
            {items.map((b, i) => (
              <LiveCard
                key={getBookingId(b)}
                booking={b}
                now={now}
                index={i}
                footer={renderFooter(b)}
              />
            ))}
          </div>
        )}

        {phase === "upcoming" && (
          <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
            {items.map((b, i) => (
              <UpcomingCard
                key={getBookingId(b)}
                booking={b}
                now={now}
                index={i}
                footer={renderFooter(b)}
              />
            ))}
          </div>
        )}

        {(phase === "completed" || phase === "cancelled") && (
          <HistoryList labelledBy={headingId}>
            {items.map((b, i) => (
              <HistoryRow
                key={getBookingId(b)}
                booking={b}
                now={now}
                index={i}
                footer={renderFooter(b)}
                actionLabel={phase === "completed" ? "Book again" : "Rebook"}
                note={phase === "cancelled" ? cancelNote(b, now) : undefined}
              />
            ))}
          </HistoryList>
        )}
      </section>
    );
  };

  return (
    <div className="mx-auto w-full max-w-6xl">
      {/* Header */}
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <h1 className="text-[28px] font-bold leading-tight tracking-tight text-ink">
            Bookings
          </h1>
          <p className="mt-1 text-sm text-muted">
            Track what&apos;s happening now, what&apos;s next and what&apos;s
            done.
          </p>
        </div>
        <Link to={customerPath("/services")} className={BTN_PRIMARY}>
          <Plus
            className="mr-1.5 h-4 w-4"
            strokeWidth={2.5}
            aria-hidden="true"
          />
          Book a service
        </Link>
      </div>

      {/* Tabs */}
      <nav
        aria-label="Booking filters"
        className={clsx(
          "mt-6 overflow-x-auto border-b border-line",
          NO_SCROLLBAR,
        )}
      >
        <ul className="flex min-w-max gap-6 sm:gap-8">
          {TABS.map((tab) => {
            const isActive = activeTab === tab.id;
            return (
              <li key={tab.id}>
                <button
                  type="button"
                  onClick={() => setSelectedTab(tab.id)}
                  aria-current={isActive ? "true" : undefined}
                  className={clsx(
                    "-mb-px flex items-center gap-2 whitespace-nowrap border-b-2 px-0.5 pb-3 text-sm font-medium transition-colors",
                    isActive
                      ? "border-brand text-brand"
                      : "border-transparent text-muted hover:text-ink",
                    FOCUS_RING,
                  )}
                >
                  {tab.id === "live" && (
                    <span className="relative flex h-2 w-2" aria-hidden="true">
                      {counts.live > 0 && (
                        <span className="absolute inline-flex h-full w-full rounded-full bg-accent opacity-60 motion-safe:animate-ping" />
                      )}
                      <span className="relative inline-flex h-2 w-2 rounded-full bg-accent" />
                    </span>
                  )}
                  {tab.label}
                  {ready && (
                    <span
                      className={clsx(
                        "rounded-full px-2 py-0.5 text-xs font-medium",
                        isActive
                          ? "bg-brand-soft text-brand"
                          : "bg-canvas text-muted",
                      )}
                    >
                      {counts[tab.id]}
                    </span>
                  )}
                </button>
              </li>
            );
          })}
        </ul>
      </nav>

      {/* Content */}
      <div className="mt-6 space-y-8">
        {isLoading && <LoadingState label="Loading your bookings…" />}

        {isError && (
          <ErrorState
            title="Couldn't load bookings"
            message={error?.message || "Failed to fetch bookings from server"}
            onRetry={() => void refetch()}
          />
        )}

        {ready && visible.length === 0 && (
          <EmptyState
            title={EMPTY_COPY[activeTab].title}
            description={EMPTY_COPY[activeTab].description}
            action={
              activeTab === "all" || activeTab === "upcoming" ? (
                <Link to={customerPath("/services")} className={BTN_OUTLINE}>
                  Book a service
                </Link>
              ) : undefined
            }
          />
        )}

        {ready && visible.map((s) => renderSection(s.phase, s.title))}
      </div>
    </div>
  );
}
