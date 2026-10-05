import { useEffect, useMemo, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import { useAvailableCoupons, useBookingDraftStore, useQuote, useValidateCoupon } from "@/features/booking";
import { FOCUS_RING } from "@/components/customer/focusRing";
import { useOnlineStatus } from "@/hooks/useOnlineStatus";
import { customerPath } from "@/routes/customerPath";
import { bookingApi, type NormalizedApiError } from "@/services/bookingApi";
import { paymentApi } from "@/services/paymentApi";
import { PRICING_IS_MOCK } from "@/services/pricingApi";
import type { CreateBookingRequest } from "@/types/booking";
import { COUPON_ERROR, type PriceQuote, type QuoteRequest } from "@/types/pricing";
import { formatSlotLabel } from "./components/SlotPicker";
import CouponInput, { couponErrorText } from "./components/CouponInput";
import PriceBreakdown from "./components/PriceBreakdown";
import { formatINR } from "./formatMoney";

declare global {
  interface Window {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    Razorpay: any;
  }
}

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

const COUPON_ERROR_CODES: string[] = Object.values(COUPON_ERROR);

interface PriceNotice {
  from: number;
  to: number;
}

function minOrderOf(details: unknown): number | undefined {
  const value = (details as { minOrder?: unknown } | undefined)?.minOrder;
  return typeof value === "number" ? value : undefined;
}

export default function StepReview() {
  const draft = useBookingDraftStore();
  const navigate = useNavigate();
  const online = useOnlineStatus();

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [statusMessage, setStatusMessage] = useState("Processing your payment…");
  const [clickedWhileProcessing, setClickedWhileProcessing] = useState(false);
  const [error, setError] = useState<NormalizedApiError | { message: string } | null>(null);
  const [couponError, setCouponError] = useState<string | null>(null);
  const [priceNotice, setPriceNotice] = useState<PriceNotice | null>(null);

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

  const canSubmit = Boolean(draft.serviceId && draft.addressId && draft.date && draft.slot);

  // The quote request carries ids, quantities, date, slot and the coupon code. No amounts.
  const baseRequest = useMemo<QuoteRequest | null>(() => {
    if (!draft.serviceId || !draft.date || !draft.slot) return null;
    return {
      serviceId: draft.serviceId,
      quantity: draft.quantity,
      addOns: draft.addOns.map((a) => ({ addOnId: a.id, quantity: a.quantity })),
      date: draft.date,
      slot: draft.slot,
    };
  }, [draft.serviceId, draft.quantity, draft.addOns, draft.date, draft.slot]);

  const quoteRequest = useMemo<QuoteRequest | null>(
    () => (baseRequest ? { ...baseRequest, ...(draft.couponCode ? { couponCode: draft.couponCode } : {}) } : null),
    [baseRequest, draft.couponCode],
  );

  const { quote, isLoading, isRefreshing, isPlaceholder, isError, error: quoteError, refetch, requote } = useQuote(quoteRequest);
  const { validate, isValidating } = useValidateCoupon();
  const { coupons: availableCoupons, isLoading: couponsLoading } = useAvailableCoupons(baseRequest);

  const { setCouponCode, setStep } = draft;

  // The server dropped the coupon (expired, limit reached, order below the minimum...): remove it here too.
  useEffect(() => {
    if (!quote || isPlaceholder || !quote.couponError || !draft.couponCode) return;
    setCouponCode(null);
    setCouponError(couponErrorText(quote.couponError.code, quote.couponError.minOrder));
  }, [quote, isPlaceholder, draft.couponCode, setCouponCode]);

  const handleApplyCoupon = async (code: string) => {
    if (!baseRequest) return;
    setCouponError(null);
    setPriceNotice(null);
    try {
      const res = await validate({ ...baseRequest, couponCode: code });
      setCouponCode(res.code); // the discount itself arrives with the next server quote
    } catch (err) {
      const apiErr = err as NormalizedApiError;
      setCouponError(couponErrorText(apiErr.code, minOrderOf(apiErr.details)));
    }
  };

  const handleRemoveCoupon = () => {
    setCouponError(null);
    setPriceNotice(null);
    setCouponCode(null);
  };

  const stopSubmitting = () => {
    inFlight.current = false;
    setIsSubmitting(false);
    setClickedWhileProcessing(false);
  };

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
    setPriceNotice(null);

    // 1) Re-quote right before paying, straight from the server (cache bypassed).
    const shownTotal = quote?.total;
    let fresh: PriceQuote;
    try {
      fresh = await requote();
    } catch (err) {
      setError(err as NormalizedApiError);
      stopSubmitting();
      return;
    }

    if (fresh.couponError) {
      setCouponCode(null);
      setCouponError(couponErrorText(fresh.couponError.code, fresh.couponError.minOrder));
    }
    if (shownTotal !== undefined && fresh.total !== shownTotal) {
      // Stop here: the customer must see the new price and confirm it deliberately.
      setPriceNotice({ from: shownTotal, to: fresh.total });
      stopSubmitting();
      return;
    }

    const isSdkLoaded = await loadRazorpayScript();
    if (!isSdkLoaded) {
      setError({ message: "Failed to load Razorpay SDK. Please check your internet connection." });
      stopSubmitting();
      return;
    }

    // expectedTotal is the total the SERVER quoted, sent only so a later change is caught (409).
    // While pricing is mocked the real POST /bookings cannot reproduce the mock numbers (and still
    // rejects coupons), so both are left out; remove that branch once the real endpoints are live.
    const payload: CreateBookingRequest = {
      serviceId: draft.serviceId,
      addressId: draft.addressId,
      date: draft.date,
      slot: draft.slot,
      quantity: draft.quantity,
      addOns: draft.addOns.map((a) => ({ addOnId: a.id, quantity: a.quantity })),
      ...(PRICING_IS_MOCK ? {} : { expectedTotal: fresh.total }),
      ...(!PRICING_IS_MOCK && fresh.coupon ? { couponCode: fresh.coupon.code } : {}),
    };

    const idempotencyKey = draft.getIdempotencyKey(JSON.stringify(payload));

    try {
      // 2) Create the booking on the server.
      const { booking } = await bookingApi.createBooking(payload, idempotencyKey);
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const resolvedBookingId: string = (booking as any)._id || (booking as any).id;

      const goToFailed = (reason: "failed" | "verification" | "network") =>
        navigate(`${customerPath(`/booking/failed/${resolvedBookingId}`)}?reason=${reason}`, { replace: true });

      // 3) Create the Razorpay order. Amount is taken from the booking on the server.
      const orderData = await paymentApi.createOrder(resolvedBookingId);

      const markFailureOnServer = async (reason: string) => {
        try {
          await paymentApi.recordAttempt(resolvedBookingId, "FAILED", orderData.orderId, reason);
        } catch (e) {
          console.error("Failed to notify backend of payment failure:", e);
        }
      };

      // Short delay before opening Razorpay so the customer can read the status message.
      const remainingWaitMs = Math.max(0, PRE_POPUP_DELAY_MS - (Date.now() - startedAt));
      if (remainingWaitMs > 0) {
        setStatusMessage("Opening Razorpay checkout in a few seconds…");
        await sleep(remainingWaitMs);
      }

      if (!mounted.current) return;

      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      let rzpInstance: any = null;
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const address = draft.addressSnapshot as any;

      const options = {
        key: orderData.keyId,
        amount: orderData.amount,
        currency: orderData.currency || "INR",
        name: "HomeCareX",
        description: `Payment for ${draft.serviceName ?? "Home Service"}`,
        order_id: orderData.orderId,
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
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
          } catch (verifyErr) {
            const e = verifyErr as Partial<NormalizedApiError>;
            const uncertain = e?.code === "NETWORK_ERROR" || !e?.status;
            if (!uncertain) await markFailureOnServer(e?.message || "Payment verification failed");
            goToFailed(uncertain ? "network" : "verification");
          }
        },
        prefill: {
          name: orderData.prefill?.name || address?.recipientName || address?.name || "",
          email: orderData.prefill?.email || "",
          contact: orderData.prefill?.contact || address?.phoneNumber || address?.phone || "",
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
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      rzpInstance.on("payment.failed", async function (response: any) {
        retryCountRef.current += 1;
        const currentAttempts = retryCountRef.current;
        console.warn(`Payment failed attempt ${currentAttempts}/${MAX_PAYMENT_RETRIES}:`, response.error);

        if (currentAttempts >= MAX_PAYMENT_RETRIES && !hasExitedRef.current) {
          hasExitedRef.current = true;

          // Remove the Razorpay modal so the customer can't click retry again
          forceCloseRazorpayModal();
          try {
            if (rzpInstance && typeof rzpInstance.close === "function") {
              rzpInstance.close();
            }
          } catch {
            /* modal already gone */
          }

          setIsSubmitting(true);
          setStatusMessage("Maximum retries (3) reached. Payment failed.");

          const reason = response.error?.description || "Payment failed 3 times (Max attempts exceeded)";
          await markFailureOnServer(reason);

          // Show the failure page (draft is kept so "Retry Payment" works)
          goToFailed("failed");
        }
      });

      rzpInstance.open();
    } catch (err) {
      stopSubmitting();
      const apiErr = err as NormalizedApiError;

      if (apiErr.code === "PRICE_CHANGED") {
        const d = apiErr.details as { expectedTotal?: number; total?: number } | undefined;
        setPriceNotice({ from: d?.expectedTotal ?? fresh.total, to: d?.total ?? fresh.total });
        void requote().catch(() => undefined); // refresh the breakdown with the server's numbers
        return;
      }

      if (COUPON_ERROR_CODES.includes(apiErr.code)) {
        setCouponCode(null);
        setCouponError(
          apiErr.code === COUPON_ERROR.INVALID ? apiErr.message : couponErrorText(apiErr.code, minOrderOf(apiErr.details)),
        );
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
        setStep(backStep);
        return;
      }

      if (apiErr.status === 401) {
        setError({ ...apiErr, message: "Please log in to confirm your booking. Your details are saved." });
        return;
      }

      setError(apiErr.message ? apiErr : { message: "An unexpected error occurred." });
    }
  };

  if (!canSubmit) {
    return (
      <div className="py-8 text-center text-sm text-muted">
        Some details are missing. Please complete the earlier steps first.
      </div>
    );
  }

  const quoteReady = Boolean(quote) && !isPlaceholder && !isRefreshing && !isError;
  // While submitting the button stays clickable so a second tap shows "already processing" instead of nothing.
  const payDisabled = !quoteReady || !online;

  return (
    <div className="min-w-0 space-y-3">
      <div className="flex flex-wrap items-baseline justify-between gap-x-4 border-b border-line pb-2">
        <h3 className="text-lg font-semibold text-ink">Review &amp; Pay</h3>
        <p className="text-sm text-muted">Double-check everything before you confirm.</p>
      </div>

      {!online && (
        <div role="status" className="rounded border border-line bg-accent-soft px-3 py-2 text-sm text-ink">
          You're offline. Reconnect to see the latest price and pay.
        </div>
      )}

      {isSubmitting && (
        <div
          role="status"
          aria-live="polite"
          className={`flex items-start gap-2.5 rounded border px-3 py-2 text-sm text-ink ${
            clickedWhileProcessing ? "border-amber-300 bg-amber-50" : "border-line bg-canvas"
          }`}
        >
          <span
            aria-hidden="true"
            className="mt-0.5 h-3.5 w-3.5 shrink-0 animate-spin rounded-full border-2 border-brand border-t-transparent"
          />
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
        <div role="alert" className="rounded border border-danger bg-danger-soft px-3 py-2 text-sm text-ink">
          {error.message}
        </div>
      )}

      {priceNotice && (
        <div role="alert" className="rounded border border-amber-500 bg-amber-50 px-3 py-2 text-sm text-ink">
          The price changed from {formatINR(priceNotice.from)} to {formatINR(priceNotice.to)}. Please review the updated
          breakdown and confirm again.
        </div>
      )}

      <div className="grid min-w-0 gap-3 lg:grid-cols-[minmax(0,1fr)_minmax(300px,360px)] lg:items-start lg:gap-4">
        {/* Left / main column: where, when, coupon */}
        <div className="min-w-0 space-y-3">
          <div className="grid min-w-0 gap-3 sm:grid-cols-2">
            <section className="min-w-0 rounded border border-line bg-panel px-3 py-2">
              <h4 className="text-xs font-semibold uppercase tracking-wide text-muted">Address</h4>
              <p className="mt-0.5 break-words text-sm text-ink">
                {draft.addressSnapshot?.line1}, {draft.addressSnapshot?.city}, {draft.addressSnapshot?.state} —{" "}
                {draft.addressSnapshot?.pincode}
              </p>
            </section>

            <section className="min-w-0 rounded border border-line bg-panel px-3 py-2">
              <h4 className="text-xs font-semibold uppercase tracking-wide text-muted">Date &amp; Time</h4>
              <p className="mt-0.5 break-words text-sm text-ink">
                {draft.date} · {formatSlotLabel(draft.slot ?? "")}
              </p>
            </section>
          </div>

          <section className="min-w-0 rounded border border-line bg-panel p-3">
            <CouponInput
              appliedCode={draft.couponCode}
              savedAmount={quote?.coupon && !isPlaceholder && quote.coupon.code === draft.couponCode ? quote.discount : null}
              isApplying={isValidating}
              errorMessage={couponError}
              disabled={!online || isSubmitting}
              onApply={handleApplyCoupon}
              onRemove={handleRemoveCoupon}
              onInputChange={() => setCouponError(null)}
              availableCoupons={availableCoupons}
              couponsLoading={couponsLoading}
            />
          </section>
        </div>

        {/* Right column: price summary + payment (sticky on desktop) */}
        <aside className="min-w-0 space-y-3 lg:sticky lg:top-3">
          <section className="min-w-0 rounded border border-line bg-panel p-3">
            <h4 className="mb-2 text-sm font-semibold text-ink">Price Summary</h4>
            <PriceBreakdown
              quote={quote}
              isLoading={isLoading}
              isRefreshing={isRefreshing || isPlaceholder}
              isError={isError}
              errorMessage={quoteError?.message}
              onRetry={refetch}
            />
          </section>

          <section className="min-w-0 space-y-3 rounded border border-brand bg-panel p-3">
            <div className="flex items-baseline justify-between gap-3">
              <p className="text-sm text-muted">Total payable</p>
              <p className="text-xl font-semibold tabular-nums text-ink" aria-live="polite">
                {quoteReady && quote ? formatINR(quote.total) : "—"}
              </p>
            </div>
            <div className="grid grid-cols-[auto_minmax(0,1fr)] gap-2">
              <button
                type="button"
                onClick={() => draft.setStep(3)} // Goes back to Date & Time
                disabled={isSubmitting}
                className={`min-h-[44px] rounded border border-line bg-white px-5 text-sm font-medium text-ink hover:bg-canvas disabled:opacity-50 ${FOCUS_RING}`}
              >
                Back
              </button>
              <button
                type="button"
                onClick={handlePay}
                disabled={payDisabled}
                aria-busy={isSubmitting}
                className={`min-h-[44px] min-w-0 rounded bg-brand px-4 text-sm font-medium text-white hover:opacity-90 disabled:opacity-50 ${FOCUS_RING}`}
              >
                {isSubmitting ? "Processing…" : "Confirm & Pay"}
              </button>
            </div>
          </section>
        </aside>
      </div>
    </div>
  );
}
