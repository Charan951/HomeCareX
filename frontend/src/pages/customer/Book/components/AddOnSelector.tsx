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
    <div className="space-y-3">
      <h3 className="text-sm font-semibold text-ink">Additional Services</h3>
      {addOns.map((addon) => (
        <label
          key={addon.id}
          className="flex min-h-[44px] cursor-pointer items-center gap-3 rounded border border-line bg-panel p-3 hover:border-brand"
        >
          <input
            type="checkbox"
            className="h-4 w-4 rounded border-line text-brand focus:ring-brand"
            checked={selectedIds.has(addon.id)}
            onChange={() => onToggle(addon)}
          />
          <span className="flex-1 text-sm text-ink">{addon.name}</span>
          <span className="text-sm font-medium text-ink">+₹{addon.price}</span>
        </label>
      ))}
    </div>
  );
}
