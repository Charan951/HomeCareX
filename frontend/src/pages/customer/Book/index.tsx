import { useEffect, useRef } from "react";
import clsx from "clsx";
import { Sparkles } from "lucide-react";
import { Navigate, useParams, useSearchParams } from "react-router-dom";
import { useBookingDraftStore } from "@/features/booking";
import { useService } from "@/hooks/useService";
import { customerPath } from "@/routes/customerPath";
import BackToService from "./components/BackToService";
import BookingStepper from "./components/BookingStepper";
import StepService from "./StepService";
import StepAddress from "./StepAddress";
import StepSlot from "./StepSlot";
import StepReview from "./StepReview";

export default function BookServiceShell() {
  const { serviceSlug } = useParams<{ serviceSlug: string }>();
  const [searchParams, setSearchParams] = useSearchParams();

  const currentStep = useBookingDraftStore((s) => s.currentStep);
  const draftSlug = useBookingDraftStore((s) => s.serviceSlug);
  const serviceId = useBookingDraftStore((s) => s.serviceId);
  const addressId = useBookingDraftStore((s) => s.addressId);
  const date = useBookingDraftStore((s) => s.date);
  const slot = useBookingDraftStore((s) => s.slot);
  const setStep = useBookingDraftStore((s) => s.setStep);
  const clearDraft = useBookingDraftStore((s) => s.clearDraft);
  const notice = useBookingDraftStore((s) => s.notice);
  const setNotice = useBookingDraftStore((s) => s.setNotice);

  // A draft belongs to one service. Opening a different service's wizard starts clean. The draft is also
  // dropped when its saved service id is not the id the catalog returns for this slug (an id from an older
  // or reseeded database, which POST /bookings would reject with SERVICE_NOT_FOUND).
  const { data: currentService } = useService(serviceSlug);
  const draftIsForOtherService =
    (draftSlug !== null && draftSlug !== serviceSlug) ||
    (Boolean(serviceId) && draftSlug === null) ||
    (Boolean(serviceId) && currentService !== undefined && currentService.id !== serviceId);
  useEffect(() => {
    if (draftIsForOtherService) clearDraft();
  }, [draftIsForOtherService, clearDraft]);

  // First step whose data is still missing. Nothing past it may be shown.
  const firstIncomplete = !serviceId ? 1 : !addressId ? 2 : !date || !slot ? 3 : 4;
  const effectiveStep = draftIsForOtherService ? 1 : Math.min(Math.max(currentStep, 1), firstIncomplete);

  const rawParam = searchParams.get("step");
  const requested = rawParam === null ? null : Number(rawParam);
  const validRequested = requested !== null && Number.isInteger(requested) && requested >= 1 && requested <= 4 ? requested : null;

  // URL -> store: deep links (?step=4), browser Back/Forward. A step beyond the first incomplete
  // one is corrected to that step (and the URL rewritten) instead of showing a half-empty form.
  useEffect(() => {
    if (validRequested === null) return;
    const target = Math.min(validRequested, firstIncomplete);
    if (target !== currentStep) setStep(target);
    if (target !== validRequested) setSearchParams({ step: String(target) }, { replace: true });
    // eslint-disable-next-line react-hooks/exhaustive-deps -- react to URL changes only; store changes are mirrored below
  }, [rawParam]);

  // store -> URL: keep ?step= in sync as the customer moves through the wizard (each step is a
  // history entry, so Back works). Repairs the URL on first load when there is no/invalid param.
  // True when the URL asked for a step the customer is not ready for (e.g. ?step=4, empty draft).
  const redirectedByGuard = useRef(validRequested !== null && validRequested > firstIncomplete);
  const mounted = useRef(false);
  useEffect(() => {
    const firstRun = !mounted.current;
    mounted.current = true;
    if (firstRun && validRequested !== null) return; // the effect above owns deep links
    if (String(effectiveStep) !== rawParam) {
      setSearchParams({ step: String(effectiveStep) }, { replace: firstRun });
    }
    if (currentStep !== effectiveStep) setStep(effectiveStep);
    // eslint-disable-next-line react-hooks/exhaustive-deps -- run when the visible step changes
  }, [effectiveStep]);

  if (!serviceSlug) return <Navigate to={customerPath("/services")} replace />;

  return (
    <div className={clsx("mx-auto w-full min-w-0", "max-w-5xl space-y-5 pb-4 sm:space-y-6 sm:pb-6 lg:max-w-6xl")}>
      <BackToService slug={serviceSlug} />
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <h1 className={"text-2xl font-bold tracking-tight text-ink md:text-[28px]"}>Book a Service</h1>
          <p className="mt-1 text-sm text-muted">Complete the steps below to confirm your booking.</p>
        </div>
        {currentService && (
          <span className="inline-flex max-w-full items-center gap-2 rounded-full border border-line bg-panel px-3.5 py-2 text-sm font-semibold text-ink shadow-sm">
            <Sparkles className="h-4 w-4 shrink-0 text-brand" aria-hidden="true" />
            <span className="truncate">{currentService.name}</span>
          </span>
        )}
      </div>
      {notice && (
        <div role="alert" className="flex items-start justify-between gap-3 rounded-2xl border border-danger bg-danger-soft px-4 py-3 text-sm text-ink">
          <span>{notice}</span>
          <button type="button" onClick={() => setNotice(null)} aria-label="Dismiss message" className="shrink-0 text-xs font-medium underline">
            Dismiss
          </button>
        </div>
      )}
      <BookingStepper currentStep={effectiveStep} focusOnMount={redirectedByGuard.current} compact={false} onStepSelect={setStep} />
      <div className="min-w-0">
        {effectiveStep === 1 && <StepService serviceSlug={serviceSlug} />}
        {effectiveStep === 2 && <StepAddress />}
        {effectiveStep === 3 && <StepSlot />}
        {effectiveStep === 4 && <StepReview />}
      </div>
    </div>
  );
}
