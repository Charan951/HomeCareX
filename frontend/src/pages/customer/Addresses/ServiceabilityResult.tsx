import { CheckCircle2, Loader2, TriangleAlert } from "lucide-react";
import clsx from "clsx";
import { FOCUS_RING } from "@/components/customer/focusRing";
import { useServiceability } from "@/features/customer";

interface ServiceabilityResultProps {
  /** Checked as soon as it is 6 digits long; anything shorter shows a hint. */
  pincode: string;
  /** For aria-describedby on the pincode input. */
  id?: string;
  className?: string;
}

/**
 * Tells the customer whether we serve a pincode: "We serve this area" or "unavailable".
 * It runs the check itself (GET /serviceability), so any form can drop it in under a pincode field.
 */
export default function ServiceabilityResult({ pincode, id, className }: ServiceabilityResultProps) {
  const { status, result, retry } = useServiceability(pincode);

  return (
    <p id={id} role="status" aria-live="polite" className={clsx("mt-1.5 flex min-h-[1.75rem] flex-wrap items-center gap-x-1.5 text-xs", className)}>
      {status === "idle" && <span className="text-muted">Enter your 6-digit pincode to check we serve your area.</span>}
      {status === "checking" && (
        <span className="inline-flex items-center gap-1.5 text-muted">
          <Loader2 className="h-3.5 w-3.5 animate-spin" aria-hidden="true" /> Checking your area…
        </span>
      )}
      {status === "serviceable" && (
        <span className="inline-flex items-center gap-1.5 rounded-full bg-emerald-50 px-3 py-1 font-medium text-emerald-700">
          <CheckCircle2 className="h-3.5 w-3.5" aria-hidden="true" /> We serve this area{result?.city ? ` (${result.city})` : ""}.
        </span>
      )}
      {status === "unserviceable" && (
        <span className="inline-flex items-center gap-1.5 rounded-full bg-danger-soft px-3 py-1 font-medium text-danger">
          <TriangleAlert className="h-3.5 w-3.5" aria-hidden="true" /> Unavailable: we don&apos;t serve this pincode yet.
        </span>
      )}
      {status === "error" && (
        <>
          <span className="inline-flex items-center gap-1.5 text-muted">
            <TriangleAlert className="h-3.5 w-3.5" aria-hidden="true" /> Couldn&apos;t check this pincode right now.
          </span>
          <button type="button" onClick={retry} className={clsx("rounded font-medium text-brand underline", FOCUS_RING)}>
            Try again
          </button>
        </>
      )}
    </p>
  );
}
