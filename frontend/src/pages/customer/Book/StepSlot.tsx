import { useEffect, useState } from "react";
import { useBookingDraftStore } from "@/features/booking";
import { LoadingState, ErrorState, EmptyState } from "@/components/customer";
import { FOCUS_RING } from "@/components/customer/focusRing";
import { bookingApi, type NormalizedApiError } from "@/services/bookingApi";
import type { SlotAvailability } from "@/types/booking";
import DatePicker from "./components/DatePicker";
import SlotPicker from "./components/SlotPicker";

function todayISO(): string {
  return new Date().toISOString().slice(0, 10);
}

export default function StepSlot() {
  const serviceId = useBookingDraftStore((s) => s.serviceId);
  const draftDate = useBookingDraftStore((s) => s.date);
  const draftSlot = useBookingDraftStore((s) => s.slot);
  const setDateAndSlot = useBookingDraftStore((s) => s.setDateAndSlot);
  const setStep = useBookingDraftStore((s) => s.setStep); // Added for Back button

  const [date, setDate] = useState(draftDate ?? todayISO());
  const [slot, setSlot] = useState<string | null>(draftSlot);
  const [status, setStatus] = useState<"loading" | "ready" | "empty" | "error">("loading");
  const [slots, setSlots] = useState<SlotAvailability[]>([]);
  const [error, setError] = useState<NormalizedApiError | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    if (!serviceId) return;
    let cancelled = false;
    setStatus("loading");
    setSlot(null);
    bookingApi
      .getSlots(serviceId, date)
      .then((res) => {
        if (cancelled) return;
        setSlots(res.slots);
        setStatus(res.slots.length === 0 ? "empty" : "ready");
      })
      .catch((err: NormalizedApiError) => {
        if (cancelled) return;
        setError(err);
        setStatus("error");
      });
    return () => {
      cancelled = true;
    };
  }, [serviceId, date]);

  const handleNext = () => {
    if (!slot || isSubmitting) return; 
    setIsSubmitting(true);
    setDateAndSlot(date, slot);
  };

  if (!serviceId) return <ErrorState title="No service selected" message="Please go back and pick a service first." />;

  return (
    <div className="space-y-6">
      <div className="border-b border-line pb-4">
        <h1 className="text-xl font-semibold text-ink">Date &amp; Time</h1>
        <p className="mt-1 text-sm text-muted">Unavailable slots are already booked out.</p>
      </div>

      <DatePicker value={date} onChange={setDate} />

      {status === "loading" && <LoadingState label="Checking availability…" />}
      {status === "error" && (
        <ErrorState
          title="Couldn't load availability"
          message={error?.message}
          onRetry={() => setStatus("loading")}
        />
      )}
      {status === "empty" && <EmptyState title="No slots for this date" description="Try a different date." />}
      {status === "ready" && <SlotPicker slots={slots} value={slot} onChange={setSlot} />}

      {/* UPDATED: Added Back Button */}
      <div className="mt-8 flex justify-between pt-4 border-t border-line">
        <button
          type="button"
          onClick={() => setStep(2)}
          className={`min-h-[44px] rounded border border-line px-6 text-sm font-medium text-ink hover:bg-canvas ${FOCUS_RING}`}
        >
          Back
        </button>
        <button
          type="button"
          onClick={handleNext}
          disabled={!slot || isSubmitting}
          className={`min-h-[44px] rounded bg-brand px-6 text-sm font-medium text-white hover:opacity-90 disabled:opacity-50 ${FOCUS_RING}`}
        >
          {isSubmitting ? "Saving…" : "Next Step"}
        </button>
      </div>
    </div>
  );
}