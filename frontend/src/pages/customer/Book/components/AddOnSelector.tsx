import type { MockAddOn } from "../serviceCatalog.mock";

interface AddOnSelectorProps {
  addOns: MockAddOn[];
  selectedIds: ReadonlySet<string>;
  onToggle: (addOn: MockAddOn) => void;
}

/** Checkbox list of add-ons with their price, used by Step 1. */
export default function AddOnSelector({ addOns, selectedIds, onToggle }: AddOnSelectorProps) {
  if (addOns.length === 0) return null;

  return (
    <div className="space-y-1.5">
      <h3 className="text-sm font-semibold text-ink">Additional Services</h3>
      {addOns.map((addon) => {
        const checked = selectedIds.has(addon.id);
        return (
          <label
            key={addon.id}
            className={`flex min-h-[44px] cursor-pointer items-center gap-3 rounded border px-3 py-2 transition-colors hover:border-brand ${
              checked ? "border-brand bg-brand-soft/20" : "border-line bg-panel"
            }`}
          >
            <input
              type="checkbox"
              className="h-4 w-4 shrink-0 rounded border-line text-brand focus:ring-brand"
              checked={checked}
              onChange={() => onToggle(addon)}
            />
            <span className="min-w-0 flex-1 text-sm text-ink">{addon.name}</span>
            <span className="shrink-0 text-sm font-medium text-ink">+₹{addon.price}</span>
          </label>
        );
      })}
    </div>
  );
}