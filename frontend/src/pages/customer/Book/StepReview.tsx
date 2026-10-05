import { useEffect, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import { useAvailableCoupons, useBookingDraftStore, useQuote, useValidateCoupon } from "@/features/booking";
import { FOCUS_RING } from "@/components/customer/focusRing";
import { useOnlineStatus } from "@/hooks/useOnlineStatus";
import { customerPath } from "@/routes/customerPath";
import { bookingApi, type NormalizedApiError, type PaymentInit } from "@/services/bookingApi";
import { PRICING_IS_MOCK } from "@/services/pricingApi";
import { openRazorpayCheckout, RazorpayCancelledError, RazorpayFailedError } from "@/services/razorpay";
import type { CreateBookingRequest } from "@/types/booking";
import { COUPON_ERROR, type PriceQuote, type QuoteRequest } from "@/types/pricing";
import { formatSlotLabel } from "./components/SlotPicker";
import CouponInput, { couponErrorText } from "./components/CouponInput";
import PriceBreakdown from "./components/PriceBreakdown";
import { formatINR } from "./formatMoney";

const ERROR_TO_STEP: Record<string, number> = {
  SERVICE_NOT_FOUND: 1,
  ADDON_NOT_FOUND: 1,
  ADDRESS_NOT_SERVICEABLE: 2,
  ADDRESS_NOT_FOUND: 2,
  SLOT_UNAVAILABLE: 3,
  SLOT_BUSY: 3,
  INVALID_DATE: 3,
};

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
  const [error, setError] = useState<NormalizedApiError | null>(null);
  const [couponError, setCouponError] = useState<string | null>(null);
  const [priceNotice, setPriceNotice] = useState<PriceNotice | null>(null);
  const [idempotencyKey, setIdempotencyKey] = useState(() => crypto.randomUUID());
  const inFlight = useRef(false);

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

  const quoteTotal = quote?.total;
  const { setCouponCode, setStep } = draft;

  // A new payload needs a new Idempotency-Key, otherwise the server answers 409 IDEMPOTENCY_KEY_REUSED.
  const addOnsKey = JSON.stringify(draft.addOns);
  useEffect(() => {
    setIdempotencyKey(crypto.randomUUID());
  }, [draft.serviceId, draft.addressId, draft.date, draft.slot, draft.quantity, addOnsKey, draft.couponCode, quoteTotal]);

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

  /**
   * Opens Razorpay for the order the backend created, then asks the backend to verify the signature.
   * Returns true when the booking is paid (or needs no online payment), false when the user should stay
   * on this step (cancelled / failed). The booking already exists at this point; retrying with the same
   * Idempotency-Key replays it instead of creating a duplicate.
   */
 const collectPayment = async (
  bookingId: string,
  payment: PaymentInit | undefined
): Promise<boolean> => {
  /*
   * IMPORTANT:
   * If this booking is ALWAYS supposed to use Razorpay,
   * missing payment information is an error.
   */
  if (!payment) {
    console.error(
      "[Payment] Backend did not return payment initialization."
    );

    setError({
      status: 500,
      code: "PAYMENT_INIT_MISSING",
      message:
        "The booking was created, but the server did not create a Razorpay payment order. Please try again.",
    });

    return false;
  }

  const keyId =
    payment.keyId ??
    import.meta.env.VITE_RAZORPAY_KEY_ID;

  if (!keyId) {
    console.error(
      "[Payment] Razorpay Key ID is missing."
    );

    setError({
      status: 500,
      code: "RAZORPAY_KEY_MISSING",
      message:
        "Online payment is not configured. Razorpay Key ID is missing.",
    });

    return false;
  }

  if (!payment.orderId) {
    console.error(
      "[Payment] Razorpay order ID is missing:",
      payment
    );

    setError({
      status: 500,
      code: "RAZORPAY_ORDER_MISSING",
      message:
        "The server did not return a Razorpay order ID.",
    });

    return false;
  }

  if (
    !Number.isFinite(payment.amount) ||
    payment.amount <= 0
  ) {
    console.error(
      "[Payment] Invalid amount:",
      payment.amount
    );

    setError({
      status: 500,
      code: "RAZORPAY_AMOUNT_INVALID",
      message:
        "The server returned an invalid payment amount.",
    });

    return false;
  }

  console.log(
    "[Payment] Starting Razorpay Checkout:",
    {
      bookingId,
      keyId,
      orderId: payment.orderId,
      amount: payment.amount,
      currency: payment.currency,
    }
  );

  let result;

  try {
    result = await openRazorpayCheckout({
      key: keyId,

      orderId: payment.orderId,

      amount: payment.amount,

      currency:
        payment.currency || "INR",

      name: "HomeCareX",

      description:
        "Home service booking",
    });
  } catch (err) {
    console.error(
      "[Payment] Razorpay Checkout error:",
      err
    );

    if (
      err instanceof RazorpayCancelledError
    ) {
      setError({
        status: 0,
        code: "PAYMENT_CANCELLED",
        message:
          "Payment was cancelled. Your booking is saved. Tap Confirm & Pay to try again.",
      });
    } else if (
      err instanceof RazorpayFailedError
    ) {
      setError({
        status: 0,
        code: "PAYMENT_FAILED",
        message: err.message,
      });
    } else {
      setError({
        status: 0,
        code: "PAYMENT_FAILED",
        message:
          "Payment could not be completed. Please try again.",
      });
    }

    return false;
  }

  console.log(
    "[Payment] Razorpay returned success:",
    result
  );

  try {
    await bookingApi.verifyPayment(
      bookingId,
      result
    );

    console.log(
      "[Payment] Backend verification succeeded."
    );

    return true;
  } catch (err) {
    console.error(
      "[Payment] Verification failed:",
      err
    );

    const apiErr =
      err as NormalizedApiError;

    setError({
      ...apiErr,

      message:
        `We received your payment ` +
        `(ref ${result.razorpay_payment_id}) ` +
        `but could not confirm it yet. ` +
        `Please don't pay again. Contact support with this reference.`,
    });

    return false;
  }
};

  const handlePay = async () => {
    if (!canSubmit || inFlight.current || !online) return;
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
    let leaving = false;

    const idempotencyKey = draft.getIdempotencyKey(JSON.stringify(payload));

    try {
      // Re-quote right before paying, straight from the server (cache bypassed).
      const shownTotal = quote?.total;
      let fresh: PriceQuote;
      try {
        fresh = await requote();
      } catch (err) {
        setError(err as NormalizedApiError);
        return;
      }

      if (fresh.couponError) {
        setCouponCode(null);
        setCouponError(couponErrorText(fresh.couponError.code, fresh.couponError.minOrder));
      }
      if (shownTotal !== undefined && fresh.total !== shownTotal) {
        // Stop here: the customer must see the new price and confirm it deliberately.
        setPriceNotice({ from: shownTotal, to: fresh.total });
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

      // 1) Create the booking (and the Razorpay order) on the server.
      let created;
      try {
        created = await bookingApi.createBooking(payload, idempotencyKey);
      } catch (err) {
        const apiErr = err as NormalizedApiError;
        const backStep = ERROR_TO_STEP[apiErr.code];

        if (apiErr.code === "PRICE_CHANGED") {
          const d = apiErr.details as { expectedTotal?: number; total?: number } | undefined;
          setPriceNotice({ from: d?.expectedTotal ?? fresh.total, to: d?.total ?? fresh.total });
          void requote().catch(() => undefined); // refresh the breakdown with the server's numbers
        } else if (COUPON_ERROR_CODES.includes(apiErr.code)) {
          setCouponCode(null);
          setCouponError(apiErr.code === COUPON_ERROR.INVALID ? apiErr.message : couponErrorText(apiErr.code, minOrderOf(apiErr.details)));
        } else if (apiErr.status === 401) {
          setError({ ...apiErr, message: "Please log in to confirm your booking. Your details are saved." });
        } else {
          setError(apiErr);
        }
        if (backStep) setStep(backStep);
        return;
      }

      // 2) Open Razorpay and verify the payment. Stay on this step if the customer cancels or it fails.
      const paid = await collectPayment(created.booking._id, created.payment);
      if (!paid) return;

      // 3) Leave the wizard FIRST. Clearing the draft while it is still mounted makes its step guard
      // fall back to step 1 and rewrite the URL, cancelling this navigation. The confirmation page
      // clears the draft once the wizard is gone. `replace` keeps Back from re-opening step 4.
      leaving = true;
      navigate(customerPath(`/bookings/${created.booking._id}`), { state: { justBooked: true }, replace: true });
    } finally {
      inFlight.current = false;
      if (!leaving) setIsSubmitting(false);
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
  const payDisabled = isSubmitting || !quoteReady || !online;

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
                className={`min-h-[44px] min-w-0 rounded bg-brand px-4 text-sm font-medium text-white hover:opacity-90 disabled:opacity-50 ${FOCUS_RING}`}
              >
                {isSubmitting ? "Confirming…" : "Confirm & Pay"}
              </button>
            </div>
          </section>
        </aside>
      </div>
    </div>
  );
}