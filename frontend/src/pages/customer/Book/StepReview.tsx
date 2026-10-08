import { useEffect, useMemo, useRef, useState } from "react";
import {
  ArrowLeft,
  Banknote,
  CalendarClock,
  Check,
  ChevronDown,
  CreditCard,
  Landmark,
  Lock,
  MapPin,
  Pencil,
  Smartphone,
  Sparkles,
  Tag,
  Wallet,
  X,
  type LucideIcon,
} from "lucide-react";
import clsx from "clsx";
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

function toRazorpayCheckoutMethod(method: Exclude<CheckoutMethod, "cod">): RazorpayCheckoutMethod | undefined {
  switch (method) {
    case "upi":
    case "card":
    case "netbanking":
    case "wallet":
      return method;
    default:
      return undefined;
  }
}

const PRE_POPUP_DELAY_MS = 2000;
const MAX_PAYMENT_RETRIES = 3;

const sleep = (ms: number) => new Promise<void>((resolve) => setTimeout(resolve, ms));

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
  if (typeof coupon.maxDiscount === "number") parts.push(`up to ${formatINR(coupon.maxDiscount)}`);
  if (typeof coupon.minOrder === "number") parts.push(`min. ${formatINR(coupon.minOrder)}`);
  if (coupon.serviceName) parts.push(coupon.serviceName);
  return parts.join(" · ") || coupon.title || "Available offer";
}

/** "2026-10-15" -> "Thu, 15 Oct 2026". Parsed as a local date so the day never shifts with the timezone. */
function prettyDate(iso: string): string {
  const [y, m, d] = iso.split("-").map(Number);
  if (!y || !m || !d) return iso;
  return new Date(y, m - 1, d).toLocaleDateString("en-IN", { weekday: "short", day: "numeric", month: "short", year: "numeric" });
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
  const canSubmit = Boolean(draft.serviceId && draft.addressId && draft.date && draft.slot);
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
    if (quote?.total !== undefined && fresh.total !== quote.total) {
      setPriceNotice({ from: quote.total, to: fresh.total });
      stopSubmitting();
      return;
    }
    const isSdkLoaded = activeMethod === "cod" ? true : await loadRazorpayScript();
    if (!isSdkLoaded) {
      setError({ message: "Could not load the secure payment window. Check your internet connection." });
      stopSubmitting();
      return;
    }
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
      const { booking } = await bookingApi.createBooking(payload, idempotencyKey);
      const resolvedBookingId: string = booking._id;
      const goToFailed = (reason: "failed" | "verification" | "network" | "cancelled") =>
        navigate(`${customerPath(`/booking/failed/${resolvedBookingId}`)}?reason=${reason}`, { replace: true });
      // Cash on Service Bypass: Immediately confirm booking, leave payment as PENDING
      if (activeMethod === "cod") {
        setStatusMessage("Confirming your booking…");
        await paymentApi.confirmCod(resolvedBookingId);
        navigate(`${customerPath(`/booking/booked/${resolvedBookingId}`)}`, { replace: true });
        return;
      }
      // Online Payment Methods
      const orderData = await paymentApi.createOrder(resolvedBookingId);
      // CRITICAL CHECK: Ensure backend returned the key and order ID
      if (!orderData.orderId || !orderData.keyId) {
        throw new Error("Invalid payment gateway response. Developer: Ensure backend returns both 'orderId' and 'keyId'.");
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
          await paymentApi.recordAttempt(resolvedBookingId, "FAILED", orderData.orderId, reason);
        } catch (e) {
          console.error("Failed to notify backend of payment failure:", e);
        }
      };
      const remainingWaitMs = Math.max(0, PRE_POPUP_DELAY_MS - (Date.now() - startedAt));
      if (remainingWaitMs > 0) {
        setStatusMessage("Opening Razorpay checkout in a few seconds…");
        await sleep(remainingWaitMs);
      }
      if (!mounted.current) return;
      const address = draft.addressSnapshot;
      const onlineMethod: Exclude<CheckoutMethod, "cod"> = activeMethod as Exclude<CheckoutMethod, "cod">;
      const preferredRazorpayMethod = toRazorpayCheckoutMethod(onlineMethod);
      const prefillName = orderData.prefill?.name || address?.contactName || "";
      const prefillEmail = orderData.prefill?.email || "";
      const prefillContact = orderData.prefill?.contact || address?.contactPhone || "";
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
            navigate(customerPath(`/booking/success/${resolvedBookingId}`), { replace: true });
          } catch (verifyErr) {
            const e = verifyErr as Partial<NormalizedApiError>;
            const uncertain = e?.code === "NETWORK_ERROR" || !e?.status;
            if (!uncertain) await markFailureOnServer(e?.message || "Payment verification failed");
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
            await paymentApi.recordAttempt(resolvedBookingId, "CANCELLED", orderData.orderId, "Customer closed the checkout");
            forceCloseRazorpayModal();
            goToFailed("cancelled");
          },
        },
      };
      if (!window.Razorpay) throw new Error("Payment window is not available");
      try {
        const rzpInstance: RazorpayInstance = new window.Razorpay(options);
        rzpInstance.on("payment.failed", async function (response: RazorpayFailure) {
          retryCountRef.current += 1;
          const currentAttempts = retryCountRef.current;
          if (currentAttempts >= MAX_PAYMENT_RETRIES && !hasExitedRef.current) {
            hasExitedRef.current = true;
            forceCloseRazorpayModal();
            try { rzpInstance.close(); } catch { /* ignore */ }
            setIsSubmitting(true);
            setStatusMessage("Maximum retries (3) reached. Payment failed.");
            await markFailureOnServer(response.error?.description || "Payment failed 3 times");
            goToFailed("failed");
          }
        });
        rzpInstance.open();
      } catch (razorpayErr: any) {
        throw new Error(`Razorpay Initialization Error: ${razorpayErr.message}`);
      }
    } catch (err) {
      stopSubmitting();
      const apiErr = err as NormalizedApiError;
      if (apiErr.code === "PRICE_CHANGED") {
        const d = apiErr.details as { expectedTotal?: number; total?: number } | undefined;
        setPriceNotice({ from: d?.expectedTotal ?? fresh.total, to: d?.total ?? fresh.total });
        void requote().catch(() => undefined);
        return;
      }
      if (COUPON_ERROR_CODES.includes(apiErr.code)) {
        setCouponCode(null);
        setCouponError(
          apiErr.code === COUPON_ERROR.INVALID ? apiErr.message : couponErrorText(apiErr.code, minOrderOf(apiErr.details)),
        );
        return;
      }
      if (["HOLD_EXPIRED", "BOOKING_NOT_PAYABLE", "ALREADY_PAID"].includes(apiErr.code)) {
        draft.resetIdempotency();
        setError({
          message: apiErr.code === "ALREADY_PAID" ? apiErr.message : "Your earlier reservation is no longer valid. Please tap Confirm & Pay again to start a fresh one.",
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
  const payDisabled = !quoteReady || !online;
  const compactCoupons = (Array.isArray(availableCoupons) ? availableCoupons : []) as unknown as CompactCoupon[];
  const visibleCoupons = showAllCoupons ? compactCoupons : compactCoupons.slice(0, 4);
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
                      className={clsx("inline-flex items-center gap-1 rounded-full px-2 py-1 text-xs font-semibold text-brand hover:bg-brand-soft disabled:opacity-50", FOCUS_RING)}
                    >
                      <Pencil className="h-3 w-3" aria-hidden="true" />
                      Edit
                    </button>
                  </div>
                  <p className="mt-0.5 break-words text-sm font-semibold text-ink">
                    {address?.line1}, {address?.city}, {address?.state} — {address?.pincode}
                  </p>
                </div>
              </div>
              <div className="flex items-start gap-3.5 px-5 py-4 sm:px-6">
                <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-brand-soft text-brand">
                  <CalendarClock className="h-5 w-5" aria-hidden="true" />
                </span>
                <div className="min-w-0 flex-1">
                  <div className="flex items-center justify-between gap-2">
                    <p className="text-xs font-semibold text-muted">Date &amp; time</p>
                    <button
                      type="button"
                      onClick={() => draft.setStep(3)}
                      disabled={isSubmitting}
                      className={clsx("inline-flex items-center gap-1 rounded-full px-2 py-1 text-xs font-semibold text-brand hover:bg-brand-soft disabled:opacity-50", FOCUS_RING)}
                    >
                      <Pencil className="h-3 w-3" aria-hidden="true" />
                      Edit
                    </button>
                  </div>
                  <p className="mt-0.5 text-sm font-semibold text-ink">{dateLabel}</p>
                  <p className="text-sm text-muted">{formatSlotLabel(draft.slot ?? "")}</p>
                </div>
              </div>
            </div>
          </section>

          {/* Coupons */}
          <section aria-labelledby="rv-coupons" className="rounded-3xl border border-line bg-panel p-5 shadow-[0_24px_60px_-48px_rgba(67,56,202,.55)] sm:p-6">
            <div className="flex items-center gap-3">
              <span className="flex h-10 w-10 items-center justify-center rounded-full bg-accent-soft text-accent">
                <Tag className="h-5 w-5" aria-hidden="true" />
              </span>
              <div>
                <h4 id="rv-coupons" className="text-base font-bold text-ink">
                  Offers &amp; coupons
                </h4>
                <p className="text-xs text-muted">Choose an offer or enter a code.</p>
              </div>
            </div>

            {draft.couponCode && (
              <div className="mt-4 flex items-center justify-between gap-3 rounded-2xl border border-emerald-200 bg-emerald-50 px-4 py-3">
                <span className="flex min-w-0 items-center gap-2 text-sm font-semibold text-emerald-800">
                  <Check className="h-4 w-4 shrink-0" strokeWidth={3} aria-hidden="true" />
                  <span className="truncate">{draft.couponCode} applied</span>
                  {saving > 0 && <span className="shrink-0 font-medium">— you save {formatINR(saving)}</span>}
                </span>
                <button
                  type="button"
                  onClick={handleRemoveCoupon}
                  disabled={isSubmitting}
                  className={clsx("inline-flex shrink-0 items-center gap-1 rounded-full px-2.5 py-1 text-xs font-semibold text-danger hover:bg-white disabled:opacity-50", FOCUS_RING)}
                >
                  <X className="h-3.5 w-3.5" aria-hidden="true" />
                  Remove
                </button>
              </div>
            )}

            <div className="mt-4 flex gap-2">
              <input
                type="text"
                inputMode="text"
                autoComplete="off"
                aria-label="Coupon code"
                placeholder="ENTER CODE"
                disabled={couponBusy}
                value={couponDraft}
                onChange={(event) => {
                  setCouponDraft(event.target.value.toUpperCase());
                  if (couponError) setCouponError(null);
                }}
                onKeyDown={(event) => {
                  if (event.key === "Enter") {
                    event.preventDefault();
                    applyDraftCoupon();
                  }
                }}
                className={clsx("h-12 min-w-0 flex-1 rounded-full border border-line bg-canvas px-5 text-sm font-medium uppercase tracking-wide text-ink placeholder:text-muted/60 disabled:opacity-60", FOCUS_RING)}
              />
              <button
                type="button"
                disabled={couponBusy || !couponDraft.trim()}
                onClick={applyDraftCoupon}
                className={clsx("h-12 shrink-0 rounded-full bg-ink px-6 text-sm font-bold text-white transition-colors hover:bg-brand disabled:opacity-50", FOCUS_RING)}
              >
                {isValidating ? "Applying…" : "Apply"}
              </button>
            </div>
            {couponError && (
              <p role="alert" className="mt-2 px-1 text-xs text-danger">
                {couponError}
              </p>
            )}

            <div className="mt-5 flex items-center justify-between">
              <p className="text-xs font-semibold uppercase tracking-wider text-muted">Available for you</p>
              {couponsLoading && <span className="text-xs text-muted">Loading…</span>}
            </div>
            {!couponsLoading && compactCoupons.length === 0 && (
              <p className="mt-2 rounded-2xl border border-dashed border-line bg-canvas px-4 py-4 text-center text-sm text-muted">
                No coupons are available for this booking.
              </p>
            )}
            {!couponsLoading && compactCoupons.length > 0 && (
              <>
                <ul className="mt-3 grid gap-3 sm:grid-cols-2">
                  {visibleCoupons.map((coupon, index) => {
                    const code = coupon.code ?? `COUPON-${index + 1}`;
                    const selected = Boolean(coupon.code) && draft.couponCode === coupon.code;
                    return (
                      <li key={`${code}-${index}`}>
                        <button
                          type="button"
                          disabled={!coupon.code || couponBusy}
                          onClick={() => coupon.code && void handleApplyCoupon(coupon.code)}
                          aria-pressed={selected}
                          className={clsx(
                            "relative flex h-full w-full items-stretch overflow-hidden rounded-2xl border border-dashed text-left transition-all disabled:opacity-50 motion-safe:hover:-translate-y-px",
                            selected ? "border-brand bg-brand-soft" : "border-line bg-panel hover:border-brand/60",
                            FOCUS_RING,
                          )}
                        >
                          <span className={clsx("flex w-11 shrink-0 items-center justify-center", selected ? "bg-brand text-white" : "bg-accent-soft text-accent")}>
                            {selected ? <Check className="h-4 w-4" strokeWidth={3} aria-hidden="true" /> : <Tag className="h-4 w-4" aria-hidden="true" />}
                          </span>
                          <span className="min-w-0 flex-1 px-3.5 py-3">
                            <span className="flex items-center justify-between gap-2">
                              <strong className="truncate text-sm font-bold tracking-wide text-ink">{code}</strong>
                              <span className={clsx("shrink-0 text-xs font-bold", selected ? "text-brand" : "text-brand/80")}>{selected ? "Applied" : "Apply"}</span>
                            </span>
                            <span className="mt-0.5 block text-xs leading-4 text-muted">{compactCouponDescription(coupon)}</span>
                          </span>
                        </button>
                      </li>
                    );
                  })}
                </ul>
                {hiddenCouponCount > 0 && (
                  <button
                    type="button"
                    onClick={() => setShowAllCoupons((current) => !current)}
                    aria-expanded={showAllCoupons}
                    className={clsx("mx-auto mt-3 flex items-center gap-1.5 rounded-full px-4 py-2 text-xs font-semibold text-brand hover:bg-brand-soft", FOCUS_RING)}
                  >
                    {showAllCoupons ? "Show fewer offers" : `View ${hiddenCouponCount} more ${hiddenCouponCount === 1 ? "offer" : "offers"}`}
                    <ChevronDown className={clsx("h-4 w-4 transition-transform", showAllCoupons && "rotate-180")} aria-hidden="true" />
                  </button>
                )}
              </>
            )}
          </section>

          {/* Payment method */}
          <fieldset disabled={isSubmitting} className="min-w-0 rounded-3xl border border-line bg-panel p-5 shadow-[0_24px_60px_-48px_rgba(67,56,202,.55)] sm:p-6">
            <legend className="sr-only">Payment method</legend>
            <div className="flex items-center gap-3">
              <span className="flex h-10 w-10 items-center justify-center rounded-full bg-brand-soft text-brand">
                <CreditCard className="h-5 w-5" aria-hidden="true" />
              </span>
              <div>
                <h4 className="text-base font-bold text-ink" aria-hidden="true">
                  Payment method
                </h4>
                <p className="text-xs text-muted">All online payments are processed securely by Razorpay.</p>
              </div>
            </div>
            <div className="mt-4 grid gap-3 sm:grid-cols-2">
              {CHECKOUT_METHODS.map((m) => {
                const selected = method === m.id;
                const Icon = METHOD_ICONS[m.id] ?? CreditCard;
                return (
                  <label
                    key={m.id}
                    className={clsx(
                      "relative flex cursor-pointer items-center gap-3.5 rounded-2xl border p-4 transition-all duration-200 motion-reduce:transition-none",
                      selected
                        ? "border-brand bg-brand-soft shadow-[0_14px_26px_-20px_rgba(67,56,202,.8)] ring-1 ring-brand"
                        : "border-line bg-panel hover:border-brand/50 motion-safe:hover:-translate-y-px",
                    )}
                  >
                    <input
                      type="radio"
                      name="payment-method"
                      value={m.id}
                      checked={selected}
                      disabled={isSubmitting}
                      onChange={() => setMethod(m.id)}
                      className="peer sr-only"
                    />
                    <span aria-hidden="true" className="pointer-events-none absolute inset-0 rounded-2xl ring-brand ring-offset-2 peer-focus-visible:ring-2" />
                    <span className={clsx("flex h-11 w-11 shrink-0 items-center justify-center rounded-xl", selected ? "bg-brand text-white" : "bg-canvas text-ink")}>
                      <Icon className="h-5 w-5" aria-hidden="true" />
                    </span>
                    <span className="min-w-0 flex-1">
                      <span className="block text-sm font-semibold text-ink">{m.label}</span>
                      <span className="block text-xs leading-4 text-muted">{m.hint}</span>
                    </span>
                    <span
                      aria-hidden="true"
                      className={clsx(
                        "flex h-5 w-5 shrink-0 items-center justify-center rounded-full border-2",
                        selected ? "border-brand bg-brand text-white" : "border-line text-transparent",
                      )}
                    >
                      <Check className="h-3 w-3" strokeWidth={4} />
                    </span>
                  </label>
                );
              })}
            </div>
          </fieldset>
        </div>

        {/* Order summary */}
        <aside aria-label="Order summary" className="lg:sticky lg:top-24">
          <div className="overflow-hidden rounded-3xl border border-line bg-panel shadow-[0_30px_70px_-44px_rgba(67,56,202,.6)]">
            <div className="bg-gradient-to-br from-brand to-[#6D5BE8] px-6 py-5 text-white">
              <p className="text-[11px] font-semibold uppercase tracking-wider text-white/70">Total payable</p>
              <div className="mt-1 flex items-end justify-between gap-3">
                <p key={totalText} className="bk-tick text-3xl font-bold tracking-tight tabular-nums">
                  {totalText}
                </p>
                {saving > 0 && (
                  <span className="mb-1 rounded-full bg-white/20 px-3 py-1 text-xs font-semibold backdrop-blur">You save {formatINR(saving)}</span>
                )}
              </div>
            </div>
            <div className="px-6 py-5">
              <h4 className="mb-3 text-sm font-bold text-ink">Price summary</h4>
              <PriceBreakdown
                quote={quote}
                isLoading={isLoading}
                isRefreshing={isRefreshing}
                isError={isError}
                errorMessage={quoteError?.message}
                onRetry={() => void refetch()}
              />
            </div>
            <div className="hidden space-y-3 border-t border-line bg-canvas px-6 py-5 lg:block">
              {payButton}
              <button
                type="button"
                onClick={() => draft.setStep(3)}
                disabled={isSubmitting}
                className={clsx("flex w-full items-center justify-center gap-1.5 rounded-full py-2 text-sm font-semibold text-muted hover:text-brand disabled:opacity-50", FOCUS_RING)}
              >
                <ArrowLeft className="h-4 w-4" aria-hidden="true" />
                Back to date &amp; time
              </button>
              <p className="flex items-center justify-center gap-1.5 text-xs text-muted">
                <Lock className="h-3 w-3" aria-hidden="true" />
                {method === "cod" ? "Pay the professional after the service" : "Secure checkout powered by Razorpay"}
              </p>
            </div>
          </div>
        </aside>
      </div>

      {/* Mobile / tablet: floating pay bar */}
      <div className="sticky bottom-[calc(4.75rem+env(safe-area-inset-bottom))] z-20 md:bottom-4 lg:hidden">
        <div className="flex items-center gap-2 rounded-3xl border border-line bg-white/90 p-2 shadow-[0_18px_40px_-14px_rgba(30,27,46,.45)] backdrop-blur-xl">
          <button
            type="button"
            onClick={() => draft.setStep(3)}
            disabled={isSubmitting}
            aria-label="Back to date and time"
            className={clsx("flex h-[52px] w-[52px] shrink-0 items-center justify-center rounded-full border border-line bg-white text-ink hover:bg-canvas disabled:opacity-50", FOCUS_RING)}
          >
            <ArrowLeft className="h-5 w-5" aria-hidden="true" />
          </button>
          <div className="min-w-0 flex-1">{payButton}</div>
        </div>
      </div>
    </div>
  );
}