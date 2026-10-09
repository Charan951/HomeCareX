import { useState } from "react";
import { ArrowRight, Briefcase, Check, Home, MapPin, Pencil, Trash2, TriangleAlert, type LucideIcon } from "lucide-react";
import clsx from "clsx";
import { FOCUS_RING } from "@/components/customer/focusRing";
import type { AddressDto } from "@/features/customer";
import AddressMap from "./AddressMap";

function addressIcon(label: string): LucideIcon {
  const l = label.toLowerCase();
  if (l.includes("home")) return Home;
  if (l.includes("office") || l.includes("work")) return Briefcase;
  return MapPin;
}

interface AddressCardProps {
  address: AddressDto;
  busy: boolean;
  onSelect: () => void;
  onEdit: () => void;
  onDelete: () => void;
}

/** One saved address: map thumbnail + details, "Deliver here" to select it, edit / delete (with an inline confirm). */
export default function AddressCard({ address: a, busy, onSelect, onEdit, onDelete }: AddressCardProps) {
  const [confirming, setConfirming] = useState(false);
  const Icon = addressIcon(a.label);
  const line = [a.line1, a.line2].filter(Boolean).join(", ");
  const cityLine = [a.city, a.pincode].filter(Boolean).join(" ");
  const unavailable = !a.serviceable;
  const btn = clsx("min-h-[40px] rounded-lg px-3 text-[13px] font-medium sm:min-h-[44px] sm:text-sm", FOCUS_RING);
  const iconBtn = clsx("flex h-9 w-9 items-center justify-center rounded-full text-muted transition-colors disabled:opacity-60 sm:h-11 sm:w-11", FOCUS_RING);

  return (
    <li className={clsx("overflow-hidden rounded-xl border bg-panel shadow-sm", unavailable ? "border-danger/40" : a.isDefault ? "border-brand/50 ring-1 ring-brand/20" : "border-line")}>
      <div className="flex items-start gap-2.5 p-2.5 sm:gap-3 sm:p-4">
        <AddressMap seed={a.id} className="h-12 w-12 shrink-0 rounded-lg border border-line sm:h-20 sm:w-20" />

        <div className="min-w-0 flex-1">
          <div className="flex flex-wrap items-center gap-x-2 gap-y-1">
            <Icon className="h-4 w-4 shrink-0 text-brand" aria-hidden="true" />
            <span className="text-sm font-semibold text-ink sm:text-base">{a.label}</span>
            {a.isDefault && (
              <span className="inline-flex items-center gap-1 rounded-full bg-brand px-2 py-0.5 text-[11px] font-medium text-white">
                <Check className="h-3 w-3" aria-hidden="true" /> Selected
              </span>
            )}
            {unavailable && (
              <span className="inline-flex items-center gap-1 rounded-full bg-danger-soft px-2 py-0.5 text-[11px] font-semibold text-danger">
                <TriangleAlert className="h-3 w-3" aria-hidden="true" /> Unavailable
              </span>
            )}
          </div>
          <p className="mt-0.5 line-clamp-2 break-words text-[13px] leading-snug text-ink sm:mt-1 sm:text-sm">{line}</p>
          {a.landmark && <p className="mt-0.5 line-clamp-1 break-words text-xs text-muted">Near {a.landmark}</p>}
          <p className="mt-0.5 text-xs text-muted">{cityLine}</p>
        </div>

        {!confirming && (
          <div className="-mr-1 -mt-0.5 flex shrink-0 flex-row">
            <button type="button" disabled={busy} onClick={onEdit} aria-label={`Edit ${a.label} address`} className={clsx(iconBtn, "hover:bg-brand-soft hover:text-brand")}>
              <Pencil className="h-4 w-4" aria-hidden="true" />
            </button>
            <button type="button" disabled={busy} onClick={() => setConfirming(true)} aria-label={`Delete ${a.label} address`} className={clsx(iconBtn, "hover:bg-danger-soft hover:text-danger")}>
              <Trash2 className="h-4 w-4" aria-hidden="true" />
            </button>
          </div>
        )}
      </div>

      {confirming ? (
        <div role="alert" className="flex flex-wrap items-center gap-2 border-t border-danger/20 bg-danger-soft px-3 py-2 text-[13px] text-danger sm:px-4 sm:py-2.5 sm:text-sm">
          <span className="mr-auto font-medium">Delete this address?</span>
          <button type="button" disabled={busy} onClick={onDelete} className={clsx(btn, "bg-danger text-white hover:opacity-90 disabled:opacity-60")}>
            {busy ? "Deleting…" : "Yes, delete"}
          </button>
          <button type="button" disabled={busy} onClick={() => setConfirming(false)} className={clsx(btn, "text-ink hover:bg-panel/60")}>
            Keep it
          </button>
        </div>
      ) : unavailable ? (
        <p className="border-t border-danger/20 bg-danger-soft px-3 py-1.5 text-[11px] leading-snug text-danger sm:px-4 sm:py-2 sm:text-xs">
          We don&apos;t serve this area yet, so it can&apos;t be used for bookings. Edit the pincode or remove it.
        </p>
      ) : a.isDefault ? (
        <p className="border-t border-brand/15 bg-brand-soft px-3 py-1.5 text-[11px] text-brand sm:px-4 sm:py-2 sm:text-xs">Your bookings and dashboard use this address.</p>
      ) : (
        <div className="flex  border border-line px-3 sm:px-3">
          <button
            type="button"
            disabled={busy}
            onClick={onSelect}
            className={clsx("inline-flex min-h-[40px] items-center gap-1 rounded text-[13px] font-semibold text-brand underline-offset-4 hover:underline disabled:opacity-60 sm:min-h-[44px] sm:text-sm", FOCUS_RING)}
          >
            {busy ? "Selecting…" : "Deliver here"}
            {!busy && <ArrowRight className="h-3.5 w-3.5" aria-hidden="true" />}
          </button>
        </div>
      )}
    </li>
  );
}
