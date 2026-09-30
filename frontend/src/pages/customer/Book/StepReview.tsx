import { useEffect, useMemo, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import { useBookingDraftStore } from "@/features/booking";
import { FOCUS_RING } from "@/components/customer/focusRing";
import { customerPath } from "@/routes/customerPath";
import { bookingApi, type NormalizedApiError } from "@/services/bookingApi";
import type { CreateBookingRequest } from "@/types/booking";
import { formatSlotLabel } from "./components/SlotPicker";

const CONVENIENCE_FEE = 29;

const ERROR_TO_STEP: Record<string, number> = {
  SERVICE_NOT_FOUND: 1,
  ADDRESS_NOT_SERVICEABLE: 2,
  ADDRESS_NOT_FOUND: 2,
  SLOT_UNAVAILABLE: 3,
  INVALID_DATE: 3,
};

export default function StepReview() {
  const draft = useBookingDraftStore();
  const navigate = useNavigate();

  const [couponInput, setCouponInput] = useState(draft.couponCode ?? "");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<NormalizedApiError | null>(null);
  const [idempotencyKey, setIdempotencyKey] = useState(() => crypto.randomUUID());
  const inFlight = useRef(false);

  const addOnsKey = JSON.stringify(draft.addOns);

  useEffect(() => {
    setIdempotencyKey(crypto.randomUUID());
  }, [draft.serviceId, draft.addressId, draft.date, draft.slot, draft.quantity, addOnsKey]);

  const addOnsTotal = draft.addOns.reduce((sum, a) => sum + a.price, 0);
  const subtotal = draft.basePrice * draft.quantity + addOnsTotal;
  const estimatedTotal = subtotal + CONVENIENCE_FEE;

  const canSubmit = useMemo(
    () => Boolean(draft.serviceId && draft.addressId && draft.date && draft.slot),
    [draft.serviceId, draft.addressId, draft.date, draft.slot],
  );

  const handlePay = async () => {
    if (!canSubmit || inFlight.current) return; 
    if (!draft.serviceId || !draft.addressId || !draft.date || !draft.slot) return;

    inFlight.current = true;
    setIsSubmitting(true);
    setError(null);

    const payload: CreateBookingRequest = {
      serviceId: draft.serviceId,
      addressId: draft.addressId,
      date: draft.date,
      slot: draft.slot,
      quantity: draft.quantity,
      addOns: draft.addOns.map((a) => ({ addOnId: a.id, quantity: a.quantity })),
      expectedTotal: estimatedTotal,
      ...(couponInput.trim() ? { couponCode: couponInput.trim() } : {}),
    };

    try {
      const { booking } = await bookingApi.createBooking(payload, idempotencyKey);
      // Leave the wizard FIRST. Clearing the draft while it is still mounted makes its step guard
      // fall back to step 1 and rewrite the URL, cancelling this navigation (React Router's
      // startTransition defers navigate(); the store update does not). The confirmation page
      // clears the draft once the wizard is gone. `replace` keeps Back from re-opening step 4.
      navigate(customerPath(`/bookings/${booking._id}`), { state: { justBooked: true }, replace: true });
    } catch (err) {
      inFlight.current = false; 
      const apiErr = err as NormalizedApiError;
      
      setError(apiErr);
      setIsSubmitting(false);

      const backStep = ERROR_TO_STEP[apiErr.code];
      if (backStep) draft.setStep(backStep);
      
      if (apiErr.code === "PRICE_CHANGED") {
        setIdempotencyKey(crypto.randomUUID());
      }
    }
  };

  if (!canSubmit) {
    return (
      <div className="py-8 text-center text-sm text-muted">
        Some details are missing. Please complete the earlier steps first.
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="border-b border-line pb-4">
        <h3 className="text-xl font-semibold text-ink">Review &amp; Pay</h3>
        <p className="mt-1 text-sm text-muted">Double-check everything before you confirm.</p>
      </div>

      {error && (
        <div role="alert" className="rounded border border-danger bg-danger-soft px-4 py-3 text-sm text-ink">
          {error.message}
        </div>
      )}

      <section className="space-y-2 rounded border border-line bg-panel p-4">
        <h4 className="text-sm font-semibold text-ink">{draft.serviceName ?? "Service"}</h4>
        <div className="flex justify-between text-sm text-ink">
          <span>Base price × {draft.quantity}</span>
          <span>₹{draft.basePrice * draft.quantity}</span>
        </div>
        {draft.addOns.map((a) => (
          <div key={a.id} className="flex justify-between text-sm text-muted">
            <span>{a.name ?? "Add-on"}</span>
            <span>+₹{a.price}</span>
          </div>
        ))}
        <div className="flex justify-between text-sm text-muted">
          <span>Convenience fee</span>
          <span>₹{CONVENIENCE_FEE}</span>
        </div>
      </section>

      <section className="space-y-1 rounded border border-line bg-panel p-4">
        <h4 className="text-sm font-semibold text-ink">Address</h4>
        <p className="text-sm text-muted">
          {draft.addressSnapshot?.line1}, {draft.addressSnapshot?.city}, {draft.addressSnapshot?.state} —{" "}
          {draft.addressSnapshot?.pincode}
        </p>
      </section>

      <section className="space-y-1 rounded border border-line bg-panel p-4">
        <h4 className="text-sm font-semibold text-ink">Date &amp; Time</h4>
        <p className="text-sm text-muted">
          {draft.date} · {formatSlotLabel(draft.slot ?? "")}
        </p>
      </section>

      <section className="space-y-2 rounded border border-line bg-panel p-4">
        <label htmlFor="coupon" className="text-sm font-semibold text-ink">Coupon code</label>
        <input
          id="coupon"
          value={couponInput}
          onChange={(e) => setCouponInput(e.target.value)}
          placeholder="Optional"
          className={`min-h-[44px] w-full rounded border border-line bg-canvas px-3 text-sm text-ink ${FOCUS_RING}`}
        />
      </section>

      <div className="mt-6 flex flex-col sm:flex-row items-center justify-between gap-4 rounded border border-brand bg-panel p-4">
        <button
          type="button"
          onClick={() => draft.setStep(3)} // Goes back to Date & Time
          className={`min-h-[44px] rounded border border-line bg-white px-6 text-sm font-medium text-ink hover:bg-canvas w-full sm:w-auto ${FOCUS_RING}`}
        >
          Back
        </button>
        <div className="flex items-center justify-between w-full sm:w-auto gap-6">
          <div className="text-right sm:text-left">
            <p className="text-xs text-muted">Estimated Total</p>
            <p className="text-lg font-semibold text-ink">₹{estimatedTotal}</p>
          </div>
          <button
            type="button"
            onClick={handlePay}
            disabled={isSubmitting}
            className={`min-h-[44px] rounded bg-brand px-6 text-sm font-medium text-white hover:opacity-90 disabled:opacity-50 ${FOCUS_RING}`}
          >
            {isSubmitting ? "Confirming…" : "Confirm & Pay"}
          </button>
        </div>
      </div>
    </div>
  );
}