import { CheckCircle2, MapPin, XCircle } from "lucide-react";

import type { JobRequest } from "@/types/partner";

interface Props {
  status: "accepted" | "rejected";
  request: JobRequest;
  onDismiss: (id: string) => void;
}

export default function JobOutcomeCard({ status, request, onDismiss }: Props) {
  const accepted = status === "accepted";

  const when = new Date(request.scheduledAt).toLocaleString([], {
    day: "numeric",
    month: "short",
    hour: "numeric",
    minute: "2-digit",
  });

  return (
    <li
      className={`rounded border p-4 ${
        accepted ? "border-green-200 bg-green-50" : "border-line bg-canvas"
      }`}
    >
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <p
            className={`flex items-center gap-1.5 text-sm font-semibold ${
              accepted ? "text-green-800" : "text-muted"
            }`}
          >
            {accepted ? (
              <CheckCircle2 size={16} aria-hidden="true" />
            ) : (
              <XCircle size={16} aria-hidden="true" />
            )}
            {accepted ? "Accepted" : "Rejected"}
          </p>

          <p className="mt-1 text-sm font-medium text-ink">{request.service}</p>

          {accepted ? (
            <>
              <p className="mt-1 flex items-start gap-1 text-xs text-ink">
                <MapPin
                  size={13}
                  className="mt-0.5 shrink-0"
                  aria-hidden="true"
                />
                {request.address ?? request.area}
              </p>

              <p className="mt-1 text-xs text-muted">{when}</p>

              <p className="mt-1 text-sm font-semibold text-ink">
                ₹{request.price.toLocaleString("en-IN")}
              </p>
            </>
          ) : (
            <p className="mt-1 text-xs text-muted">
              This offer has been sent to the next partner.
            </p>
          )}
        </div>

        <button
          type="button"
          onClick={() => onDismiss(request.id)}
          aria-label="Dismiss"
          className="shrink-0 rounded px-1 text-base leading-none text-muted hover:text-ink"
        >
          ×
        </button>
      </div>
    </li>
  );
}