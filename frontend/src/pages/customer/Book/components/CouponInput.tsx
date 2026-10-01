import { useId, useState, type FormEvent } from "react";
import { FOCUS_RING } from "@/components/customer/focusRing";
import { COUPON_ERROR, type AvailableCoupon } from "@/types/pricing";
import { formatINR } from "../formatMoney";

/** Customer-facing text for each coupon failure the server can report. */
export function couponErrorText(code: string, minOrder?: number): string {
  switch (code) {
    case COUPON_ERROR.EXPIRED:
      return "This coupon has expired.";
    case COUPON_ERROR.MIN_ORDER:
      return minOrder ? `Add more to your order: this coupon needs a minimum of ${formatINR(minOrder)}.` : "Your order is below the minimum for this coupon.";
    case COUPON_ERROR.NOT_APPLICABLE:
      return "This coupon isn't applicable to this service.";
    case COUPON_ERROR.USAGE_LIMIT:
      return "This coupon has reached its usage limit.";
    case COUPON_ERROR.INVALID:
      return "That coupon code isn't valid.";
    default:
      return "We couldn't apply this coupon. Please try again.";
  }
}

interface CouponInputProps {
  /** Code the server has accepted for this order (from the quote), or null. */
  appliedCode: string | null;
  /** Discount the server calculated for that code; null while the new quote is still loading. */
  savedAmount: number | null;
  isApplying: boolean;
  /** Set by the parent after a failed apply, or when a re-quote dropped the coupon. */
  errorMessage: string | null;
  disabled?: boolean;
  onApply: (code: string) => void;
  onRemove: () => void;
  onInputChange: () => void;
  /** Coupons to list under the box (server-flagged eligible or not). */
  availableCoupons?: AvailableCoupon[];
  couponsLoading?: boolean;
}

interface CouponRowProps {
  coupon: AvailableCoupon;
  /** Apply button is clickable (eligible and not disabled / mid-apply). */
  usable: boolean;
  onApply: (code: string) => void;
}

/**
 * One compact coupon card. The text block grows and wraps; the button sits on the right and,
 * on very narrow widths, wraps below the text (flex-wrap) instead of squeezing it.
 */
function CouponRow({ coupon: c, usable, onApply }: CouponRowProps) {
  return (
    <li
      className={`flex min-w-0 flex-wrap items-center gap-x-3 gap-y-2 rounded border px-3 py-2 ${
        c.eligible ? "border-dashed border-brand bg-canvas" : "border-line bg-canvas"
      }`}
    >
      <div className="min-w-0 flex-1 basis-48">
        <p className={`break-all text-sm font-semibold tracking-wide ${c.eligible ? "text-ink" : "text-muted"}`}>{c.code}</p>
        <p className="break-words text-xs leading-snug text-muted">
          {c.title} · {c.description}
        </p>
        {!c.eligible && c.reason && (
          <p className="mt-1 break-words text-xs leading-snug text-danger">{couponErrorText(c.reason.code, c.reason.minOrder)}</p>
        )}
      </div>
      <button
        type="button"
        disabled={!usable}
        onClick={() => onApply(c.code)}
        aria-label={`Apply coupon ${c.code}`}
        className={`ml-auto min-h-[44px] shrink-0 rounded border px-4 text-sm font-medium sm:min-h-[36px] ${
          c.eligible
            ? "border-brand bg-white text-brand hover:bg-canvas disabled:cursor-not-allowed disabled:border-line disabled:text-muted"
            : "cursor-not-allowed border-line bg-white text-muted"
        } ${FOCUS_RING}`}
      >
        Apply
      </button>
    </li>
  );
}

export default function CouponInput({
  appliedCode,
  savedAmount,
  isApplying,
  errorMessage,
  disabled = false,
  onApply,
  onRemove,
  onInputChange,
  availableCoupons = [],
  couponsLoading = false,
}: CouponInputProps) {
  const [value, setValue] = useState("");
  const inputId = useId();
  const errorId = useId();
  const availableHeadingId = useId();
  const otherHeadingId = useId();

  if (appliedCode) {
    return (
      <div className="space-y-2">
        <p className="text-sm font-semibold text-ink">Coupon code</p>
        <div className="flex flex-wrap items-center justify-between gap-x-3 gap-y-2 rounded border border-green-600 bg-green-50 px-3 py-2">
          <div className="min-w-0">
            <p className="truncate text-sm font-semibold text-ink">{appliedCode}</p>
            <p role="status" className="text-sm text-green-700">
              {savedAmount === null ? "Applying discount…" : `${formatINR(savedAmount)} discount applied`}
            </p>
          </div>
          <button
            type="button"
            onClick={() => {
              setValue("");
              onRemove();
            }}
            disabled={disabled}
            aria-label={`Remove coupon ${appliedCode}`}
            className={`min-h-[44px] rounded border border-line bg-white px-4 text-sm font-medium text-ink hover:bg-canvas disabled:opacity-50 ${FOCUS_RING}`}
          >
            Remove
          </button>
        </div>
      </div>
    );
  }

  const submit = (e: FormEvent) => {
    e.preventDefault();
    const code = value.trim();
    if (!code || isApplying || disabled) return;
    onApply(code);
  };

  // Split using the server's own flag; the original order is kept inside each group.
  const eligibleCoupons = availableCoupons.filter((c) => c.eligible);
  const otherCoupons = availableCoupons.filter((c) => !c.eligible);
  const hasCoupons = availableCoupons.length > 0;
  const rowUsable = !disabled && !isApplying;

  return (
    <form onSubmit={submit} className="space-y-1.5" noValidate>
      <label htmlFor={inputId} className="text-sm font-semibold text-ink">
        Coupon code
      </label>
      <div className="flex gap-2">
        <input
          id={inputId}
          value={value}
          onChange={(e) => {
            setValue(e.target.value.toUpperCase());
            if (errorMessage) onInputChange();
          }}
          placeholder="Enter code"
          maxLength={30}
          autoComplete="off"
          autoCapitalize="characters"
          aria-invalid={Boolean(errorMessage)}
          aria-describedby={errorMessage ? errorId : undefined}
          className={`min-h-[44px] min-w-0 flex-1 rounded border bg-canvas px-3 text-sm uppercase text-ink ${
            errorMessage ? "border-danger" : "border-line"
          } ${FOCUS_RING}`}
        />
        <button
          type="submit"
          disabled={!value.trim() || isApplying || disabled}
          className={`min-h-[44px] rounded bg-brand px-5 text-sm font-medium text-white hover:opacity-90 disabled:opacity-50 ${FOCUS_RING}`}
        >
          {isApplying ? "Applying…" : "Apply"}
        </button>
      </div>
      {errorMessage && (
        <p id={errorId} role="alert" className="text-sm text-danger">
          {errorMessage}
        </p>
      )}

      {couponsLoading && !hasCoupons && (
        <div className="space-y-2 pt-1" role="status" aria-live="polite">
          <span className="sr-only">Loading available coupons…</span>
          <div className="h-3 w-32 animate-pulse rounded bg-line" aria-hidden="true" />
          <div className="h-12 animate-pulse rounded border border-line bg-canvas" aria-hidden="true" />
          <div className="h-12 animate-pulse rounded border border-line bg-canvas" aria-hidden="true" />
        </div>
      )}

      {!couponsLoading && !hasCoupons && <p className="pt-1 text-sm text-muted">No coupons available for this booking.</p>}

      {hasCoupons && (
        <div className="pt-1">
          {/* Only this box scrolls on long lists; the page itself stays short. p-1 keeps borders and focus rings from clipping. */}
          <div className="max-h-[min(18rem,45vh)] min-w-0 space-y-3 overflow-y-auto p-1 [scrollbar-width:thin] [scrollbar-color:#C9C7DA_transparent]">
            <section aria-labelledby={availableHeadingId} className="space-y-1.5">
              <h4 id={availableHeadingId} className="text-xs font-semibold uppercase tracking-wide text-muted">
                Available coupons
              </h4>
              {eligibleCoupons.length > 0 ? (
                <ul className="grid min-w-0 gap-2">
                  {eligibleCoupons.map((c) => (
                    <CouponRow key={c.code} coupon={c} usable={rowUsable} onApply={onApply} />
                  ))}
                </ul>
              ) : (
                <p className="text-sm text-muted">No coupons available for this booking.</p>
              )}
            </section>

            {otherCoupons.length > 0 && (
              <section aria-labelledby={otherHeadingId} className="space-y-1.5">
                <h4 id={otherHeadingId} className="text-xs font-semibold uppercase tracking-wide text-muted">
                  Other coupons
                </h4>
                <ul className="grid min-w-0 gap-2">
                  {otherCoupons.map((c) => (
                    <CouponRow key={c.code} coupon={c} usable={false} onApply={onApply} />
                  ))}
                </ul>
              </section>
            )}
          </div>
        </div>
      )}
    </form>
  );
}