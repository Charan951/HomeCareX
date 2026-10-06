import { Check } from "lucide-react";
import clsx from "clsx";
import { formatINR } from "../formatMoney";
import type { MockAddOn } from "../serviceCatalog.mock";

interface AddOnSelectorProps {
  addOns: MockAddOn[];
  selectedIds: ReadonlySet<string>;
  onToggle: (addOn: MockAddOn) => void;
}

/** Add-ons as tappable cards (a real, visually hidden checkbox keeps keyboard and screen-reader behaviour). */
export default function AddOnSelector({ addOns, selectedIds, onToggle }: AddOnSelectorProps) {
  if (addOns.length === 0) return null;

  return (
    <section aria-labelledby="addons-heading">
      <div className="flex items-end justify-between gap-3">
        <div>
          <h3 id="addons-heading" className="text-sm font-semibold text-ink">
            Additional Services
          </h3>
          <p className="mt-0.5 text-xs text-muted">Optional extras for this visit.</p>
        </div>
        <p role="status" className="text-xs font-semibold text-brand">
          {selectedIds.size > 0 ? `${selectedIds.size} selected` : ""}
        </p>
      </div>
      <ul className="mt-3 grid gap-2.5 md:grid-cols-2">
        {addOns.map((addon) => {
          const checked = selectedIds.has(addon.id);
          return (
            <li key={addon.id}>
              <label
                className={clsx(
                  "relative flex min-h-[60px] cursor-pointer items-center gap-3.5 rounded-2xl border p-3.5 transition-all duration-200 motion-reduce:transition-none",
                  checked
                    ? "border-brand bg-brand-soft/70 shadow-[0_14px_26px_-20px_rgba(67,56,202,.8)]"
                    : "border-line bg-panel hover:border-brand/50 motion-safe:hover:-translate-y-px",
                )}
              >
                <input type="checkbox" className="peer sr-only" checked={checked} onChange={() => onToggle(addon)} />
                <span aria-hidden="true" className="pointer-events-none absolute inset-0 rounded-2xl ring-brand ring-offset-2 peer-focus-visible:ring-2" />
                <span
                  aria-hidden="true"
                  className={clsx(
                    "flex h-6 w-6 shrink-0 items-center justify-center rounded-full border-2 transition-colors duration-200",
                    checked ? "border-brand bg-brand text-white" : "border-line text-transparent",
                  )}
                >
                  <Check className={clsx("h-3.5 w-3.5", checked && "bk-check-on")} strokeWidth={3.5} />
                </span>
                <span className="min-w-0 flex-1 text-sm font-medium text-ink">{addon.name}</span>
                <span className={clsx("shrink-0 rounded-full px-2.5 py-1 text-sm font-bold tabular-nums transition-colors", checked ? "bg-brand text-white" : "bg-canvas text-ink")}>
                  +{formatINR(addon.price)}
                </span>
              </label>
            </li>
          );
        })}
      </ul>
    </section>
  );
}
