import type { ReactNode } from "react";
import { CalendarDays, MapPin, ShieldCheck } from "lucide-react";
import clsx from "clsx";
import { useBookingDraftStore } from "@/features/booking";
import { formatINR } from "../formatMoney";
import { formatSlotLabel } from "./SlotPicker";

/** "2026-10-07" -> "Wed, 7 Oct". Parsed as a local date so the day never shifts with the timezone. */
export function prettyDate(iso: string): string {
  const [y, m, d] = iso.split("-").map(Number);
  if (!y || !m || !d) return iso;
  return new Date(y, m - 1, d).toLocaleDateString("en-IN", { weekday: "short", day: "numeric", month: "short" });
}

interface BookingSummaryProps {
  ariaLabel: string;
  /** Back / Next buttons for this step. */
  actions: ReactNode;
  footnote: string;
}

/** Desktop booking summary shared by the Address and Date & Time steps: the service, a two-point visit
 *  timeline (address, date & time) that fills in as the customer chooses, and the running estimate. */
export default function BookingSummary({ ariaLabel, actions, footnote }: BookingSummaryProps) {
  const serviceName = useBookingDraftStore((s) => s.serviceName);
  const quantity = useBookingDraftStore((s) => s.quantity);
  const addOns = useBookingDraftStore((s) => s.addOns);
  const basePrice = useBookingDraftStore((s) => s.basePrice);
  const address = useBookingDraftStore((s) => s.addressSnapshot);
  const date = useBookingDraftStore((s) => s.date);
  const slot = useBookingDraftStore((s) => s.slot);

  const estimate = basePrice * quantity + addOns.reduce((sum, a) => sum + a.price * a.quantity, 0);

  const rows = [
    {
      key: "address",
      Icon: MapPin,
      label: address?.label ?? "Address",
      value: address ? `${address.line1}, ${address.city} – ${address.pincode}` : null,
      empty: "Choose where we should come",
    },
    {
      key: "slot",
      Icon: CalendarDays,
      label: "Date & time",
      value: date && slot ? `${prettyDate(date)} · ${formatSlotLabel(slot)}` : null,
      empty: "Pick a date and time",
    },
  ];

  return (
    <aside className="hidden lg:sticky lg:top-24 lg:block" aria-label={ariaLabel}>
      <div className="overflow-hidden rounded-3xl border border-line bg-panel shadow-[0_30px_70px_-44px_rgba(67,56,202,.6)]">
        <div className="bg-gradient-to-br from-brand to-[#6D5BE8] px-5 py-5 text-white">
          <p className="text-[11px] font-semibold uppercase tracking-wider text-white/70">Your booking</p>
          <p className="mt-1.5 text-lg font-bold leading-snug">{serviceName ?? "Home service"}</p>
          <p className="mt-0.5 text-sm text-white/80">
            Qty {quantity}
            {addOns.length > 0 && ` · + ${addOns.length} add-on${addOns.length > 1 ? "s" : ""}`}
          </p>
        </div>

        <ol className="relative space-y-5 px-5 py-5 before:absolute before:bottom-9 before:left-9 before:top-9 before:w-px before:bg-line">
          {rows.map(({ key, Icon, label, value, empty }) => (
            <li key={key} className="relative z-10 flex items-start gap-3">
              <span
                className={clsx(
                  "flex h-8 w-8 shrink-0 items-center justify-center rounded-full",
                  value ? "bg-brand text-white" : "border border-dashed border-line bg-panel text-muted",
                )}
              >
                <Icon className="h-4 w-4" aria-hidden="true" />
              </span>
              <div className="min-w-0 pt-0.5">
                <p className="text-xs text-muted">{label}</p>
                <p className={clsx("break-words text-sm", value ? "font-semibold text-ink" : "text-muted")}>{value ?? empty}</p>
              </div>
            </li>
          ))}
        </ol>

        <div className="mx-5 flex items-baseline justify-between border-t border-dashed border-line pt-4">
          <span className="text-sm text-muted">Estimated</span>
          <span className="text-xl font-bold tabular-nums text-ink">{formatINR(estimate)}</span>
        </div>

        <div className="flex items-center gap-2 px-5 py-5">{actions}</div>
        <p className="flex items-center justify-center gap-1.5 border-t border-line bg-canvas px-5 py-3 text-xs text-muted">
          <ShieldCheck className="h-3.5 w-3.5 text-emerald-600" aria-hidden="true" />
          {footnote}
        </p>
      </div>
    </aside>
  );
}
