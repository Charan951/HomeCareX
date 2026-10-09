import { useState } from "react";
import clsx from "clsx";
import { CircleAlert } from "lucide-react";
import { FOCUS_RING } from "@/components/customer/focusRing";
import type { ExtraCharge, ExtraChargeDecision } from "@/types/bookingDetail";
import { rupees } from "../../Bookings/bookingModel";
import { formatMoment } from "../bookingDetailModel";

interface Props {
  charges: ExtraCharge[];
  /** The partner is on site, so a decision is allowed. Otherwise pending charges are shown but not actionable. */
  canDecide: boolean;
  /** Sends the decision. Rejects with an Error-like object ({ message }) when the server refuses. */
  onDecide: (
    chargeId: string,
    decision: ExtraChargeDecision,
  ) => Promise<unknown>;
}

const STATUS_TEXT: Record<
  ExtraCharge["status"],
  { label: string; className: string }
> = {
  pending: {
    label: "Waiting for you",
    className: "bg-amber-50 text-amber-700",
  },
  approved: { label: "Approved", className: "bg-green-50 text-green-700" },
  rejected: { label: "Rejected", className: "bg-danger-soft text-danger" },
};

const BUTTON =
  "inline-flex min-h-[44px] flex-1 items-center justify-center rounded-xl px-4 text-sm font-semibold transition disabled:cursor-not-allowed disabled:opacity-60";

/** Extra work the partner asked for. Approve adds it to the bill; reject declines it. */
export default function ExtraChargeApproval({
  charges,
  canDecide,
  onDecide,
}: Props) {
  const [busy, setBusy] = useState<{
    id: string;
    decision: ExtraChargeDecision;
  } | null>(null);
  const [error, setError] = useState<{ id: string; message: string } | null>(
    null,
  );
  const [announcement, setAnnouncement] = useState("");

  if (charges.length === 0) return null;
  const hasPending = charges.some((c) => c.status === "pending");

  async function decide(charge: ExtraCharge, decision: ExtraChargeDecision) {
    setBusy({ id: charge._id, decision });
    setError(null);
    setAnnouncement("");
    try {
      await onDecide(charge._id, decision);
      setAnnouncement(
        `${charge.title} ${decision === "approve" ? "approved" : "rejected"}.`,
      );
    } catch (err) {
      const message =
        (err as { message?: string } | null)?.message ||
        "Couldn't save your answer. Please try again.";
      setError({ id: charge._id, message });
    } finally {
      setBusy(null);
    }
  }

  return (
    <section
      aria-labelledby="extra-charges-heading"
      className={clsx(
        "rounded-2xl border p-4 sm:p-5",
        hasPending && canDecide
          ? "border-amber-300 bg-amber-50/60"
          : "border-line bg-panel",
      )}
    >
      <h2
        id="extra-charges-heading"
        className="flex items-center gap-2 text-sm font-bold text-ink"
      >
        {hasPending && canDecide && (
          <CircleAlert className="h-4 w-4 text-amber-600" aria-hidden="true" />
        )}
        {hasPending && canDecide
          ? "Your partner needs your approval"
          : "Extra charges"}
      </h2>

      <ul className="mt-3 space-y-3">
        {charges.map((charge) => {
          const status = STATUS_TEXT[charge.status] ?? STATUS_TEXT.pending;
          const isBusy = busy?.id === charge._id;
          const requested = formatMoment(charge.requestedAt);
          return (
            <li
              key={charge._id}
              className="rounded-xl border border-line bg-panel p-3"
            >
              <div className="flex items-start justify-between gap-3">
                <div className="min-w-0">
                  <p className="break-words text-sm font-semibold text-ink">
                    {charge.title}
                  </p>
                  {charge.reason && (
                    <p className="mt-0.5 break-words text-sm text-muted">
                      {charge.reason}
                    </p>
                  )}
                  {requested && (
                    <p className="mt-0.5 text-xs text-muted">
                      Requested {requested}
                    </p>
                  )}
                </div>
                <div className="shrink-0 text-right">
                  <p className="text-sm font-bold tabular-nums text-ink">
                    {rupees(charge.amount)}
                  </p>
                  <span
                    className={clsx(
                      "mt-1 inline-block rounded-full px-2 py-0.5 text-xs font-medium",
                      status.className,
                    )}
                  >
                    {status.label}
                  </span>
                </div>
              </div>

              {charge.status === "pending" && canDecide && (
                <div
                  role="group"
                  aria-label={`Decide on ${charge.title}`}
                  className="mt-3 flex gap-2"
                >
                  <button
                    type="button"
                    disabled={busy !== null}
                    onClick={() => void decide(charge, "reject")}
                    className={clsx(
                      BUTTON,
                      "border border-line bg-panel text-ink hover:bg-slate-50",
                      FOCUS_RING,
                    )}
                  >
                    {isBusy && busy?.decision === "reject"
                      ? "Rejecting…"
                      : "Reject"}
                  </button>
                  <button
                    type="button"
                    disabled={busy !== null}
                    onClick={() => void decide(charge, "approve")}
                    className={clsx(
                      BUTTON,
                      "bg-brand text-white hover:opacity-90",
                      FOCUS_RING,
                    )}
                  >
                    {isBusy && busy?.decision === "approve"
                      ? "Approving…"
                      : `Approve ${rupees(charge.amount)}`}
                  </button>
                </div>
              )}

              {error?.id === charge._id && (
                <p role="alert" className="mt-2 text-sm text-danger">
                  {error.message}
                </p>
              )}
            </li>
          );
        })}
      </ul>

      <p role="status" aria-live="polite" className="sr-only">
        {announcement}
      </p>
    </section>
  );
}
