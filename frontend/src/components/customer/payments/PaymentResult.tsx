import type { ReactNode } from "react";
import { Ban, CheckCircle2, Clock, Loader2, RotateCcw, XCircle } from "lucide-react";
import type { CheckoutPhase } from "@/types/payment";

type VisiblePhase = Exclude<CheckoutPhase, "idle">;

const COPY: Record<VisiblePhase, { title: string; body: string }> = {
  pending: { title: "Waiting for payment", body: "Complete the payment in the secure window to confirm your booking." },
  processing: { title: "Processing your payment", body: "Please don't refresh or close this page." },
  successful: { title: "Payment successful", body: "Your booking is confirmed." },
  failed: { title: "Payment failed", body: "Your payment could not be completed. Your booking is not confirmed yet." },
  cancelled: { title: "Payment cancelled", body: "You closed the payment window. You have not been charged." },
  retry: { title: "Try again", body: "You can retry the payment. If money was deducted it will be refunded automatically." },
};

function PhaseIcon({ phase }: { phase: VisiblePhase }) {
  const cls = "h-6 w-6 shrink-0";
  switch (phase) {
    case "processing":
      return <Loader2 className={`${cls} animate-spin text-brand`} aria-hidden="true" />;
    case "pending":
      return <Clock className={`${cls} text-brand`} aria-hidden="true" />;
    case "successful":
      return <CheckCircle2 className={`${cls} text-emerald-600`} aria-hidden="true" />;
    case "cancelled":
      return <Ban className={`${cls} text-muted`} aria-hidden="true" />;
    case "retry":
      return <RotateCcw className={`${cls} text-brand`} aria-hidden="true" />;
    case "failed":
      return <XCircle className={`${cls} text-danger`} aria-hidden="true" />;
  }
}

interface PaymentResultProps {
  phase: VisiblePhase;
  /** Overrides the default sentence, e.g. a server error message. */
  message?: string;
  actions?: ReactNode;
}

/** Shared status block for every checkout state. Failures are announced (alert); the rest are polite. */
export default function PaymentResult({ phase, message, actions }: PaymentResultProps) {
  const copy = COPY[phase];
  const urgent = phase === "failed";
  return (
    <div
      role={urgent ? "alert" : "status"}
      aria-live={urgent ? "assertive" : "polite"}
      className={`flex min-w-0 items-start gap-3 rounded border px-3 py-3 text-sm ${
        urgent ? "border-danger bg-danger-soft" : "border-line bg-canvas"
      }`}
    >
      <PhaseIcon phase={phase} />
      <div className="min-w-0 flex-1">
        <p className="font-semibold text-ink">{copy.title}</p>
        <p className="mt-0.5 break-words text-muted">{message ?? copy.body}</p>
        {actions && <div className="mt-2 flex flex-wrap gap-2">{actions}</div>}
      </div>
    </div>
  );
}
