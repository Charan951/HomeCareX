import { useState } from "react";
import { Briefcase, Check, Home, MapPin, Pencil, Trash2, type LucideIcon } from "lucide-react";
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
  const line = [a.line1, a.area].filter(Boolean).join(", ");
  const cityLine = [a.city, a.pincode].filter(Boolean).join(" ");
  const btn = clsx("min-h-[44px] rounded-lg px-3 text-sm font-medium", FOCUS_RING);
  const iconBtn = clsx("flex h-11 w-11 items-center justify-center rounded-full text-muted transition-colors disabled:opacity-60", FOCUS_RING);

  return (
    <li className={clsx("overflow-hidden rounded-xl border bg-panel shadow-sm", a.isDefault ? "border-brand/50 ring-1 ring-brand/20" : "border-line")}>
      <div className="flex items-start gap-3 p-3.5 sm:p-4">
        <AddressMap seed={a.id} className="h-20 w-20 shrink-0 rounded-lg border border-line" />

        <div className="min-w-0 flex-1">
          <div className="flex flex-wrap items-center gap-x-2 gap-y-1">
            <Icon className="h-4 w-4 shrink-0 text-brand" aria-hidden="true" />
            <span className="font-semibold text-ink">{a.label}</span>
            {a.isDefault && (
              <span className="inline-flex items-center gap-1 rounded-full bg-brand px-2 py-0.5 text-[11px] font-medium text-white">
                <Check className="h-3 w-3" aria-hidden="true" /> Selected
              </span>
            )}
          </div>
          <p className="mt-1 line-clamp-2 break-words text-sm leading-snug text-ink">{line}</p>
          <p className="mt-0.5 text-xs text-muted">{cityLine}</p>
        </div>

        {!confirming && (
          <div className="-mr-1 -mt-1 flex shrink-0 flex-col sm:flex-row">
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
        <div role="alert" className="flex flex-wrap items-center gap-2 border-t border-danger/20 bg-danger-soft px-4 py-2.5 text-sm text-danger">
          <span className="mr-auto font-medium">Delete this address?</span>
          <button type="button" disabled={busy} onClick={onDelete} className={clsx(btn, "bg-danger text-white hover:opacity-90 disabled:opacity-60")}>
            {busy ? "Deleting…" : "Yes, delete"}
          </button>
          <button type="button" disabled={busy} onClick={() => setConfirming(false)} className={clsx(btn, "text-ink hover:bg-panel/60")}>
            Keep it
          </button>
        </div>
      ) : a.isDefault ? (
        <p className="border-t border-brand/15 bg-brand-soft px-4 py-2 text-xs text-brand">Your bookings and dashboard use this address.</p>
      ) : (
        <div className="border-t border-line px-3.5 py-2.5 sm:px-4">
          <button type="button" disabled={busy} onClick={onSelect} className={clsx(btn, "w-full border border-brand text-brand hover:bg-brand-soft disabled:opacity-60 sm:w-auto")}>
            {busy ? "Selecting…" : "Deliver here"}
          </button>
        </div>
      )}
    </li>
  );
}
