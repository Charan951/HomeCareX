import { useEffect, type ReactNode } from "react";
import { ArrowLeft, ArrowRight, CalendarDays, Clock3, MapPin, ShieldCheck, Sparkles } from "lucide-react";
import clsx from "clsx";
import { useQuery } from "@tanstack/react-query";
import { todayISO, useBookingDraftStore } from "@/features/booking";
import { bookingApi, type NormalizedApiError } from "@/services/bookingApi";
import { EmptyState, ErrorState, LoadingState } from "@/components/customer";
import { FOCUS_RING } from "@/components/customer/focusRing";
import { useOnlineStatus } from "@/hooks/useOnlineStatus";
import type { SlotAvailability, SlotsResponse } from "@/types/booking";
import DatePicker from "./components/DatePicker";
import SlotPicker, { formatSlotLabel } from "./components/SlotPicker";
import { formatINR } from "./formatMoney";

export default function StepSlot() {
  const serviceId = useBookingDraftStore((s) => s.serviceId);
  const date = useBookingDraftStore((s) => s.date);
  const slot = useBookingDraftStore((s) => s.slot);
  const setDate = useBookingDraftStore((s) => s.setDate);
  const setSlot = useBookingDraftStore((s) => s.setSlot);
  const setStep = useBookingDraftStore((s) => s.setStep);
  const online = useOnlineStatus();
  const serviceName = useBookingDraftStore((s) => s.serviceName);
  const quantity = useBookingDraftStore((s) => s.quantity);
  const addOns = useBookingDraftStore((s) => s.addOns);
  const basePrice = useBookingDraftStore((s) => s.basePrice);
  const address = useBookingDraftStore((s) => s.addressSnapshot);

  // Default to today; a persisted draft whose date has since passed is reset (with its slot).
  useEffect(() => {
    const today = todayISO();
    if (!date) {
      setDate(today);
    } else if (date < today) {
      setDate(today);
      setSlot(null);
    }
  }, [date, setDate, setSlot]);

  const {
    data: slotResponse,
    isError,
    error,
    refetch,
  } = useQuery<SlotsResponse, NormalizedApiError>({
    queryKey: ["slots", serviceId, date],
    queryFn: () => bookingApi.getSlots(serviceId as string, date as string),
    enabled: Boolean(serviceId && date),
  });

  // Safely extract the slot array from the API response object
  const slots: SlotAvailability[] | undefined = Array.isArray(slotResponse)
    ? slotResponse
    : slotResponse?.slots;

  // The chosen slot may have filled up since it was picked (or since a refetch): drop it.
  useEffect(() => {
    if (!slots || !slot) return;
    const current = slots.find((s) => s.slot === slot);
    if (!current || !current.available) setSlot(null);
  }, [slots, slot, setSlot]);

  const handleDateChange = (next: string) => {
    if (next === date) return;
    setDate(next);
    setSlot(null); // a slot only makes sense for the date it was picked on
  };

  const canContinue = Boolean(date && slot);

  let content: ReactNode;
  if (isError) {
    content = (
      <ErrorState
        title="Couldn't load availability"
        message={error?.message ?? "Something went wrong. Please try again."}
        onRetry={() => void refetch()}
      />
    );
  } else if (!slots && !online) {
    content = (
      <ErrorState
        title="You're offline"
        message="Reconnect to see the time slots available for this date."
        onRetry={() => void refetch()}
      />
    );
  } else if (!slots) {
    content = <LoadingState label="Loading available slots…" />;
  } else if (slots.length === 0) {
    content = (
      <EmptyState
        title="No time slots for this date"
        description="Please choose another date."
      />
    );
  } else {
    content = <SlotPicker slots={slots} value={slot} onChange={setSlot} />;
  }

  const dateLabel = date ? prettyDate(date) : null;
  const estimate = basePrice * quantity + addOns.reduce((sum, a) => sum + a.price * a.quantity, 0);

  const backBtn = (
    <button
      type="button"
      onClick={() => setStep(2)}
      className={clsx(
        "inline-flex min-h-[48px] items-center justify-center gap-2 rounded-full border border-line bg-white px-5 text-sm font-semibold text-ink transition-colors hover:bg-canvas",
        FOCUS_RING,
      )}
    >
      <ArrowLeft className="h-4 w-4" aria-hidden="true" />
      Back
    </button>
  );
  const nextBtn = (
    <button
      type="button"
      onClick={() => setStep(4)}
      disabled={!canContinue}
      className={clsx(
        "group inline-flex min-h-[48px] flex-1 items-center justify-center gap-2 rounded-full bg-brand px-7 text-sm font-bold text-white shadow-sm transition-colors hover:bg-[#3730A3] disabled:cursor-not-allowed disabled:opacity-50 motion-safe:active:scale-95",
        FOCUS_RING,
      )}
    >
      Continue to review
      <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-0.5 motion-reduce:transition-none" aria-hidden="true" />
    </button>
  );

  return (
    <div className="grid gap-6 lg:grid-cols-[minmax(0,1fr)_340px] lg:items-start lg:gap-8">
      <div className="min-w-0 space-y-6">
        {/* Intro */}
        <div className="flex items-start gap-3.5">
          <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl bg-brand text-white shadow-[0_12px_24px_-12px_rgba(67,56,202,.8)]">
            <CalendarDays className="h-5 w-5" aria-hidden="true" />
          </span>
          <div>
            <h3 className="text-xl font-bold tracking-tight text-ink sm:text-2xl">When should we arrive?</h3>
            <p className="mt-0.5 text-sm text-muted">Pick a day in the next two weeks, then choose a time that suits you.</p>
          </div>
        </div>

        {/* Date */}
        <section aria-labelledby="slot-date-heading" className="rounded-3xl border border-line bg-panel p-5 shadow-[0_24px_60px_-48px_rgba(67,56,202,.55)] sm:p-6">
          <div className="mb-4 flex flex-wrap items-center justify-between gap-2">
            <h4 id="slot-date-heading" className="text-base font-semibold text-ink">
              1. Choose a date
            </h4>
            {dateLabel && <span className="rounded-full bg-brand-soft px-3 py-1 text-xs font-semibold text-brand">{dateLabel}</span>}
          </div>
          <DatePicker value={date} onChange={handleDateChange} />
        </section>

        {/* Time */}
        <section aria-labelledby="slot-time-heading" className="rounded-3xl border border-line bg-panel p-5 shadow-[0_24px_60px_-48px_rgba(67,56,202,.55)] sm:p-6">
          <div className="mb-4 flex flex-wrap items-center justify-between gap-2">
            <h4 id="slot-time-heading" className="text-base font-semibold text-ink">
              2. Choose a time
            </h4>
            <span className="inline-flex items-center gap-1.5 text-xs text-muted">
              <Clock3 className="h-3.5 w-3.5" aria-hidden="true" />
              Each slot is a 2-hour window
            </span>
          </div>
          <div aria-live="polite">{content}</div>
        </section>

        {/* Mobile / tablet: floating action bar */}
        <div className="sticky bottom-[calc(4.75rem+env(safe-area-inset-bottom))] z-20 md:bottom-4 lg:hidden">
          <div className="rounded-3xl border border-line bg-white/90 p-2 shadow-[0_18px_40px_-14px_rgba(30,27,46,.45)] backdrop-blur-xl">
            {canContinue && (
              <p className="px-3 pb-2 pt-1 text-xs font-medium text-ink">
                {dateLabel} · {formatSlotLabel(slot ?? "")}
              </p>
            )}
            <div className="flex items-center gap-2">
              {backBtn}
              {nextBtn}
            </div>
          </div>
        </div>
      </div>

      {/* Desktop: sticky booking summary */}
      <aside className="hidden lg:sticky lg:top-24 lg:block" aria-label="Your visit">
        <div className="overflow-hidden rounded-3xl border border-line bg-panel shadow-[0_30px_70px_-44px_rgba(67,56,202,.6)]">
          <div className="bg-gradient-to-br from-brand to-[#6D5BE8] px-5 py-5 text-white">
            <p className="text-[11px] font-semibold uppercase tracking-wider text-white/70">Your visit</p>
            {canContinue ? (
              <>
                <p className="mt-1.5 text-lg font-bold leading-snug">{dateLabel}</p>
                <p className="mt-0.5 text-sm font-medium text-white/85">{formatSlotLabel(slot ?? "")}</p>
              </>
            ) : (
              <>
                <p className="mt-1.5 text-lg font-bold leading-snug">Select a date and time</p>
                <p className="mt-0.5 text-sm text-white/75">Your slot will appear here.</p>
              </>
            )}
          </div>
          <dl className="space-y-4 px-5 py-5 text-sm">
            <div className="flex items-start gap-3">
              <span className="mt-0.5 flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-brand-soft text-brand">
                <Sparkles className="h-4 w-4" aria-hidden="true" />
              </span>
              <div className="min-w-0">
                <dt className="text-xs text-muted">Service</dt>
                <dd className="font-semibold text-ink">
                  {serviceName ?? "Home service"} × {quantity}
                </dd>
                {addOns.length > 0 && <dd className="text-xs text-muted">+ {addOns.length} add-on{addOns.length > 1 ? "s" : ""}</dd>}
              </div>
            </div>
            {address && (
              <div className="flex items-start gap-3">
                <span className="mt-0.5 flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-brand-soft text-brand">
                  <MapPin className="h-4 w-4" aria-hidden="true" />
                </span>
                <div className="min-w-0">
                  <dt className="text-xs text-muted">{address.label ?? "Address"}</dt>
                  <dd className="break-words font-semibold text-ink">
                    {address.line1}, {address.city} – {address.pincode}
                  </dd>
                </div>
              </div>
            )}
            <div className="flex items-baseline justify-between border-t border-line pt-4">
              <dt className="text-muted">Estimated</dt>
              <dd className="text-lg font-bold tabular-nums text-ink">{formatINR(estimate)}</dd>
            </div>
          </dl>
          <div className="flex items-center gap-2 px-5 pb-5">
            {backBtn}
            {nextBtn}
          </div>
          <p className="flex items-center justify-center gap-1.5 border-t border-line bg-canvas px-5 py-3 text-xs text-muted">
            <ShieldCheck className="h-3.5 w-3.5 text-emerald-600" aria-hidden="true" />
            You can review everything before paying
          </p>
        </div>
      </aside>
    </div>
  );
}

/** "2026-10-07" -> "Wed, 7 Oct". Parsed as a local date so the day never shifts with the timezone. */
function prettyDate(iso: string): string {
  const [y, m, d] = iso.split("-").map(Number);
  if (!y || !m || !d) return iso;
  return new Date(y, m - 1, d).toLocaleDateString("en-IN", { weekday: "short", day: "numeric", month: "short" });
}
