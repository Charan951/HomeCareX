import { useEffect, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import { useBookingDraftStore } from "@/features/booking";
import { FOCUS_RING } from "@/components/customer/focusRing";
import { useOnlineStatus } from "@/hooks/useOnlineStatus";
import { bookingApi, type NormalizedApiError } from "@/services/bookingApi";
import { paymentApi } from "@/services/paymentApi";
import type { CreateBookingRequest } from "@/types/booking";
import { customerPath } from "@/routes/customerPath";
import { formatSlotLabel } from "./components/SlotPicker";

declare global {
  interface Window {
    Razorpay: any;
  }
}

const CONVENIENCE_FEE = 29;
const PRE_POPUP_DELAY_MS = 10000;
const MAX_PAYMENT_RETRIES = 3;

const sleep = (ms: number) => new Promise<void>((resolve) => setTimeout(resolve, ms));

const loadRazorpayScript = (): Promise<boolean> => {
  return new Promise((resolve) => {
    if (document.getElementById("razorpay-checkout-js")) {
      resolve(true);
      return;
    }
    const script = document.createElement("script");
    script.id = "razorpay-checkout-js";
    script.src = "https://checkout.razorpay.com/v1/checkout.js";
    script.onload = () => resolve(true);
    script.onerror = () => resolve(false);
    document.body.appendChild(script);
  });
};

/** Forcefully purges the Razorpay DOM backdrop and modal iframe */
const forceCloseRazorpayModal = () => {
  try {
    const containers = document.querySelectorAll(
      ".razorpay-container, iframe[src*='razorpay'], .razorpay-backdrop"
    );
    containers.forEach((el) => el.remove());
    document.body.style.overflow = "";
  } catch (err) {
    console.warn("Could not clean Razorpay DOM nodes:", err);
  }
};

const ERROR_TO_STEP: Record<string, number> = {
  SERVICE_NOT_FOUND: 1,
  ADDON_NOT_FOUND: 1,
  ADDRESS_NOT_SERVICEABLE: 2,
  ADDRESS_NOT_FOUND: 2,
  SLOT_UNAVAILABLE: 3,
  SLOT_BUSY: 3,
  INVALID_DATE: 3,
};

const SLOT_ERRORS = new Set(["SLOT_UNAVAILABLE", "SLOT_BUSY", "INVALID_DATE"]);
const SLOT_TAKEN_NOTICE = "That time slot was just taken by someone else. Please pick another slot.";

function formatReviewDate(iso: string): string {
  const [y, m, d] = iso.split("-").map(Number);
  return new Date(y, m - 1, d).toLocaleDateString("en-IN", {
    weekday: "long",
    day: "numeric",
    month: "long",
    year: "numeric",
  });
}

function readServerTotal(details: unknown): number | null {
  if (typeof details === "object" && details !== null && "total" in details) {
    const total = (details as { total: unknown }).total;
    if (typeof total === "number" && Number.isFinite(total)) return total;
  }
  return null;
}

function ChangeButton({ label, onClick }: { label: string; onClick: () => void }) {
  return (
    <button
      type="button"
      onClick={onClick}
      aria-label={`Change ${label}`}
      className={`shrink-0 text-xs font-medium text-brand underline underline-offset-2 transition-colors hover:opacity-80 ${FOCUS_RING}`}
    >
      Change
    </button>
  );
}

export default function StepReview() {
  const draft = useBookingDraftStore();
  const navigate = useNavigate();
  const online = useOnlineStatus();

  const [couponInput, setCouponInput] = useState(draft.couponCode ?? "");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [statusMessage, setStatusMessage] = useState("Processing your payment…");
  const [error, setError] = useState<NormalizedApiError | { message: string } | null>(null);

  const [serverTotal, setServerTotal] = useState<number | null>(null);
  const [clickedWhileProcessing, setClickedWhileProcessing] = useState(false);

  const inFlight = useRef(false);
  const mounted = useRef(true);
  const retryCountRef = useRef(0);
  const hasExitedRef = useRef(false);

  useEffect(() => {
    mounted.current = true;
    return () => {
      mounted.current = false;
      forceCloseRazorpayModal();
    };
  }, []);

  const addOnsTotal = draft.addOns.reduce((sum, a) => sum + a.price * a.quantity, 0);
  const subtotal = draft.basePrice * draft.quantity + addOnsTotal;
  const estimatedTotal = subtotal + CONVENIENCE_FEE;
  const displayTotal = serverTotal ?? estimatedTotal;

  const canSubmit = Boolean(draft.serviceId && draft.addressId && draft.date && draft.slot);

  const handlePay = async () => {
    if (inFlight.current) {
      setClickedWhileProcessing(true);
      return;
    }
    if (!online) return;
    if (!draft.serviceId || !draft.addressId || !draft.date || !draft.slot) return;

    inFlight.current = true;
    hasExitedRef.current = false;
    retryCountRef.current = 0;
    const startedAt = Date.now();
    setIsSubmitting(true);
    setStatusMessage("Processing your payment. Please wait a moment…");
    setClickedWhileProcessing(false);
    setError(null);

    const isSdkLoaded = await loadRazorpayScript();
    if (!isSdkLoaded) {
      setError({ message: "Failed to load Razorpay SDK. Please check your internet connection." });
      inFlight.current = false;
      setIsSubmitting(false);
      return;
    }

    const coupon = couponInput.trim();
    draft.setCouponCode(coupon || null);

    const payload: CreateBookingRequest = {
      serviceId: draft.serviceId,
      addressId: draft.addressId,
      date: draft.date,
      slot: draft.slot,
      quantity: draft.quantity,
      addOns: draft.addOns.map((a) => ({ addOnId: a.id, quantity: a.quantity })),
      expectedTotal: displayTotal,
      ...(coupon ? { couponCode: coupon } : {}),
    };

    const idempotencyKey = draft.getIdempotencyKey(JSON.stringify(payload));

    try {
      const { booking } = await bookingApi.createBooking(payload, idempotencyKey);
      const resolvedBookingId = (booking as any)._id || (booking as any).id;

      const goToFailed = (reason: "failed" | "verification" | "network") =>
        navigate(`${customerPath(`/booking/failed/${resolvedBookingId}`)}?reason=${reason}`, { replace: true });

      // Authenticated axios client (Bearer token + auto refresh). Amount is taken from the booking on the server.
      const orderData = await paymentApi.createOrder(resolvedBookingId);

      // Helper to update backend and database
      const markFailureOnServer = async (reason: string) => {
        try {
          await paymentApi.recordAttempt(resolvedBookingId, "FAILED", orderData.orderId, reason);
        } catch (e) {
          console.error("Failed to notify backend of payment failure:", e);
        }
      };

      // 10-second countdown delay before opening Razorpay
      const elapsedMs = Date.now() - startedAt;
      const remainingWaitMs = Math.max(0, PRE_POPUP_DELAY_MS - elapsedMs);
      if (remainingWaitMs > 0) {
        setStatusMessage("Opening Razorpay checkout in a few seconds…");
        await sleep(remainingWaitMs);
      }

      if (!mounted.current) return;

      let rzpInstance: any = null;

      const options = {
        key: orderData.keyId,
        amount: orderData.amount,
        currency: orderData.currency || "INR",
        name: "HomeCareX",
        description: `Payment for ${draft.serviceName ?? "Home Service"}`,
        order_id: orderData.orderId,
        handler: async function (response: any) {
          // Payment went through on Razorpay's side: make sure the dismiss callback can't treat it as a cancel.
          hasExitedRef.current = true;
          setIsSubmitting(true);
          setStatusMessage("Verifying your payment with bank…");
          try {
            await paymentApi.verify(resolvedBookingId, {
              razorpay_order_id: response.razorpay_order_id,
              razorpay_payment_id: response.razorpay_payment_id,
              razorpay_signature: response.razorpay_signature,
            });
            // The draft is cleared by the success page itself, so the wizard never flashes back to step 1.
            navigate(customerPath(`/booking/success/${resolvedBookingId}`), { replace: true });
          } catch (verifyErr: any) {
            const uncertain = verifyErr?.code === "NETWORK_ERROR" || !verifyErr?.status;
            if (!uncertain) await markFailureOnServer(verifyErr?.message || "Payment verification failed");
            goToFailed(uncertain ? "network" : "verification");
          }
        },
        prefill: {
          name: orderData.prefill?.name || (draft.addressSnapshot as any)?.recipientName || (draft.addressSnapshot as any)?.name || "",
          email: orderData.prefill?.email || "",
          contact: orderData.prefill?.contact || (draft.addressSnapshot as any)?.phoneNumber || (draft.addressSnapshot as any)?.phone || "",
        },
        theme: {
          color: "#0066FF",
        },
        modal: {
          // Triggered when user clicks "Yes, exit" on Razorpay dialog
          ondismiss: async function () {
            if (hasExitedRef.current) return;
            hasExitedRef.current = true;

            setIsSubmitting(true);
            setStatusMessage("Payment cancelled…");
            await markFailureOnServer("Customer closed the Razorpay checkout");
            forceCloseRazorpayModal();
            goToFailed("failed");
          },
        },
      };

      rzpInstance = new window.Razorpay(options);

      // Triggered when payment fails inside Razorpay
      rzpInstance.on("payment.failed", async function (response: any) {
        retryCountRef.current += 1;
        const currentAttempts = retryCountRef.current;
        console.warn(`Payment failed attempt ${currentAttempts}/${MAX_PAYMENT_RETRIES}:`, response.error);

        // After 3 failed attempts: force exit and redirect to /customer
        if (currentAttempts >= MAX_PAYMENT_RETRIES && !hasExitedRef.current) {
          hasExitedRef.current = true;

          // 1. Force remove Razorpay modal so customer can't click retry again
          forceCloseRazorpayModal();
          try {
            if (rzpInstance && typeof rzpInstance.close === "function") {
              rzpInstance.close();
            }
          } catch (_) {}

          setIsSubmitting(true);
          setStatusMessage("Maximum retries (3) reached. Payment failed.");

          const reason = response.error?.description || "Payment failed 3 times (Max attempts exceeded)";

          // 2. Mark as failed in MongoDB
          await markFailureOnServer(reason);

          // 3. Show the failure page (draft is kept so "Retry Payment" works)
          goToFailed("failed");
        }
      });

      rzpInstance.open();
    } catch (err: any) {
      inFlight.current = false;
      setIsSubmitting(false);
      setClickedWhileProcessing(false);
      const apiErr = err as NormalizedApiError;

      if (apiErr.code === "PRICE_CHANGED") {
        setServerTotal(readServerTotal(apiErr.details));
        setError(apiErr);
        return;
      }

      // The saved idempotency key replays the OLD booking (e.g. one created during an earlier failed attempt).
      // If that booking can't be paid any more, drop the key so the next click creates a fresh booking.
      if (["HOLD_EXPIRED", "BOOKING_NOT_PAYABLE", "ALREADY_PAID"].includes(apiErr.code)) {
        draft.resetIdempotency();
        setError({
          message:
            apiErr.code === "ALREADY_PAID"
              ? apiErr.message
              : "Your earlier reservation is no longer valid. Please tap Confirm & Pay again to start a fresh one.",
        });
        return;
      }

      const backStep = ERROR_TO_STEP[apiErr.code];
      if (backStep) {
        if (SLOT_ERRORS.has(apiErr.code)) {
          draft.setSlot(null);
          draft.setNotice(apiErr.code === "INVALID_DATE" ? apiErr.message : SLOT_TAKEN_NOTICE);
        } else {
          draft.setNotice(apiErr.message);
        }
        draft.setStep(backStep);
        return;
      }

      setError(apiErr.message ? apiErr : { message: err.message || "An unexpected error occurred." });
    }
  };

  if (!canSubmit) {
    return (
      <div className="py-8 text-center text-sm text-muted">
        Some details are missing. Please complete the earlier steps first.
      </div>
    );
  }

  const address = draft.addressSnapshot;

  return (
    <div className="flex h-full min-h-0 flex-col">
      <div className="hidden shrink-0 border-b border-line px-4 py-3 sm:block">
        <h3 className="text-base font-semibold text-ink sm:text-lg">Review &amp; Pay</h3>
        <p className="text-xs text-muted">Double-check everything before you confirm.</p>
      </div>

      <div className="min-h-0 flex-1 space-y-2.5 overflow-y-auto overscroll-contain px-3 py-3 sm:px-4">
        {!online && (
          <div role="alert" className="rounded-lg border border-line bg-canvas px-3 py-2 text-xs text-ink">
            You're offline. Reconnect to confirm your booking — your details are saved.
          </div>
        )}

        {isSubmitting && (
          <div
            role="status"
            aria-live="polite"
            className={`flex items-start gap-2.5 rounded-lg border px-3 py-2 text-xs text-ink ${
              clickedWhileProcessing ? "border-amber-300 bg-amber-50" : "border-line bg-canvas"
            }`}
          >
            <span aria-hidden="true" className="mt-0.5 h-3.5 w-3.5 shrink-0 animate-spin rounded-full border-2 border-brand border-t-transparent" />
            <div>
              <p className="font-semibold text-brand">
                {clickedWhileProcessing ? "Your payment is processing" : statusMessage}
              </p>
              <p className="text-muted">
                {clickedWhileProcessing
                  ? "Please wait a moment. You have not been charged twice."
                  : "Connecting to secure payment gateway. Please don't refresh or close."}
              </p>
            </div>
          </div>
        )}

        {error && (
          <div role="alert" className="rounded-lg border border-danger bg-danger-soft px-3 py-2 text-xs text-ink">
            {error.message}
          </div>
        )}

        <section aria-labelledby="review-service" className="rounded-lg border border-line bg-white p-3">
          <div className="mb-1 flex items-center justify-between gap-2">
            <h4 id="review-service" className="min-w-0 truncate text-sm font-semibold text-ink">{draft.serviceName ?? "Service"}</h4>
            <ChangeButton label="service and add-ons" onClick={() => draft.setStep(1)} />
          </div>
          <div className="space-y-0.5 text-xs">
            <div className="flex justify-between text-ink">
              <span>Base price &times; {draft.quantity}</span>
              <span className="font-medium">₹{draft.basePrice * draft.quantity}</span>
            </div>
            {draft.addOns.length === 0 ? (
              <p className="text-muted">No add-ons selected</p>
            ) : (
              draft.addOns.map((a) => (
                <div key={a.id} className="flex justify-between text-muted">
                  <span>{a.name ?? "Add-on"}{a.quantity > 1 ? ` × ${a.quantity}` : ""}</span>
                  <span>+₹{a.price * a.quantity}</span>
                </div>
              ))
            )}
            <div className="flex justify-between text-muted">
              <span>Convenience fee</span>
              <span>₹{CONVENIENCE_FEE}</span>
            </div>
          </div>
        </section>

        <div className="grid gap-2.5 md:grid-cols-2">
          <section aria-labelledby="review-address" className="rounded-lg border border-line bg-white p-3">
            <div className="mb-1 flex items-center justify-between gap-2">
              <h4 id="review-address" className="min-w-0 truncate text-sm font-semibold text-ink">
                Address{address?.label ? ` · ${address.label}` : ""}
              </h4>
              <ChangeButton label="address" onClick={() => draft.setStep(2)} />
            </div>
            <p className="line-clamp-2 break-words text-xs text-muted">
              {[address?.line1, address?.line2, address?.landmark].filter(Boolean).join(", ")}
              {address ? `, ${address.city}, ${address.state} — ${address.pincode}` : ""}
            </p>
          </section>

          <section aria-labelledby="review-when" className="rounded-lg border border-line bg-white p-3">
            <div className="mb-1 flex items-center justify-between gap-2">
              <h4 id="review-when" className="text-sm font-semibold text-ink">Date &amp; Time</h4>
              <ChangeButton label="date and time" onClick={() => draft.setStep(3)} />
            </div>
            <p className="text-xs text-muted">
              {formatReviewDate(draft.date as string)} · {formatSlotLabel(draft.slot as string)}
            </p>
          </section>
        </div>

        <section className="flex items-center gap-3 rounded-lg border border-line bg-white p-3">
          <label htmlFor="coupon" className="shrink-0 text-xs font-semibold text-ink">Coupon code</label>
          <input
            id="coupon"
            value={couponInput}
            onChange={(e) => setCouponInput(e.target.value)}
            placeholder="Optional (e.g. SAVE20)"
            autoComplete="off"
            maxLength={30}
            className={`h-10 min-w-0 flex-1 rounded-lg border border-line bg-canvas px-3 text-sm text-ink placeholder:text-muted focus:border-brand focus:bg-white ${FOCUS_RING}`}
          />
        </section>
      </div>

      <div className="shrink-0 border-t border-line bg-panel px-3 py-2.5 sm:px-4 sm:py-3">
        <div className="flex items-center justify-between gap-3">
          <button
            type="button"
            onClick={() => draft.setStep(3)}
            disabled={!online}
            className={`h-11 rounded-lg border border-line bg-white px-4 text-sm font-semibold text-ink hover:bg-canvas disabled:opacity-50 ${FOCUS_RING}`}
          >
            Back
          </button>
          <div className="flex min-w-0 items-center gap-3 sm:gap-4">
            <div className="text-right">
              <p className="text-[10px] font-semibold uppercase tracking-wider text-muted">
                {serverTotal === null ? "Total" : "Updated Total"}
              </p>
              <p className="text-lg font-bold leading-tight text-ink sm:text-xl">₹{displayTotal}</p>
            </div>
            <button
              type="button"
              onClick={handlePay}
              disabled={!online}
              className={`h-11 whitespace-nowrap rounded-lg bg-brand px-4 text-sm font-semibold text-white shadow-sm transition-all hover:opacity-90 active:scale-[0.98] disabled:opacity-50 sm:px-6 ${
                isSubmitting ? "cursor-pointer ring-2 ring-brand ring-offset-1" : ""
              } ${FOCUS_RING}`}
            >
              {isSubmitting ? "Processing…" : serverTotal === null ? "Confirm & Pay" : `Confirm ₹${displayTotal}`}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}