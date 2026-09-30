import { useEffect, useMemo, useState } from "react";

/** Backend rejects quantity > 20 (bookings.validation.ts). */
const MAX_QUANTITY = 20;
import { useBookingDraftStore } from "@/features/booking";
import { LoadingState, ErrorState } from "@/components/customer";
import { FOCUS_RING } from "@/components/customer/focusRing";
import { findMockServiceBySlug, type MockAddOn } from "./serviceCatalog.mock";
import AddOnSelector from "./components/AddOnSelector";

/** Simulates the future GET /services/:slug endpoint. Step 1 is explicitly mock-backed today
 *  (see the R01 acceptance criteria) — swap this for a real fetch once the Services API ships. */
function fetchServiceBySlug(slug: string | undefined, signal: AbortSignal) {
  return new Promise<ReturnType<typeof findMockServiceBySlug>>((resolve, reject) => {
    const timer = setTimeout(() => resolve(findMockServiceBySlug(slug)), 500);
    signal.addEventListener("abort", () => {
      clearTimeout(timer);
      reject(new DOMException("aborted", "AbortError"));
    });
  });
}

export default function StepService({ serviceSlug }: { serviceSlug?: string }) {
  const [status, setStatus] = useState<"loading" | "ready" | "error">("loading");
  const [service, setService] = useState<ReturnType<typeof findMockServiceBySlug>>(undefined);
  const [quantity, setQuantity] = useState(1);
  const [selectedAddOns, setSelectedAddOns] = useState<Map<string, MockAddOn>>(new Map());
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [attempt, setAttempt] = useState(0);

  const setServiceDetails = useBookingDraftStore((s) => s.setServiceDetails);
  const draftServiceId = useBookingDraftStore((s) => s.serviceId);
  const draftQuantity = useBookingDraftStore((s) => s.quantity);
  const draftAddOns = useBookingDraftStore((s) => s.addOns);

  useEffect(() => {
    const controller = new AbortController();
    setStatus("loading");
    fetchServiceBySlug(serviceSlug, controller.signal)
      .then((found) => {
        setService(found);
        setStatus("ready");
      })
      .catch((err: unknown) => {
        if (err instanceof DOMException && err.name === "AbortError") return;
        setStatus("error");
      });
    return () => controller.abort();
  }, [serviceSlug, attempt]);

  // Restore selections if the customer comes back to Step 1 with a draft already in progress.
  useEffect(() => {
    if (!service || service.id !== draftServiceId) return;
    setQuantity(draftQuantity || 1);
    setSelectedAddOns(
      new Map(
        draftAddOns.map((a) => [a.id, service.addOns.find((o) => o.id === a.id) ?? { id: a.id, name: a.name ?? "Add-on", price: a.price }]),
      ),
    );
    // eslint-disable-next-line react-hooks/exhaustive-deps -- restore once, when the matching service loads
  }, [service]);

  const toggleAddOn = (addOn: MockAddOn) => {
    setSelectedAddOns((prev) => {
      const next = new Map(prev);
      if (next.has(addOn.id)) next.delete(addOn.id);
      else next.set(addOn.id, addOn);
      return next;
    });
  };

  const runningEstimate = useMemo(() => {
    if (!service) return 0;
    const addOnsTotal = [...selectedAddOns.values()].reduce((sum, a) => sum + a.price, 0);
    return service.basePrice * quantity + addOnsTotal;
  }, [service, quantity, selectedAddOns]);

  const handleNextStep = () => {
    if (!service || isSubmitting) return; // guards the double-click case
    setIsSubmitting(true);
    setServiceDetails(
      service.id,
      service.slug,
      service.basePrice,
      quantity,
      [...selectedAddOns.values()].map((a) => ({ id: a.id, quantity: 1, price: a.price, name: a.name })),
      service.name,
    );
  };

  if (status === "loading") return <LoadingState label="Loading service details…" />;
  if (status === "error" || !service) {
    return (
      <ErrorState
        title="Couldn't load this service"
        message="This service may no longer be available."
        onRetry={() => setAttempt((n) => n + 1)}
      />
    );
  }

  return (
    <div className="space-y-6">
      <div className="border-b border-line pb-4">
        <h3 className="text-xl font-semibold text-ink">{service.name}</h3>
        <p className="mt-1 text-sm text-muted">Base price: ₹{service.basePrice} per unit</p>
      </div>

      <div className="flex items-center gap-4">
        <span className="text-sm font-medium text-ink">Quantity:</span>
        <div className="flex items-center rounded border border-line">
          <button
            type="button"
            onClick={() => setQuantity((q) => Math.max(1, q - 1))}
            aria-label="Decrease quantity"
            className={`min-h-[44px] min-w-[44px] text-muted hover:bg-canvas ${FOCUS_RING}`}
          >
            −
          </button>
          <span className="w-10 text-center text-sm font-medium" aria-live="polite">
            {quantity}
          </span>
          <button
            type="button"
            onClick={() => setQuantity((q) => Math.min(MAX_QUANTITY, q + 1))}
            aria-label="Increase quantity"
            className={`min-h-[44px] min-w-[44px] text-muted hover:bg-canvas ${FOCUS_RING}`}
          >
            +
          </button>
        </div>
      </div>

      <AddOnSelector addOns={service.addOns} selectedIds={new Set(selectedAddOns.keys())} onToggle={toggleAddOn} />

      <div className="mt-6 flex items-center justify-between rounded border border-brand bg-panel p-4">
        <div>
          <p className="text-xs text-muted">Running Estimate</p>
          <p className="text-lg font-semibold text-ink">₹{runningEstimate}</p>
        </div>
        <button
          type="button"
          onClick={handleNextStep}
          disabled={isSubmitting}
          className={`min-h-[44px] rounded bg-brand px-6 text-sm font-medium text-white hover:opacity-90 disabled:opacity-50 ${FOCUS_RING}`}
        >
          {isSubmitting ? "Saving…" : "Next Step"}
        </button>
      </div>
    </div>
  );
}