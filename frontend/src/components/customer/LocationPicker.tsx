import { useEffect, useRef, useState } from "react";
import { Link } from "react-router-dom";
import { Briefcase, Check, ChevronDown, Home, MapPin, Plus, type LucideIcon } from "lucide-react";
import clsx from "clsx";
import { customerPath } from "@/routes/customerPath";
import { useAddresses, useSetDefaultAddress } from "@/features/customer";
import { FOCUS_RING } from "./focusRing";

function iconFor(label: string): LucideIcon {
  const l = label.toLowerCase();
  if (l.includes("home")) return Home;
  if (l.includes("office") || l.includes("work")) return Briefcase;
  return MapPin;
}

/**
 * Zomato-style delivery-location control for the top bar: pin + bold label + chevron,
 * with the street address underneath. Opens a dropdown to switch address or add a new one.
 * Switching sets the default address (the one the dashboard shows) without leaving the page.
 */
export default function LocationPicker() {
  const { data, isPending, isError, refetch } = useAddresses();
  const select = useSetDefaultAddress();
  const [open, setOpen] = useState(false);
  const [busyId, setBusyId] = useState<string | null>(null);
  const wrapRef = useRef<HTMLDivElement>(null);
  const triggerRef = useRef<HTMLButtonElement>(null);

  useEffect(() => {
    if (!open) return;
    const onDown = (e: MouseEvent) => {
      if (wrapRef.current && !wrapRef.current.contains(e.target as Node)) setOpen(false);
    };
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        setOpen(false);
        triggerRef.current?.focus();
      }
    };
    document.addEventListener("mousedown", onDown);
    document.addEventListener("keydown", onKey);
    return () => {
      document.removeEventListener("mousedown", onDown);
      document.removeEventListener("keydown", onKey);
    };
  }, [open]);

  const list = data ?? [];
  const current = list.find((a) => a.isDefault) ?? list[0];
  const line = current ? [current.line1, current.line2, current.city].filter(Boolean).join(", ") : "";

  function choose(id: string, isDefault: boolean) {
    if (isDefault) return setOpen(false);
    setBusyId(id);
    select.mutate(id, { onSuccess: () => setOpen(false), onSettled: () => setBusyId(null) });
  }

  return (
    <div ref={wrapRef} className="relative min-w-0">
      <button
        ref={triggerRef}
        type="button"
        onClick={() => setOpen((v) => !v)}
        aria-expanded={open}
        aria-controls="topbar-address-menu"
        aria-label={current ? `Service address: ${current.label}, ${line}. Change address` : "Choose a service address"}
        className={clsx("location-picker-trigger flex min-w-0 max-w-[380px] items-center gap-2 rounded-xl px-1.5 py-1.5 text-left transition-all duration-200 hover:bg-canvas active:scale-[.98]", FOCUS_RING)}
      >
        <span className="location-picker-pin flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-brand-soft text-brand shadow-sm"><MapPin className="h-4 w-4" aria-hidden="true" /></span>
        <span className="min-w-0 flex-1">
          <span className="mb-0.5 flex min-w-0 items-center gap-1 text-xs font-medium leading-tight text-muted">
            <span className="shrink-0">Deliver to</span>
            <span aria-hidden="true">•</span>
            <span className="min-w-0 truncate font-bold text-brand">{isPending ? "Locating…" : isError ? "Unavailable" : current?.label ?? "Add address"}</span>
            <ChevronDown className={clsx("h-4 w-4 shrink-0 text-brand transition-transform", open && "rotate-180")} aria-hidden="true" />
          </span>
          <span className="location-picker-address block truncate text-xs font-medium leading-tight text-ink/75">{isError ? "Couldn't load addresses" : line || "Select where we should come"}</span>
        </span>
      </button>

      {open && (
        <div id="topbar-address-menu" className="location-picker-menu fixed inset-x-3 top-[68px] z-50 overflow-hidden rounded-xl border border-line bg-panel shadow-xl md:absolute md:inset-x-auto md:left-0 md:top-full md:mt-2 md:w-[380px]">
          <Link
            to={customerPath("/addresses")}
            onClick={() => setOpen(false)}
            className={clsx("flex min-h-[52px] items-center gap-3 border-b border-line px-4 text-sm font-semibold text-brand hover:bg-brand-soft", FOCUS_RING)}
          >
            <Plus className="h-5 w-5" aria-hidden="true" /> Add new address
          </Link>

          <p className="px-4 pb-1 pt-3 text-xs font-medium text-muted">Saved addresses</p>
          {isError && list.length === 0 ? (
            <div role="alert" className="px-4 pb-4 text-sm text-muted">
              Couldn't load your addresses.{" "}
              <button type="button" onClick={() => void refetch()} className={clsx("rounded font-medium text-brand underline", FOCUS_RING)}>
                Retry
              </button>
            </div>
          ) : list.length === 0 ? (
            <p className="px-4 pb-4 text-sm text-muted">{isPending ? "Loading your addresses…" : "No saved addresses yet."}</p>
          ) : (
            <ul className="max-h-72 overflow-y-auto pb-2">
              {list.map((a) => {
                const Icon = iconFor(a.label);
                const active = a.id === current?.id;
                return (
                  <li key={a.id}>
                    <button
                      type="button"
                      disabled={busyId === a.id}
                      onClick={() => choose(a.id, a.isDefault)}
                      aria-current={active}
                      className={clsx("flex w-full items-start gap-3 px-4 py-2.5 text-left transition-colors hover:bg-canvas disabled:opacity-60", FOCUS_RING, active && "bg-brand-soft/60")}
                    >
                      <Icon className={clsx("mt-0.5 h-5 w-5 shrink-0", active ? "text-brand" : "text-muted")} aria-hidden="true" />
                      <span className="min-w-0 flex-1">
                        <span className="block text-sm font-semibold text-ink">{a.label}</span>
                        <span className="line-clamp-2 block text-xs leading-snug text-muted">{[a.line1, a.line2, a.city, a.pincode].filter(Boolean).join(", ")}</span>
                      </span>
                      {active && <Check className="mt-0.5 h-4 w-4 shrink-0 text-brand" aria-hidden="true" />}
                    </button>
                  </li>
                );
              })}
            </ul>
          )}
          {select.isError && <p role="alert" className="border-t border-line bg-danger-soft px-4 py-2 text-xs text-danger">{select.error.message}</p>}
        </div>
      )}
    </div>
  );
}
