import { useEffect, type ReactNode } from "react";
import { useQuery } from "@tanstack/react-query";
import { todayISO, useBookingDraftStore } from "@/features/booking";
import { bookingApi, type NormalizedApiError } from "@/services/bookingApi";
import { EmptyState, ErrorState, LoadingState } from "@/components/customer";
import { FOCUS_RING } from "@/components/customer/focusRing";
import { useOnlineStatus } from "@/hooks/useOnlineStatus";
import type { SlotAvailability, SlotsResponse } from "@/types/booking";
import DatePicker from "./components/DatePicker";
import SlotPicker from "./components/SlotPicker";

export default function StepSlot() {
  const serviceId = useBookingDraftStore((s) => s.serviceId);
  const date = useBookingDraftStore((s) => s.date);
  const slot = useBookingDraftStore((s) => s.slot);
  const setDate = useBookingDraftStore((s) => s.setDate);
  const setSlot = useBookingDraftStore((s) => s.setSlot);
  const setStep = useBookingDraftStore((s) => s.setStep);
  const online = useOnlineStatus();

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

  return (
    <div className="flex h-full min-h-0 flex-col">
      {/* Header */}
      <div className="shrink-0 border-b border-line px-4 py-2.5">
        <h3 className="text-base font-bold text-ink sm:text-lg">Date &amp; Time</h3>
        <p className="text-xs text-muted">
          Pick a day in the next two weeks. Unavailable slots are already booked out.
        </p>
      </div>

      {/* Body */}
      <div className="min-h-0 flex-1 space-y-2.5 overflow-y-auto overscroll-contain px-4 py-2.5">
        <DatePicker value={date} onChange={handleDateChange} />
        <div aria-live="polite">{content}</div>
      </div>

      {/* Footer */}
      <div className="shrink-0 border-t border-line bg-panel px-4 py-2.5 pb-[max(0.625rem,env(safe-area-inset-bottom))]">
        <div className="flex items-center justify-between gap-3">
          <button
            type="button"
            onClick={() => setStep(2)}
            className={`h-9 rounded border border-line bg-white px-4 text-xs font-semibold text-ink hover:bg-canvas ${FOCUS_RING}`}
          >
            Back
          </button>
          <button
            type="button"
            onClick={() => setStep(4)}
            disabled={!canContinue}
            className={`h-9 rounded bg-brand px-5 text-xs font-semibold text-white shadow-sm hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-50 ${FOCUS_RING}`}
          >
            Next Step
          </button>
        </div>
      </div>
    </div>
  );
}