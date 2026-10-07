import { useEffect, useMemo, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import clsx from "clsx";
import {
  Banknote,
  CalendarClock,
  CreditCard,
  Landmark,
  Lock,
  MapPin,
  Smartphone,
  Sparkles,
  Wallet,
  type LucideIcon,
} from "lucide-react";

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

/* -------------------------------------------------------------------------- */
/* Constants & helpers                                                        */
/* -------------------------------------------------------------------------- */

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

const PRE_POPUP_DELAY_MS = 2000;
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

const METHOD_ICONS: Partial<Record<CheckoutMethod, LucideIcon>> = {
  upi: Smartphone,
  card: CreditCard,
  netbanking: Landmark,
  wallet: Wallet,
  cod: Banknote,
};

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

/** "2026-10-15" -> "Thu, 15 Oct 2026". Parsed as a local date so the day never shifts with the timezone. */
function prettyDate(iso: string): string {
  const [y, m, d] = iso.split("-").map(Number);
  if (!y || !m || !d) return iso;
  return new Date(y, m - 1, d).toLocaleDateString("en-IN", {
    weekday: "short",
    day: "numeric",
    month: "short",
    year: "numeric",
  });
}

/* -------------------------------------------------------------------------- */
/* Component                                                                  */
/* -------------------------------------------------------------------------- */

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

      // Cash on service: confirm immediately, leave payment as PENDING.
      if (activeMethod === "cod") {
        setStatusMessage("Confirming your booking…");
        await paymentApi.confirmCod(resolvedBookingId);
        navigate(customerPath(`/booking/booked/${resolvedBookingId}`), {
          replace: true,
        });
        return;
      }

      // Online payment methods.
      const orderData = await paymentApi.createOrder(resolvedBookingId);

      if (!orderData.orderId || !orderData.keyId) {
        throw new Error(
          "Invalid payment gateway response. Developer: Ensure backend returns both 'orderId' and 'keyId'.",
        );
      }

      // Safety guard: this screen is wired to Razorpay TEST mode only.
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
      const onlineMethod = activeMethod as Exclude<CheckoutMethod, "cod">;
      const preferredRazorpayMethod = toRazorpayCheckoutMethod(onlineMethod);

      const prefillName = orderData.prefill?.name || address?.contactName || "";
      const prefillEmail = orderData.prefill?.email || "";
      const prefillContact =
        orderData.prefill?.contact || address?.contactPhone || "";

      const options = {
        key: orderData.keyId,
        amount: orderData.amount,
        currency: orderData.currency || "INR",
        name: "HomeCareX",
        description: `Payment for ${draft.serviceName ?? "Home Service"}`,
        order_id: orderData.orderId,
        // Don't restrict Checkout with the `method` option: an unavailable
        // method makes Razorpay show "No appropriate payment method found."
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
          // Razorpay can pre-select a method only when both email and contact exist.
          ...(preferredRazorpayMethod && prefillEmail && prefillContact
            ? { method: preferredRazorpayMethod }
            : {}),
        },
        retry: { enabled: true },
        theme: { color: "#0066FF" },
        modal: {
          ondismiss: async function () {
            if (hasExitedRef.current) return;
            hasExitedRef.current = true;
            setIsSubmitting(true);
            setStatusMessage("Payment cancelled…");
            try {
              await paymentApi.recordAttempt(
                resolvedBookingId,
                "CANCELLED",
                orderData.orderId,
                "Customer closed the checkout",
              );
            } catch (e) {
              console.error("Failed to record cancelled payment:", e);
            }
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
            if (
              retryCountRef.current >= MAX_PAYMENT_RETRIES &&
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

  /* ------------------------------ Render ---------------------------------- */

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
  const compactCoupons = (
    Array.isArray(availableCoupons) ? availableCoupons : []
  ) as unknown as CompactCoupon[];
  const visibleCoupons = showAllCoupons
    ? compactCoupons
    : compactCoupons.slice(0, 4);
  const hiddenCouponCount = Math.max(compactCoupons.length - 4, 0);
  const address = draft.addressSnapshot;
  const dateLabel = draft.date ? prettyDate(draft.date) : "";
  const payLabel = isSubmitting
    ? "Processing…"
    : method === "cod"
      ? "Place order"
      : "Confirm & Pay";
  const totalText = quoteReady && quote ? formatINR(quote.total) : "—";
  const saving =
    quoteReady && quote && quote.discount > 0 ? quote.discount : 0;
  const couponBusy = !online || isSubmitting || isValidating;

  const applyDraftCoupon = () => {
    const code = couponDraft.trim();
    if (code) void handleApplyCoupon(code);
  };

  const payButton = (
    <button
      type="button"
      onClick={() => void handlePay()}
      disabled={payDisabled || isSubmitting}
      aria-busy={isSubmitting}
      className={clsx(
        "group inline-flex min-h-[52px] w-full items-center justify-center gap-2 rounded-full bg-brand px-6 text-sm font-bold text-white shadow-[0_16px_30px_-14px_rgba(67,56,202,.9)] transition-colors hover:bg-[#3730A3] disabled:cursor-not-allowed disabled:opacity-50 motion-safe:active:scale-95",
        FOCUS_RING,
      )}
    >
      <Lock className="h-4 w-4" aria-hidden="true" />
      {payLabel}
      {quoteReady && !isSubmitting && (
        <span className="tabular-nums">· {totalText}</span>
      )}
    </button>
  );

  return (
    <div className="min-w-0 space-y-5">
      {/* Intro */}
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div className="flex items-start gap-3.5">
          <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl bg-brand text-white shadow-[0_12px_24px_-12px_rgba(67,56,202,.8)]">
            <Sparkles className="h-5 w-5" aria-hidden="true" />
          </span>
          <div>
            <h3 className="text-xl font-bold tracking-tight text-ink sm:text-2xl">
              Almost done — review &amp; pay
            </h3>
            <p className="mt-0.5 text-sm text-muted">
              Check your details, add an offer if you have one, and choose how
              to pay.
            </p>
          </div>
        </div>
        <span className="rounded-full bg-accent-soft px-3 py-1 text-xs font-semibold text-brand">
          Final step
        </span>
      </div>

      {!online && (
        <div
          role="status"
          className="rounded-2xl border border-line bg-accent-soft px-4 py-3 text-sm text-ink"
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
          className="rounded-2xl border border-danger bg-danger-soft px-4 py-3 text-sm text-ink"
        >
          {error.message}
        </div>
      )}

      {priceNotice && (
        <div
          role="alert"
          className="rounded-2xl border border-amber-500 bg-amber-50 px-4 py-3 text-sm text-ink"
        >
          The price changed from {formatINR(priceNotice.from)} to{" "}
          {formatINR(priceNotice.to)}. Review the updated total and confirm
          again.
        </div>
      )}

      <div className="grid gap-6 lg:grid-cols-[minmax(0,1fr)_380px] lg:items-start lg:gap-8">
        {/* ------------------------------ Left column ---------------------- */}
        <div className="min-w-0 space-y-5">
          {/* Booking details */}
          <section
            aria-labelledby="rv-details"
            className="overflow-hidden rounded-3xl border border-line bg-panel shadow-[0_24px_60px_-48px_rgba(67,56,202,.55)]"
          >
            <div className="flex items-center justify-between gap-3 border-b border-line px-5 py-4 sm:px-6">
              <div className="min-w-0">
                <p className="text-[11px] font-semibold uppercase tracking-wider text-muted">
                  Service
                </p>
                <h4
                  id="rv-details"
                  className="truncate text-base font-bold text-ink"
                >
                  {draft.serviceName ?? "Home service"}{" "}
                  <span className="font-medium text-muted">
                    × {draft.quantity}
                  </span>
                </h4>
              </div>
              {draft.addOns.length > 0 && (
                <span className="shrink-0 rounded-full bg-brand-soft px-3 py-1 text-xs font-semibold text-brand">
                  +{draft.addOns.length} add-on
                  {draft.addOns.length > 1 ? "s" : ""}
                </span>
              )}
            </div>

            <div className="grid divide-y divide-line sm:grid-cols-2 sm:divide-x sm:divide-y-0">
              {/* Address */}
              <div className="flex items-start gap-3.5 px-5 py-4 sm:px-6">
                <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-brand-soft text-brand">
                  <MapPin className="h-5 w-5" aria-hidden="true" />
                </span>
                <div className="min-w-0 flex-1">
                  <div className="flex items-center justify-between gap-2">
                    <p className="text-xs font-semibold text-muted">
                      {address?.label ?? "Address"}
                    </p>
                    <button
                      type="button"
                      onClick={() => draft.setStep(2)}
                      disabled={isSubmitting}
                      className={`shrink-0 text-[11px] font-semibold text-brand hover:underline disabled:opacity-50 ${FOCUS_RING}`}
                    >
                      Edit
                    </button>
                  </div>
                  <p className="mt-0.5 break-words text-[13px] leading-5 text-ink">
                    {address?.line1}, {address?.city}, {address?.state} —{" "}
                    {address?.pincode}
                  </p>
                </div>
              </div>

              {/* Date & time */}
              <div className="flex items-start gap-3.5 px-5 py-4 sm:px-6">
                <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-brand-soft text-brand">
                  <CalendarClock className="h-5 w-5" aria-hidden="true" />
                </span>
                <div className="min-w-0 flex-1">
                  <div className="flex items-center justify-between gap-2">
                    <p className="text-xs font-semibold text-muted">
                      Date &amp; time
                    </p>
                    <button
                      type="button"
                      onClick={() => draft.setStep(3)}
                      disabled={isSubmitting}
                      className={`shrink-0 text-[11px] font-semibold text-brand hover:underline disabled:opacity-50 ${FOCUS_RING}`}
                    >
                      Edit
                    </button>
                  </div>
                  <p className="mt-0.5 text-[13px] font-medium leading-5 text-ink">
                    {dateLabel}
                    <br />
                    {formatSlotLabel(draft.slot ?? "")}
                  </p>
                </div>
              </div>
            </div>
          </section>

          {/* Coupons */}
          <section
            aria-labelledby="rv-coupons"
            className="rounded-3xl border border-line bg-panel p-5 sm:p-6"
          >
            <div className="mb-3 flex items-center justify-between gap-2">
              <div className="min-w-0">
                <h4 id="rv-coupons" className="text-base font-bold text-ink">
                  Offers &amp; coupons
                </h4>
                <p className="text-xs text-muted">
                  Pick a coupon or enter a code.
                </p>
              </div>
              {draft.couponCode && (
                <span className="max-w-[50%] shrink-0 truncate rounded-full bg-accent-soft px-2.5 py-1 text-[11px] font-semibold text-brand">
                  {draft.couponCode} applied
                </span>
              )}
            </div>

            <div className="grid grid-cols-[minmax(0,1fr)_auto] gap-2">
              <input
                aria-label="Coupon code"
                type="text"
                placeholder="Enter code"
                disabled={couponBusy}
                value={couponDraft}
                onChange={(event) => {
                  setCouponDraft(event.currentTarget.value);
                  setCouponError(null);
                }}
                onKeyDown={(event) => {
                  if (event.key === "Enter") applyDraftCoupon();
                }}
                className={clsx(
                  "h-11 min-w-0 rounded-xl border border-line bg-canvas px-3 text-sm text-ink outline-none placeholder:text-muted disabled:opacity-50",
                  FOCUS_RING,
                )}
              />
              <button
                type="button"
                disabled={couponBusy}
                onClick={applyDraftCoupon}
                className={clsx(
                  "h-11 rounded-xl bg-brand px-5 text-sm font-semibold text-white disabled:opacity-50",
                  FOCUS_RING,
                )}
              >
                {isValidating ? "Applying…" : "Apply"}
              </button>
            </div>

            {couponError && (
              <p role="alert" className="mt-2 text-xs text-danger">
                {couponError}
              </p>
            )}

            <div className="mt-4 flex items-center justify-between gap-2">
              <p className="text-xs font-semibold text-muted">
                Available coupons
              </p>
              {couponsLoading && (
                <span className="text-xs text-muted">Loading…</span>
              )}
            </div>

            {!couponsLoading && compactCoupons.length > 0 && (
              <>
                <div className="mt-2 grid gap-2 sm:grid-cols-2">
                  {visibleCoupons.map((coupon, index) => {
                    const code = coupon.code ?? `COUPON-${index + 1}`;
                    const selected = draft.couponCode === coupon.code;
                    return (
                      <button
                        key={`${code}-${index}`}
                        type="button"
                        disabled={!coupon.code || couponBusy}
                        onClick={() =>
                          coupon.code && void handleApplyCoupon(coupon.code)
                        }
                        className={clsx(
                          "min-w-0 rounded-xl border px-3 py-2 text-left disabled:opacity-50",
                          selected
                            ? "border-brand bg-accent-soft"
                            : "border-line bg-white hover:border-brand/50",
                          FOCUS_RING,
                        )}
                      >
                        <span className="flex items-center justify-between gap-2">
                          <strong className="min-w-0 truncate text-sm font-semibold text-ink">
                            {code}
                          </strong>
                          <span className="shrink-0 text-xs font-semibold text-brand">
                            {selected ? "Applied" : "Apply"}
                          </span>
                        </span>
                        <span className="mt-0.5 block text-xs leading-4 text-muted">
                          {compactCouponDescription(coupon)}
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
                    className={clsx(
                      "mt-2 flex min-h-[36px] w-full items-center justify-center gap-1.5 rounded-xl border border-line bg-white px-3 text-xs font-semibold text-brand hover:bg-canvas",
                      FOCUS_RING,
                    )}
                  >
                    {showAllCoupons ? (
                      <>
                        Show less <span aria-hidden="true">↑</span>
                      </>
                    ) : (
                      <>
                        View {hiddenCouponCount} more{" "}
                        {hiddenCouponCount === 1 ? "coupon" : "coupons"}{" "}
                        <span aria-hidden="true">↓</span>
                      </>
                    )}
                  </button>
                )}
              </>
            )}

            {!couponsLoading && compactCoupons.length === 0 && (
              <p className="mt-2 text-xs text-muted">
                No coupons are available for this booking.
              </p>
            )}

            {draft.couponCode && (
              <button
                type="button"
                onClick={handleRemoveCoupon}
                disabled={isSubmitting}
                className={clsx(
                  "mt-3 text-xs font-medium text-danger hover:underline disabled:opacity-50",
                  FOCUS_RING,
                )}
              >
                Remove coupon
              </button>
            )}
          </section>
        </div>

        {/* ------------------------------ Right column --------------------- */}
        <aside className="min-w-0 space-y-5 lg:sticky lg:top-4">
          {/* Price summary */}
          <section
            aria-labelledby="rv-price"
            className="rounded-3xl border border-line bg-panel p-5"
          >
            <div className="mb-2 flex items-center justify-between gap-2">
              <h4 id="rv-price" className="text-base font-bold text-ink">
                Price summary
              </h4>
              {saving > 0 && (
                <span className="rounded-full bg-accent-soft px-2.5 py-1 text-[11px] font-semibold text-brand">
                  You save {formatINR(saving)}
                </span>
              )}
            </div>
            <div className="text-sm">
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

          {/* Payment method */}
          <fieldset
            className="min-w-0 rounded-3xl border border-line bg-panel p-5"
            disabled={isSubmitting}
          >
            <legend className="px-1 text-base font-bold text-ink">
              Payment method
            </legend>
            <div className="mt-1 grid min-w-0 grid-cols-2 gap-2">
              {CHECKOUT_METHODS.map((m) => {
                const selected = method === m.id;
                const Icon = METHOD_ICONS[m.id];
                return (
                  <label
                    key={m.id}
                    className={clsx(
                      "flex min-w-0 cursor-pointer items-center gap-2 rounded-xl border px-3 py-2.5",
                      selected
                        ? "border-brand bg-accent-soft"
                        : "border-line bg-white hover:border-brand/50",
                      isSubmitting && "cursor-not-allowed opacity-50",
                    )}
                  >
                    <input
                      type="radio"
                      name="payment-method"
                      value={m.id}
                      checked={selected}
                      disabled={isSubmitting}
                      onChange={() => setMethod(m.id)}
                      className="sr-only"
                    />
                    {Icon && (
                      <Icon
                        className={clsx(
                          "h-4 w-4 shrink-0",
                          selected ? "text-brand" : "text-muted",
                        )}
                        aria-hidden="true"
                      />
                    )}
                    <span className="min-w-0">
                      <span className="block truncate text-xs font-semibold text-ink">
                        {m.label}
                      </span>
                      <span className="block truncate text-[10px] text-muted">
                        {m.hint}
                      </span>
                    </span>
                  </label>
                );
              })}
            </div>
          </fieldset>

          {/* Total & actions */}
          <section className="rounded-3xl border border-brand bg-panel p-5">
            <div className="mb-4 flex items-end justify-between gap-2">
              <span className="text-sm font-semibold text-muted">
                Total payable
              </span>
              <span
                className="text-2xl font-bold tabular-nums text-ink"
                aria-live="polite"
              >
                {totalText}
              </span>
            </div>
            {payButton}
            <button
              type="button"
              onClick={() => draft.setStep(3)}
              disabled={isSubmitting}
              className={clsx(
                "mt-2 h-11 w-full rounded-full border border-line bg-white text-sm font-semibold text-ink hover:bg-canvas disabled:opacity-50",
                FOCUS_RING,
              )}
            >
              Back
            </button>
          </section>
        </aside>
      </div>
    </div>
  );
}