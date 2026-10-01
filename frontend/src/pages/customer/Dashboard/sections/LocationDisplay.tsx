import { Link } from "react-router-dom";
import { Briefcase, Home, MapPin, type LucideIcon } from "lucide-react";
import { customerPath } from "@/routes/customerPath";
import { FOCUS_RING } from "@/components/customer/focusRing";
import type { AddressDto } from "@/features/customer";

/** Pick an icon from the address label (Home / Office / anything else). */
function addressIcon(label: string): LucideIcon {
  const l = label.toLowerCase();
  if (l.includes("home")) return Home;
  if (l.includes("office") || l.includes("work")) return Briefcase;
  return MapPin;
}

/** The customer's default service address. Tapping it opens Addresses to change it or add a new one. */
export default function LocationDisplay({ address }: { address: AddressDto | null }) {
  const Icon = address ? addressIcon(address.label) : MapPin;
  const line = address ? [address.line1, address.line2].filter(Boolean).join(", ") : "";
  const cityLine = address ? [address.city, address.pincode].filter(Boolean).join(" ") : "";

  return (
    <Link
      to={customerPath("/addresses")}
      aria-label={address ? `Service address: ${address.label}, ${line}, ${cityLine}. Change or add an address` : "Add a service address"}
      className={`group flex min-h-[64px] items-center gap-3 rounded-xl border border-brand/25 bg-gradient-to-br from-brand-soft via-brand-soft/60 to-panel p-3 shadow-sm transition-all hover:border-brand/50 hover:shadow-md ${FOCUS_RING}`}
    >
      <span
        className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-brand text-white shadow-sm ring-4 ring-brand/10"
        aria-hidden="true"
      >
        <Icon className="h-[18px] w-[18px]" />
      </span>

      <span className="min-w-0 flex-1">
        <span className="flex items-center gap-2">
          {address && (
            <span className="rounded-full border border-brand/20 bg-panel px-2 py-px text-[11px] font-semibold text-brand">
              {address.label}
            </span>
          )}
          <span className="truncate text-[11px] font-medium uppercase tracking-wide text-muted">Service address</span>
        </span>
        {address ? (
          <>
            <span className="mt-1 line-clamp-2 block text-sm font-semibold leading-snug text-ink">{line}</span>
            <span className="mt-0.5 block truncate text-xs text-muted">{cityLine}</span>
          </>
        ) : (
          <span className="mt-1 block text-sm font-semibold text-ink">Add an address to get started</span>
        )}
      </span>
    </Link>
  );
}
