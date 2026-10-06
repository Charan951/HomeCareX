import { useEffect, useLayoutEffect, useMemo, useRef, useState } from "react";

import { useNavigate } from "react-router-dom";

import {
  useAvailableCoupons,
  useBookingDraftStore,
  useQuote,
  useValidateCoupon,
} from "@/features/booking";

import { FOCUS_RING } from "@/components/customer/focusRing";

import { useOnlineStatus } from "@/hooks/useOnlineStatus";

import { customerPath } from "@/routes/customerPath";

import { bookingApi, type NormalizedApiError } from "@/services/bookingApi";

import { paymentApi } from "@/services/paymentApi";

import { PRICING_IS_MOCK } from "@/services/pricingApi";

import type { CreateBookingRequest } from "@/types/booking";

import {
  COUPON_ERROR,
  type PriceQuote,
  type QuoteRequest,
} from "@/types/pricing";

import { formatSlotLabel } from "./components/SlotPicker";

import { couponErrorText } from "./components/CouponInput";

import PriceBreakdown from "./components/PriceBreakdown";

import { formatINR } from "./formatMoney";

import { PaymentResult } from "@/components/customer/payments";

import {
  CHECKOUT_METHODS,
  forceCloseRazorpayModal,
  loadRazorpayScript,
  type RazorpayFailure,
  type RazorpayInstance,
  type RazorpaySuccess,
} from "@/features/payments";

import type { CheckoutMethod } from "@/types/payment";

type RazorpayCheckoutMethod = "upi" | "card" | "netbanking" | "wallet";

function toRazorpayCheckoutMethod(
  method: Exclude<CheckoutMethod, "cod">,
): RazorpayCheckoutMethod | undefined {
  return method === "upi" ||
    method === "card" ||
    method === "netbanking" ||
    method === "wallet"
    ? method
    : undefined;
}

const PRE_POPUP_DELAY_MS = 2000; // Reduced delay so it opens faster

const MAX_PAYMENT_RETRIES = 3;

const sleep = (ms: number) =>
  new Promise<void>((resolve) => setTimeout(resolve, ms));

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

const SLOT_TAKEN_NOTICE =
  "That time slot was just taken by someone else. Please pick another slot.";

const COUPON_ERROR_CODES: string[] = Object.values(COUPON_ERROR);

interface PriceNotice {
  from: number;

  to: number;
}

function minOrderOf(details: unknown): number | undefined {
  const value = (details as { minOrder?: unknown } | undefined)?.minOrder;

  return typeof value === "number" ? value : undefined;
}

type CompactCoupon = {
  code?: string;

  description?: string;

  subtitle?: string;

  title?: string;

  discountText?: string;

  discountType?: string;

  discountValue?: number;

  maxDiscount?: number;

  minOrder?: number;

  serviceName?: string;
};

function compactCouponDescription(coupon: CompactCoupon): string {
  const direct = coupon.description ?? coupon.subtitle ?? coupon.discountText;

  if (direct) return direct;

  const value = coupon.discountValue;

  const type = coupon.discountType?.toLowerCase();

  const parts: string[] = [];

  if (typeof value === "number") {
    if (type?.includes("percent")) parts.push(`${value}% off`);
    else parts.push(`${formatINR(value)} off`);
  }

  if (typeof coupon.maxDiscount === "number")
    parts.push(`up to ${formatINR(coupon.maxDiscount)}`);

  if (typeof coupon.minOrder === "number")
    parts.push(`min. ${formatINR(coupon.minOrder)}`);

  if (coupon.serviceName) parts.push(coupon.serviceName);

  return parts.join(" · ") || coupon.title || "Available offer";
}

/**

 * Fits the review screen inside the visible viewport.

 *

 * Mobile uses a compact two-column review layout and then scales the review

 * just enough to keep the whole card above the app bottom navigation. This

 * keeps the screen visually close to the supplied mobile reference while

 * still recalculating when View more / Show less changes coupon height.

 * Desktop keeps the existing conservative 0.88 floor.

 */

const MOBILE_BOTTOM_NAV_RESERVE_PX = 54;

function useViewportFit(enabled: boolean) {
  const frameRef = useRef<HTMLDivElement>(null);

  const contentRef = useRef<HTMLDivElement>(null);

  const [fit, setFit] = useState({ scale: 1, height: 0 });

  useLayoutEffect(() => {
    if (!enabled) return;

    const frame = frameRef.current;

    const content = contentRef.current;

    if (!frame || !content) return;

    const desktop = window.matchMedia("(min-width: 1024px)");

    const visualViewport = window.visualViewport;

    let raf = 0;

    const measure = () => {
      cancelAnimationFrame(raf);

      raf = requestAnimationFrame(() => {
        const top = Math.max(0, frame.getBoundingClientRect().top);

        const viewportHeight = visualViewport?.height ?? window.innerHeight;

        const naturalHeight = Math.max(1, content.scrollHeight);

        if (desktop.matches) {
          const availableHeight = Math.max(420, window.innerHeight - top - 8);

          const scale = Math.max(
            0.88,
            Math.min(1, availableHeight / naturalHeight),
          );

          const height = Math.ceil(naturalHeight * scale);

          setFit((current) => {
            if (
              Math.abs(current.scale - scale) < 0.004 &&
              Math.abs(current.height - height) < 2
            ) {
              return current;
            }

            return { scale, height };
          });

          return;
        }

        // Mobile: keep the full review above the fixed app bottom navigation.

        // The compact mobile layout below reduces the amount of scaling needed,

        // while still allowing the expanded coupon list to fit without scrolling.

        const availableHeight = Math.max(
          1,
          viewportHeight - top - MOBILE_BOTTOM_NAV_RESERVE_PX,
        );

        const scale = Math.min(1, availableHeight / naturalHeight);

        const height = Math.ceil(naturalHeight * scale);

        setFit((current) => {
          if (
            Math.abs(current.scale - scale) < 0.004 &&
            Math.abs(current.height - height) < 2
          ) {
            return current;
          }

          return { scale, height };
        });
      });
    };

    const observer =
      typeof ResizeObserver !== "undefined"
        ? new ResizeObserver(measure)
        : null;

    observer?.observe(frame);

    observer?.observe(content);

    desktop.addEventListener?.("change", measure);

    visualViewport?.addEventListener("resize", measure);

    window.addEventListener("resize", measure);

    window.addEventListener("orientationchange", measure);

    measure();

    return () => {
      cancelAnimationFrame(raf);

      observer?.disconnect();

      desktop.removeEventListener?.("change", measure);

      visualViewport?.removeEventListener("resize", measure);

      window.removeEventListener("resize", measure);

      window.removeEventListener("orientationchange", measure);
    };
  }, [enabled]);

  return { frameRef, contentRef, fit };
}

export default function StepReview() {
  const draft = useBookingDraftStore();

  const navigate = useNavigate();

  const online = useOnlineStatus();

  const [isSubmitting, setIsSubmitting] = useState(false);

  const [statusMessage, setStatusMessage] = useState(
    "Processing your payment…",
  );

  const [clickedWhileProcessing, setClickedWhileProcessing] = useState(false);

  const [error, setError] = useState<
    NormalizedApiError | { message: string } | null
  >(null);

  const [couponError, setCouponError] = useState<string | null>(null);

  const [priceNotice, setPriceNotice] = useState<PriceNotice | null>(null);

  const [method, setMethod] = useState<CheckoutMethod>("upi");

  const [couponDraft, setCouponDraft] = useState(draft.couponCode ?? "");

  // Mobile coupon list starts compact and expands only when the customer asks.

  const [showAllCoupons, setShowAllCoupons] = useState(false);

  const inFlight = useRef(false);

  const mounted = useRef(true);

  const retryCountRef = useRef(0);

  const hasExitedRef = useRef(false);

  useEffect(() => {
    setCouponDraft(draft.couponCode ?? "");
  }, [draft.couponCode]);

  useEffect(() => {
    mounted.current = true;

    return () => {
      mounted.current = false;

      forceCloseRazorpayModal();
    };
  }, []);

  const canSubmit = Boolean(
    draft.serviceId && draft.addressId && draft.date && draft.slot,
  );

  const { frameRef, contentRef, fit } = useViewportFit(canSubmit);

  const baseRequest = useMemo<QuoteRequest | null>(() => {
    if (!draft.serviceId || !draft.date || !draft.slot) return null;

    return {
      serviceId: draft.serviceId,

      quantity: draft.quantity,

      addOns: draft.addOns.map((a) => ({
        addOnId: a.id,
        quantity: a.quantity,
      })),

      date: draft.date,

      slot: draft.slot,
    };
  }, [draft.serviceId, draft.quantity, draft.addOns, draft.date, draft.slot]);

  const quoteRequest = useMemo<QuoteRequest | null>(
    () =>
      baseRequest
        ? {
            ...baseRequest,
            ...(draft.couponCode ? { couponCode: draft.couponCode } : {}),
          }
        : null,

    [baseRequest, draft.couponCode],
  );

  const {
    quote,
    isLoading,
    isRefreshing,
    isPlaceholder,
    isError,
    error: quoteError,
    refetch,
    requote,
  } = useQuote(quoteRequest);

  const { validate, isValidating } = useValidateCoupon();

  const { coupons: availableCoupons, isLoading: couponsLoading } =
    useAvailableCoupons(baseRequest);

  const { setCouponCode, setStep } = draft;

  useEffect(() => {
    if (!quote || isPlaceholder || !quote.couponError || !draft.couponCode)
      return;

    setCouponCode(null);

    setCouponError(
      couponErrorText(quote.couponError.code, quote.couponError.minOrder),
    );
  }, [quote, isPlaceholder, draft.couponCode, setCouponCode]);

  const handleApplyCoupon = async (code: string) => {
    if (!baseRequest) return;

    setCouponError(null);

    setPriceNotice(null);

    try {
      const res = await validate({ ...baseRequest, couponCode: code });

      setCouponCode(res.code);
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

  const handlePay = async (selectedMethod?: CheckoutMethod) => {
    const activeMethod = selectedMethod ?? method;

    if (inFlight.current) {
      setClickedWhileProcessing(true);

      return;
    }

    if (!online) return;

    if (!draft.serviceId || !draft.addressId || !draft.date || !draft.slot)
      return;

    inFlight.current = true;

    hasExitedRef.current = false;

    retryCountRef.current = 0;

    const startedAt = Date.now();

    setIsSubmitting(true);

    setStatusMessage("Processing your payment. Please wait a moment…");

    setClickedWhileProcessing(false);

    setError(null);

    setPriceNotice(null);

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

      setCouponError(
        couponErrorText(fresh.couponError.code, fresh.couponError.minOrder),
      );
    }

    if (quote?.total !== undefined && fresh.total !== quote.total) {
      setPriceNotice({ from: quote.total, to: fresh.total });

      stopSubmitting();

      return;
    }

    const isSdkLoaded =
      activeMethod === "cod" ? true : await loadRazorpayScript();

    if (!isSdkLoaded) {
      setError({
        message:
          "Could not load the secure payment window. Check your internet connection.",
      });

      stopSubmitting();

      return;
    }

    const payload: CreateBookingRequest = {
      serviceId: draft.serviceId,

      addressId: draft.addressId,

      date: draft.date,

      slot: draft.slot,

      quantity: draft.quantity,

      addOns: draft.addOns.map((a) => ({
        addOnId: a.id,
        quantity: a.quantity,
      })),

      ...(PRICING_IS_MOCK ? {} : { expectedTotal: fresh.total }),

      ...(!PRICING_IS_MOCK && fresh.coupon
        ? { couponCode: fresh.coupon.code }
        : {}),
    };

    const idempotencyKey = draft.getIdempotencyKey(JSON.stringify(payload));

    try {
      const { booking } = await bookingApi.createBooking(
        payload,
        idempotencyKey,
      );

      const resolvedBookingId: string = booking._id;

      const goToFailed = (
        reason: "failed" | "verification" | "network" | "cancelled",
      ) =>
        navigate(
          `${customerPath(`/booking/failed/${resolvedBookingId}`)}?reason=${reason}`,
          { replace: true },
        );

      // Cash on Service Bypass: Immediately confirm booking, leave payment as PENDING

      if (activeMethod === "cod") {
        setStatusMessage("Confirming your booking…");

        await paymentApi.confirmCod(resolvedBookingId);

        navigate(`${customerPath(`/booking/booked/${resolvedBookingId}`)}`, {
          replace: true,
        });

        return;
      }

      // Online Payment Methods

      const orderData = await paymentApi.createOrder(resolvedBookingId);

      // CRITICAL CHECK: Ensure backend returned the key and order ID

      if (!orderData.orderId || !orderData.keyId) {
        throw new Error(
          "Invalid payment gateway response. Developer: Ensure backend returns both 'orderId' and 'keyId'.",
        );
      }

      // Safety guard: this screen is intentionally wired to Razorpay TEST mode.

      // A Razorpay test key always starts with `rzp_test_`. Never open Checkout

      // with a live key from this flow, so test clicks cannot create real charges.

      if (!orderData.keyId.startsWith("rzp_test_")) {
        throw new Error(
          "Razorpay test mode is required, but the backend returned a live key. Configure the backend with Razorpay TEST credentials (rzp_test_...).",
        );
      }

      const markFailureOnServer = async (reason: string) => {
        try {
          await paymentApi.recordAttempt(
            resolvedBookingId,
            "FAILED",
            orderData.orderId,
            reason,
          );
        } catch (e) {
          console.error("Failed to notify backend of payment failure:", e);
        }
      };

      const remainingWaitMs = Math.max(
        0,
        PRE_POPUP_DELAY_MS - (Date.now() - startedAt),
      );

      if (remainingWaitMs > 0) {
        setStatusMessage("Opening Razorpay checkout in a few seconds…");

        await sleep(remainingWaitMs);
      }

      if (!mounted.current) return;

      const address = draft.addressSnapshot;

      const onlineMethod: Exclude<CheckoutMethod, "cod"> =
        activeMethod as Exclude<CheckoutMethod, "cod">;

      const preferredRazorpayMethod = toRazorpayCheckoutMethod(onlineMethod);

      const prefillName = orderData.prefill?.name || address?.contactName || "";

      const prefillEmail = orderData.prefill?.email || "";

      const prefillContact =
        orderData.prefill?.contact || address?.contactPhone || "";

      const options = {
        key: orderData.keyId, // Test key is enforced above.

        amount: orderData.amount,

        currency: orderData.currency || "INR",

        name: "HomeCareX",

        description: `Payment for ${draft.serviceName ?? "Home Service"}`,

        order_id: orderData.orderId,

        // Do not restrict Checkout with the `method` option here. Restricting the

        // checkout to one unavailable method can make Razorpay show

        // "No appropriate payment method found." Checkout is allowed to show all

        // payment methods enabled for this Razorpay test account.

        handler: async function (response: RazorpaySuccess) {
          hasExitedRef.current = true;

          setIsSubmitting(true);

          setStatusMessage("Verifying your payment with bank…");

          try {
            await paymentApi.verify(resolvedBookingId, {
              razorpay_order_id: response.razorpay_order_id,

              razorpay_payment_id: response.razorpay_payment_id,

              razorpay_signature: response.razorpay_signature,
            });

            navigate(customerPath(`/booking/success/${resolvedBookingId}`), {
              replace: true,
            });
          } catch (verifyErr) {
            const e = verifyErr as Partial<NormalizedApiError>;

            const uncertain = e?.code === "NETWORK_ERROR" || !e?.status;

            if (!uncertain)
              await markFailureOnServer(
                e?.message || "Payment verification failed",
              );

            goToFailed(uncertain ? "network" : "verification");
          }
        },

        prefill: {
          name: prefillName,

          email: prefillEmail,

          contact: prefillContact,

          // Razorpay can pre-select a method when both email and contact are

          // available. If either is missing, Checkout still opens normally with

          // all payment methods enabled for the Razorpay account.

          ...(preferredRazorpayMethod && prefillEmail && prefillContact
            ? { method: preferredRazorpayMethod }
            : {}),
        },

        retry: {
          enabled: true,
        },

        theme: {
          color: "#0066FF",
        },

        modal: {
          ondismiss: async function () {
            if (hasExitedRef.current) return;

            hasExitedRef.current = true;

            setIsSubmitting(true);

            setStatusMessage("Payment cancelled…");

            await paymentApi.recordAttempt(
              resolvedBookingId,
              "CANCELLED",
              orderData.orderId,
              "Customer closed the checkout",
            );

            forceCloseRazorpayModal();

            goToFailed("cancelled");
          },
        },
      };

      if (!window.Razorpay) throw new Error("Payment window is not available");

      try {
        const rzpInstance: RazorpayInstance = new window.Razorpay(options);

        rzpInstance.on(
          "payment.failed",
          async function (response: RazorpayFailure) {
            retryCountRef.current += 1;

            const currentAttempts = retryCountRef.current;

            if (
              currentAttempts >= MAX_PAYMENT_RETRIES &&
              !hasExitedRef.current
            ) {
              hasExitedRef.current = true;

              forceCloseRazorpayModal();

              try {
                rzpInstance.close();
              } catch {
                /* ignore */
              }

              setIsSubmitting(true);

              setStatusMessage("Maximum retries (3) reached. Payment failed.");

              await markFailureOnServer(
                response.error?.description || "Payment failed 3 times",
              );

              goToFailed("failed");
            }
          },
        );

        rzpInstance.open();
      } catch (razorpayErr) {
        throw new Error(
          `Razorpay Initialization Error: ${razorpayErr instanceof Error ? razorpayErr.message : String(razorpayErr)}`,
        );
      }
    } catch (err) {
      stopSubmitting();

      const apiErr = err as NormalizedApiError;

      if (apiErr.code === "PRICE_CHANGED") {
        const d = apiErr.details as
          | { expectedTotal?: number; total?: number }
          | undefined;

        setPriceNotice({
          from: d?.expectedTotal ?? fresh.total,
          to: d?.total ?? fresh.total,
        });

        void requote().catch(() => undefined);

        return;
      }

      if (COUPON_ERROR_CODES.includes(apiErr.code)) {
        setCouponCode(null);

        setCouponError(
          apiErr.code === COUPON_ERROR.INVALID
            ? apiErr.message
            : couponErrorText(apiErr.code, minOrderOf(apiErr.details)),
        );

        return;
      }

      if (
        ["HOLD_EXPIRED", "BOOKING_NOT_PAYABLE", "ALREADY_PAID"].includes(
          apiErr.code,
        )
      ) {
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

          draft.setNotice(
            apiErr.code === "INVALID_DATE" ? apiErr.message : SLOT_TAKEN_NOTICE,
          );
        } else {
          draft.setNotice(apiErr.message);
        }

        setStep(backStep);

        return;
      }

      setError(
        apiErr.message ? apiErr : { message: "An unexpected error occurred." },
      );
    }
  };

  if (!canSubmit) {
    return (
      <div className="py-8 text-center text-sm text-muted">
        Some details are missing. Please complete the earlier steps first.
      </div>
    );
  }

  const quoteReady =
    Boolean(quote) && !isPlaceholder && !isRefreshing && !isError;

  const payDisabled = !quoteReady || !online;

  const compactCoupons = (Array.isArray(availableCoupons)
    ? availableCoupons
    : []) as unknown as CompactCoupon[];

  const mobileCoupons = showAllCoupons
    ? compactCoupons
    : compactCoupons.slice(0, 2);

  const hiddenCouponCount = Math.max(compactCoupons.length - 2, 0);

  return (
    <div
      ref={frameRef}
      className="relative mx-auto min-w-0 max-w-[362px] overflow-hidden px-2 sm:max-w-none sm:px-0"
      style={fit.height ? { height: `${fit.height}px` } : undefined}
    >
      <div
        ref={contentRef}
        className="min-w-0 space-y-1.5 sm:space-y-2 lg:space-y-1.5"
        style={{
          transform: `scale(${fit.scale})`,

          transformOrigin: "top left",

          width: fit.scale < 0.999 ? `${100 / fit.scale}%` : "100%",
        }}
      >
        <header className="hidden min-w-0 items-center justify-between gap-2 border-b border-line pb-2 sm:flex lg:pb-1.5">
          <div className="min-w-0">
            <h3 className="text-base font-semibold leading-5 text-ink sm:text-[17px] sm:leading-6">
              Review &amp; Pay
            </h3>

            <p className="mt-0.5 hidden text-xs leading-4 text-muted sm:block">
              Confirm booking details, offers, payment method, and total.
            </p>
          </div>

          <span className="shrink-0 rounded-full bg-accent-soft px-1.5 py-0.5 text-[9px] font-semibold text-brand sm:px-2 sm:text-[10px]">
            Final step
          </span>
        </header>

        {!online && (
          <div
            role="status"
            className="rounded border border-line bg-accent-soft px-2.5 py-1.5 text-xs text-ink"
          >
            You're offline. Reconnect to refresh the latest price and continue.
          </div>
        )}

        {isSubmitting && (
          <PaymentResult
            phase={
              clickedWhileProcessing
                ? "processing"
                : method === "cod"
                  ? "processing"
                  : "pending"
            }
            message={
              clickedWhileProcessing
                ? "Please wait a moment. You will not be charged twice."
                : `${statusMessage} Please don't refresh or close this page.`
            }
          />
        )}

        {error && (
          <div
            role="alert"
            className="rounded border border-danger bg-danger-soft px-2.5 py-1.5 text-xs text-ink"
          >
            {error.message}
          </div>
        )}

        {priceNotice && (
          <div
            role="alert"
            className="rounded border border-amber-500 bg-amber-50 px-2.5 py-1.5 text-xs text-ink"
          >
            The price changed from {formatINR(priceNotice.from)} to{" "}
            {formatINR(priceNotice.to)}. Review the updated total and confirm
            again.
          </div>
        )}

        {/* Mobile: compact, readable single-card review inspired by the reference screens. */}

        <div className="sm:hidden">
          <section className="overflow-hidden rounded-2xl border border-line bg-panel shadow-sm">
            <div className="flex items-center justify-between gap-2 border-b border-line px-3 py-1.5">
              <div className="min-w-0">
                <h3 className="text-[16px] font-semibold leading-5 text-ink">
                  Review &amp; Pay
                </h3>

                <p className="mt-0.5 text-[11px] leading-4 text-muted">
                  Check your booking before payment.
                </p>
              </div>

              <span className="shrink-0 rounded-full bg-accent-soft px-2 py-0.5 text-[10px] font-semibold text-brand">
                Final step
              </span>
            </div>

            <div className="divide-y divide-line">
              {/* Booking details */}

              <div className="px-3 py-1">
                <div className="mb-1 flex items-center justify-between gap-2">
                  <p className="text-[10px] font-semibold uppercase tracking-wide text-muted">
                    Booking summary
                  </p>

                  <button
                    type="button"
                    onClick={() => draft.setStep(1)}
                    disabled={isSubmitting}
                    className={`text-[10px] font-semibold text-brand hover:underline disabled:opacity-50 ${FOCUS_RING}`}
                  >
                    Edit
                  </button>
                </div>

                <div className="flex items-center justify-between gap-2">
                  <p className="min-w-0 truncate text-[13px] font-semibold leading-4 text-ink">
                    {draft.serviceName ?? "Selected service"}
                  </p>

                  <span className="shrink-0 text-[11px] font-medium text-muted">
                    × {draft.quantity}
                  </span>
                </div>

                <div className="mt-1.5 grid grid-cols-2 gap-2 border-t border-line pt-1.5">
                  <div className="min-w-0">
                    <div className="flex items-center justify-between gap-1">
                      <p className="text-[10px] font-semibold uppercase tracking-wide text-muted">
                        Location
                      </p>

                      <button
                        type="button"
                        onClick={() => draft.setStep(2)}
                        disabled={isSubmitting}
                        className={`text-[10px] font-semibold text-brand hover:underline disabled:opacity-50 ${FOCUS_RING}`}
                      >
                        Edit
                      </button>
                    </div>

                    <p className="mt-0.5 line-clamp-2 break-words text-[11px] leading-4 text-ink">
                      {draft.addressSnapshot?.line1},{" "}
                      {draft.addressSnapshot?.city},{" "}
                      {draft.addressSnapshot?.state} —{" "}
                      {draft.addressSnapshot?.pincode}
                    </p>
                  </div>

                  <div className="min-w-0 border-l border-line pl-2">
                    <div className="flex items-center justify-between gap-1">
                      <p className="text-[10px] font-semibold uppercase tracking-wide text-muted">
                        Date &amp; time
                      </p>

                      <button
                        type="button"
                        onClick={() => draft.setStep(3)}
                        disabled={isSubmitting}
                        className={`text-[10px] font-semibold text-brand hover:underline disabled:opacity-50 ${FOCUS_RING}`}
                      >
                        Edit
                      </button>
                    </div>

                    <p className="mt-0.5 text-[11px] font-medium leading-4 text-ink">
                      {draft.date}
                      <br />
                      {formatSlotLabel(draft.slot ?? "")}
                    </p>
                  </div>
                </div>
              </div>

              {/* Promo code + coupon suggestions */}

              <div className="px-3 py-1">
                <div className="mb-1 flex items-center justify-between gap-2">
                  <p className="text-[11px] font-semibold text-ink">
                    Promo code
                  </p>

                  {draft.couponCode && (
                    <span className="max-w-[46%] truncate rounded-full bg-accent-soft px-1.5 py-0.5 text-[9px] font-semibold text-brand">
                      {draft.couponCode} applied
                    </span>
                  )}
                </div>

                <div className="grid grid-cols-[minmax(0,1fr)_auto] gap-1">
                  <input
                    aria-label="Coupon code"
                    type="text"
                    placeholder="ENTER PROMO CODE"
                    disabled={!online || isSubmitting || isValidating}
                    value={couponDraft}
                    onChange={(event) => {
                      setCouponDraft(event.currentTarget.value);

                      setCouponError(null);
                    }}
                    onKeyDown={(event) => {
                      if (event.key !== "Enter") return;

                      const code = couponDraft.trim();

                      if (code) void handleApplyCoupon(code);
                    }}
                    className={`h-8 min-w-0 rounded-md border border-line bg-canvas px-2 text-[11px] text-ink outline-none placeholder:text-muted disabled:opacity-50 ${FOCUS_RING}`}
                  />

                  <button
                    type="button"
                    disabled={!online || isSubmitting || isValidating}
                    onClick={() => {
                      const code = couponDraft.trim();

                      if (code) void handleApplyCoupon(code);
                    }}
                    className={`h-8 rounded-md border border-brand bg-white px-2.5 text-[11px] font-semibold text-brand disabled:opacity-50 ${FOCUS_RING}`}
                  >
                    {isValidating ? "Applying…" : "Apply"}
                  </button>
                </div>

                {couponError && (
                  <p className="mt-1 text-[9px] leading-3 text-danger">
                    {couponError}
                  </p>
                )}

                {!couponsLoading && compactCoupons.length > 0 && (
                  <div className="mt-1.5">
                    <div className="mb-1 flex items-center justify-between">
                      <span className="text-[9px] font-medium text-muted">
                        Available coupons
                      </span>

                      {draft.couponCode && (
                        <button
                          type="button"
                          onClick={handleRemoveCoupon}
                          disabled={isSubmitting}
                          className={`text-[9px] font-medium text-danger hover:underline disabled:opacity-50 ${FOCUS_RING}`}
                        >
                          Remove
                        </button>
                      )}
                    </div>

                    <div className="grid grid-cols-2 gap-1">
                      {mobileCoupons.map((coupon, index) => {
                        const code = coupon.code ?? `COUPON-${index + 1}`;

                        const selected = draft.couponCode === coupon.code;

                        const description = compactCouponDescription(coupon);

                        return (
                          <button
                            key={`${code}-${index}`}
                            type="button"
                            disabled={
                              !coupon.code ||
                              !online ||
                              isSubmitting ||
                              isValidating
                            }
                            onClick={() =>
                              coupon.code && void handleApplyCoupon(coupon.code)
                            }
                            className={`min-w-0 rounded-md border px-1.5 py-1 text-left disabled:opacity-50 ${
                              selected
                                ? "border-brand bg-accent-soft"
                                : "border-line bg-white"
                            } ${FOCUS_RING}`}
                          >
                            <span className="flex min-w-0 items-center justify-between gap-1">
                              <strong className="min-w-0 truncate text-[10.5px] font-semibold leading-3.5 text-ink">
                                {code}
                              </strong>

                              <span className="shrink-0 text-[9px] font-semibold text-brand">
                                {selected ? "Applied" : "Apply"}
                              </span>
                            </span>

                            <span className="mt-0.5 block truncate text-[9px] leading-3 text-muted">
                              {description}
                            </span>
                          </button>
                        );
                      })}
                    </div>

                    {hiddenCouponCount > 0 && (
                      <button
                        type="button"
                        onClick={() => setShowAllCoupons((current) => !current)}
                        aria-expanded={showAllCoupons}
                        className={`mt-1 flex h-6 w-full items-center justify-center text-[9px] font-semibold text-brand ${FOCUS_RING}`}
                      >
                        {showAllCoupons
                          ? "Show less ↑"
                          : `View ${hiddenCouponCount} more ${hiddenCouponCount === 1 ? "coupon" : "coupons"} ↓`}
                      </button>
                    )}
                  </div>
                )}

                {couponsLoading && (
                  <p className="mt-1 text-[9px] text-muted">Loading coupons…</p>
                )}

                {!couponsLoading && compactCoupons.length === 0 && (
                  <p className="mt-1 text-[9px] text-muted">
                    No coupons are available for this booking.
                  </p>
                )}
              </div>

              {/* Price summary */}

              <div className="px-3 py-1">
                <div className="rounded-lg bg-accent-soft/70 px-2 py-1">
                  <div className="mb-0.5 flex items-center justify-between gap-2">
                    <p className="text-[11px] font-semibold text-ink">
                      Price summary
                    </p>

                    {quoteReady && quote && (
                      <span className="text-[12px] font-bold tabular-nums text-brand">
                        {formatINR(quote.total)}
                      </span>
                    )}
                  </div>

                  <div className="text-[10px] leading-3.5">
                    <PriceBreakdown
                      quote={quote}
                      isLoading={isLoading}
                      isRefreshing={isRefreshing || isPlaceholder}
                      isError={isError}
                      errorMessage={quoteError?.message}
                      onRetry={refetch}
                    />
                  </div>
                </div>
              </div>

              {/* Payment methods */}

              <fieldset className="px-3 py-1" disabled={isSubmitting}>
                <legend className="sr-only">Payment method</legend>

                <p className="mb-1 text-[11px] font-semibold text-ink">
                  Payment method
                </p>

                <div className="grid grid-cols-2 gap-1">
                  {CHECKOUT_METHODS.map((m) => {
                    const selected = method === m.id;

                    return (
                      <label
                        key={m.id}
                        className={`flex min-w-0 cursor-pointer items-center gap-1.5 rounded-md border px-2 py-1 ${
                          selected
                            ? "border-brand bg-accent-soft"
                            : "border-line bg-white"
                        } ${isSubmitting ? "cursor-not-allowed opacity-50" : ""}`}
                      >
                        <input
                          type="radio"
                          name="payment-method"
                          value={m.id}
                          checked={selected}
                          disabled={isSubmitting}
                          onChange={() => setMethod(m.id)}
                          className="h-3 w-3 shrink-0 accent-current"
                        />

                        <span className="min-w-0 truncate text-[10px] font-semibold leading-3.5 text-ink">
                          {m.label}
                        </span>
                      </label>
                    );
                  })}
                </div>
              </fieldset>

              {/* Total + actions */}

              <div className="px-3 py-1">
                <div className="mb-1.5 flex items-center justify-between gap-2">
                  <span className="text-[12px] font-semibold text-ink">
                    Total
                  </span>

                  <span
                    className="text-[19px] font-bold leading-5 tabular-nums text-brand"
                    aria-live="polite"
                  >
                    {quoteReady && quote ? formatINR(quote.total) : "—"}
                  </span>
                </div>

                <button
                  type="button"
                  onClick={() => void handlePay()}
                  disabled={payDisabled}
                  aria-busy={isSubmitting}
                  className={`h-9 w-full rounded-md bg-brand px-3 text-[12px] font-semibold text-white hover:opacity-90 disabled:opacity-50 ${FOCUS_RING}`}
                >
                  {isSubmitting
                    ? "Processing…"
                    : method === "cod"
                      ? "Place order"
                      : "Confirm & Pay"}
                </button>

                <button
                  type="button"
                  onClick={() => draft.setStep(3)}
                  disabled={isSubmitting}
                  className={`mt-1 h-8 w-full rounded-md border border-brand bg-white px-3 text-[11px] font-semibold text-brand disabled:opacity-50 ${FOCUS_RING}`}
                >
                  Back
                </button>
              </div>
            </div>
          </section>
        </div>

        {/* Tablet / desktop: preserve the existing implementation. */}

        <div className="hidden sm:block">
          <div className="grid min-w-0 gap-1 sm:gap-2 lg:grid-cols-[minmax(0,1.42fr)_minmax(320px,0.58fr)] lg:gap-1.5 xl:grid-cols-[minmax(0,1.5fr)_minmax(360px,0.5fr)]">
            <main className="grid min-w-0 content-start gap-1 sm:gap-2 lg:gap-1.5">
              <div className="grid min-w-0 grid-cols-2 gap-1">
                <section className="min-w-0 rounded-md border border-line bg-panel px-2 py-1 sm:px-2.5">
                  <div className="flex items-center justify-between gap-2">
                    <h4 className="text-[10px] font-semibold uppercase tracking-[0.08em] text-muted sm:text-[10px]">
                      Address
                    </h4>

                    <button
                      type="button"
                      onClick={() => draft.setStep(2)}
                      disabled={isSubmitting}
                      className={`shrink-0 text-[10px] font-semibold text-brand hover:underline disabled:opacity-50 sm:text-[11px] ${FOCUS_RING}`}
                    >
                      Edit
                    </button>
                  </div>

                  <p className="mt-0.5 break-words text-[11px] leading-3.5 text-ink sm:text-[13px] sm:leading-4">
                    {draft.addressSnapshot?.line1},{" "}
                    {draft.addressSnapshot?.city},{" "}
                    {draft.addressSnapshot?.state} —{" "}
                    {draft.addressSnapshot?.pincode}
                  </p>
                </section>

                <section className="min-w-0 rounded-md border border-line bg-panel px-2 py-1 sm:px-2.5">
                  <div className="flex items-center justify-between gap-2">
                    <h4 className="text-[10px] font-semibold uppercase tracking-[0.08em] text-muted sm:text-[10px]">
                      Date &amp; time
                    </h4>

                    <button
                      type="button"
                      onClick={() => draft.setStep(3)}
                      disabled={isSubmitting}
                      className={`shrink-0 text-[10px] font-semibold text-brand hover:underline disabled:opacity-50 sm:text-[11px] ${FOCUS_RING}`}
                    >
                      Edit
                    </button>
                  </div>

                  <p className="mt-0.5 text-[11px] font-medium leading-3.5 text-ink sm:text-[13px] sm:leading-4">
                    {draft.date} · {formatSlotLabel(draft.slot ?? "")}
                  </p>
                </section>
              </div>

              <section className="min-w-0 rounded-md border border-line bg-panel p-1.5 sm:p-2.5">
                <div className="mb-1 flex items-center justify-between gap-2">
                  <div className="min-w-0">
                    <h4 className="text-xs font-semibold leading-4 text-ink sm:text-[13px]">
                      Coupons &amp; offers
                    </h4>

                    <p className="hidden text-xs leading-4 text-muted sm:block sm:text-[11px]">
                      Choose a coupon or enter a code.
                    </p>
                  </div>

                  {draft.couponCode && (
                    <span className="shrink-0 rounded-full bg-accent-soft px-1.5 py-0.5 text-[9px] font-semibold text-brand sm:px-2 sm:text-[10px]">
                      {draft.couponCode} applied
                    </span>
                  )}
                </div>

                <div className="grid grid-cols-[minmax(0,1fr)_auto] gap-1.5">
                  <input
                    aria-label="Coupon code"
                    type="text"
                    placeholder="ENTER CODE"
                    disabled={!online || isSubmitting || isValidating}
                    value={couponDraft}
                    onChange={(event) => {
                      setCouponDraft(event.currentTarget.value);

                      setCouponError(null);
                    }}
                    onKeyDown={(event) => {
                      if (event.key !== "Enter") return;

                      const code = couponDraft.trim();

                      if (code) void handleApplyCoupon(code);
                    }}
                    className={`h-8 min-w-0 rounded-md border border-line bg-white px-2 text-[11px] text-ink outline-none placeholder:text-muted disabled:opacity-50 sm:h-9 sm:text-xs ${FOCUS_RING}`}
                  />

                  <button
                    type="button"
                    disabled={!online || isSubmitting || isValidating}
                    onClick={() => {
                      const code = couponDraft.trim();

                      if (code) void handleApplyCoupon(code);
                    }}
                    className={`h-8 rounded-md bg-brand px-3 text-[11px] font-semibold text-white disabled:opacity-50 sm:h-9 sm:text-xs ${FOCUS_RING}`}
                  >
                    {isValidating ? "Applying…" : "Apply"}
                  </button>
                </div>

                {couponError && (
                  <p className="mt-1 text-[11px] leading-4 text-danger">
                    {couponError}
                  </p>
                )}

                <div className="mt-1.5 flex items-center justify-between gap-2">
                  <p className="text-[10px] font-semibold uppercase tracking-wide text-muted sm:text-[10px]">
                    Available coupons
                  </p>

                  {couponsLoading && (
                    <span className="text-[10px] text-muted">Loading…</span>
                  )}
                </div>

                {!couponsLoading && compactCoupons.length > 0 && (
                  <>
                    {/* Mobile: show only two coupons initially and let the page grow naturally when expanded. */}

                    <div className="mt-1 grid grid-cols-2 gap-1 sm:hidden">
                      {mobileCoupons.map((coupon, index) => {
                        const code = coupon.code ?? `COUPON-${index + 1}`;

                        const selected = draft.couponCode === coupon.code;

                        const description = compactCouponDescription(coupon);

                        return (
                          <button
                            key={`${code}-${index}`}
                            type="button"
                            disabled={
                              !coupon.code ||
                              !online ||
                              isSubmitting ||
                              isValidating
                            }
                            onClick={() =>
                              coupon.code && void handleApplyCoupon(coupon.code)
                            }
                            className={`min-w-0 rounded-md border px-2 py-1 text-left disabled:opacity-50 ${
                              selected
                                ? "border-brand bg-accent-soft"
                                : "border-line bg-white hover:border-brand/50"
                            } ${FOCUS_RING}`}
                          >
                            <span className="flex min-w-0 items-start justify-between gap-1">
                              <strong className="min-w-0 break-all text-[10px] font-semibold leading-3.5 text-ink">
                                {code}
                              </strong>

                              <span className="shrink-0 text-[9px] font-semibold text-brand">
                                {selected ? "Applied" : "Apply"}
                              </span>
                            </span>

                            <span className="mt-0.5 block break-words text-[9px] leading-3 text-muted">
                              {description}
                            </span>
                          </button>
                        );
                      })}
                    </div>

                    {hiddenCouponCount > 0 && (
                      <button
                        type="button"
                        onClick={() => setShowAllCoupons((current) => !current)}
                        aria-expanded={showAllCoupons}
                        className={`mt-1 flex min-h-[30px] w-full items-center justify-center gap-1.5 rounded-md border border-line bg-white px-3 text-[10px] font-semibold text-brand hover:bg-canvas sm:hidden ${FOCUS_RING}`}
                      >
                        {showAllCoupons ? (
                          <>
                            Show less
                            <span aria-hidden="true">↑</span>
                          </>
                        ) : (
                          <>
                            View {hiddenCouponCount} more{" "}
                            {hiddenCouponCount === 1 ? "coupon" : "coupons"}
                            <span aria-hidden="true">↓</span>
                          </>
                        )}
                      </button>
                    )}

                    {/* Tablet / desktop: keep showing the complete coupon list. */}

                    <div className="mt-1 hidden gap-1.5 sm:grid sm:grid-cols-2 xl:grid-cols-3">
                      {compactCoupons.map((coupon, index) => {
                        const code = coupon.code ?? `COUPON-${index + 1}`;

                        const selected = draft.couponCode === coupon.code;

                        const description = compactCouponDescription(coupon);

                        return (
                          <button
                            key={`${code}-${index}`}
                            type="button"
                            disabled={
                              !coupon.code ||
                              !online ||
                              isSubmitting ||
                              isValidating
                            }
                            onClick={() =>
                              coupon.code && void handleApplyCoupon(coupon.code)
                            }
                            className={`min-w-0 rounded-md border px-2 py-1 text-left disabled:opacity-50 ${
                              selected
                                ? "border-brand bg-accent-soft"
                                : "border-line bg-white hover:border-brand/50"
                            } ${FOCUS_RING}`}
                          >
                            <span className="flex items-center justify-between gap-1.5">
                              <strong className="truncate text-[11px] font-semibold leading-4 text-ink">
                                {code}
                              </strong>

                              <span className="shrink-0 text-[10px] font-semibold text-brand">
                                {selected ? "Applied" : "Apply"}
                              </span>
                            </span>

                            <span className="mt-0.5 block text-[10px] leading-3.5 text-muted">
                              {description}
                            </span>
                          </button>
                        );
                      })}
                    </div>
                  </>
                )}

                {!couponsLoading && compactCoupons.length === 0 && (
                  <p className="mt-1 text-[11px] text-muted">
                    No coupons are available for this booking.
                  </p>
                )}

                {draft.couponCode && (
                  <button
                    type="button"
                    onClick={handleRemoveCoupon}
                    disabled={isSubmitting}
                    className={`mt-1.5 text-[11px] font-medium text-danger hover:underline disabled:opacity-50 ${FOCUS_RING}`}
                  >
                    Remove coupon
                  </button>
                )}
              </section>
            </main>

            <aside className="grid min-w-0 content-start gap-1 sm:gap-2 md:grid-cols-2 lg:grid-cols-1 lg:gap-1.5">
              <section className="min-w-0 rounded-md border border-line bg-panel p-1.5 sm:p-2.5">
                <div className="mb-1 flex items-center justify-between gap-2">
                  <h4 className="text-[11px] font-semibold text-ink sm:text-[13px]">
                    Price summary
                  </h4>

                  {quoteReady && quote && (
                    <span className="text-sm font-semibold tabular-nums text-ink">
                      {formatINR(quote.total)}
                    </span>
                  )}
                </div>

                <div className="text-[11px] leading-3.5 sm:text-xs sm:leading-4">
                  <PriceBreakdown
                    quote={quote}
                    isLoading={isLoading}
                    isRefreshing={isRefreshing || isPlaceholder}
                    isError={isError}
                    errorMessage={quoteError?.message}
                    onRetry={refetch}
                  />
                </div>
              </section>

              <fieldset
                className="min-w-0 rounded-md border border-line bg-panel p-1.5 sm:p-2.5"
                disabled={isSubmitting}
              >
                <legend className="px-1 text-[11px] font-semibold text-ink sm:text-[13px]">
                  Payment method
                </legend>

                <div className="mt-0.5 grid min-w-0 grid-cols-2 gap-1 sm:gap-1.5">
                  {CHECKOUT_METHODS.map((m) => {
                    const selected = method === m.id;

                    return (
                      <label
                        key={m.id}
                        className={`flex min-w-0 cursor-pointer items-center gap-1.5 rounded-md border px-2 py-1.5 sm:gap-2 ${
                          selected
                            ? "border-brand bg-accent-soft"
                            : "border-line bg-white hover:border-brand/50"
                        } ${isSubmitting ? "cursor-not-allowed opacity-50" : ""}`}
                      >
                        <input
                          type="radio"
                          name="payment-method"
                          value={m.id}
                          checked={selected}
                          disabled={isSubmitting}
                          onChange={() => setMethod(m.id)}
                          className="h-3 w-3 shrink-0 accent-current sm:h-3.5 sm:w-3.5"
                        />

                        <span className="min-w-0">
                          <span className="block text-[10px] font-semibold leading-3.5 text-ink sm:text-[11px] sm:leading-4">
                            {m.label}
                          </span>

                          <span className="block text-[9px] leading-3 text-muted sm:text-[9px]">
                            {m.hint}
                          </span>
                        </span>
                      </label>
                    );
                  })}
                </div>
              </fieldset>

              <section className="static z-20 min-w-0 rounded-md border border-brand bg-panel/95 p-2 shadow-sm md:col-span-2 md:shadow-none lg:col-span-1">
                <div className="grid grid-cols-[minmax(0,1fr)_auto] items-center gap-2">
                  <div className="min-w-0">
                    <p className="text-[10px] leading-3 text-muted sm:text-[10px]">
                      Total payable
                    </p>

                    <p
                      className="text-base font-semibold leading-5 tabular-nums text-ink sm:text-lg sm:leading-6"
                      aria-live="polite"
                    >
                      {quoteReady && quote ? formatINR(quote.total) : "—"}
                    </p>
                  </div>

                  <div className="grid grid-cols-[auto_minmax(96px,1fr)] gap-1.5 sm:grid-cols-[auto_minmax(110px,1fr)]">
                    <button
                      type="button"
                      onClick={() => draft.setStep(3)}
                      disabled={isSubmitting}
                      className={`h-8 rounded-md border border-line bg-white px-2 text-[11px] font-medium text-ink hover:bg-canvas disabled:opacity-50 sm:h-9 sm:px-3 sm:text-xs ${FOCUS_RING}`}
                    >
                      Back
                    </button>

                    <button
                      type="button"
                      onClick={() => void handlePay()}
                      disabled={payDisabled}
                      aria-busy={isSubmitting}
                      className={`h-8 min-w-0 rounded-md bg-brand px-2 text-[11px] font-semibold text-white hover:opacity-90 disabled:opacity-50 sm:h-9 sm:px-3 sm:text-xs ${FOCUS_RING}`}
                    >
                      {isSubmitting
                        ? "Processing…"
                        : method === "cod"
                          ? "Place order"
                          : "Confirm & Pay"}
                    </button>
                  </div>
                </div>
              </section>
            </aside>
          </div>
        </div>
      </div>
    </div>
  );
}
