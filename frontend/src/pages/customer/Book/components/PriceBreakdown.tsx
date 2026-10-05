import { ErrorState } from "@/components/customer";
import type { PriceQuote } from "@/types/pricing";
import { formatINR } from "../formatMoney";

interface PriceBreakdownProps {
  quote: PriceQuote | undefined;
  isLoading: boolean;
  /** A newer quote is loading; the old numbers stay visible but are marked as updating. */
  isRefreshing?: boolean;
  isError: boolean;
  errorMessage?: string;
  onRetry: () => void;
}

function Row({ label, value, muted = false, positive = false, strong = false }: {
  label: string;
  value: string;
  muted?: boolean;
  positive?: boolean;
  strong?: boolean;
}) {
  const tone = positive ? "text-green-700" : muted ? "text-muted" : "text-ink";
  return (
    <div className={`flex items-baseline justify-between gap-4 text-sm ${tone} ${strong ? "font-semibold" : ""}`}>
      <dt>{label}</dt>
      <dd className="shrink-0 tabular-nums">{value}</dd>
    </div>
  );
}

function BreakdownSkeleton() {
  return (
    <div role="status" aria-live="polite" className="space-y-2">
      <span className="sr-only">Calculating your price…</span>
      {[0, 1, 2, 3, 4].map((i) => (
        <div key={i} className="flex justify-between gap-4" aria-hidden="true">
          <div className="h-4 w-1/2 animate-pulse rounded bg-line" />
          <div className="h-4 w-16 animate-pulse rounded bg-line" />
        </div>
      ))}
    </div>
  );
}

/** Renders the server's quote line by line. Every number shown here was computed by the server. */
export default function PriceBreakdown({ quote, isLoading, isRefreshing = false, isError, errorMessage, onRetry }: PriceBreakdownProps) {
  if (isLoading) return <BreakdownSkeleton />;
  if (isError || !quote) {
    return (
      <ErrorState
        title="Couldn't calculate your price"
        message={errorMessage ?? "Please check your connection and try again."}
        onRetry={onRetry}
      />
    );
  }

  const [base, ...addOns] = quote.lines;

  return (
    <dl aria-label="Price breakdown" aria-busy={isRefreshing} className={`space-y-1.5 ${isRefreshing ? "opacity-60" : ""}`}>
      <Row label={`${base.name} × ${base.quantity}`} value={formatINR(base.amount)} />
      {addOns.map((l) => (
        <Row key={l.refId} label={l.quantity > 1 ? `${l.name} × ${l.quantity}` : l.name} value={`+${formatINR(l.amount)}`} muted />
      ))}
      {quote.surge > 0 && <Row label={quote.surgeLabel ?? "Surge"} value={`+${formatINR(quote.surge)}`} muted />}
      <div className="border-t border-line pt-1.5">
        <Row label="Subtotal" value={formatINR(quote.subtotal)} />
      </div>
      {quote.coupon && <Row label={`Coupon (${quote.coupon.code})`} value={`−${formatINR(quote.discount)}`} positive />}
      <Row label="Convenience fee" value={formatINR(quote.convenienceFee)} muted />
      <Row label="GST" value={formatINR(quote.gst)} muted />
      <div className="border-t border-line pt-1.5">
        <Row label="Total" value={formatINR(quote.total)} strong />
      </div>
    </dl>
  );
}