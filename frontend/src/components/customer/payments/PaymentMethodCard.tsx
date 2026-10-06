import type { LucideIcon } from "lucide-react";
import { Banknote, CreditCard, Landmark, Smartphone, Wallet } from "lucide-react";
import { FOCUS_RING } from "../focusRing";
import type { CheckoutMethod } from "@/types/payment";

const ICONS: Record<CheckoutMethod, LucideIcon> = {
  upi: Smartphone,
  card: CreditCard,
  netbanking: Landmark,
  wallet: Wallet,
  cod: Banknote,
};

interface PaymentMethodCardProps {
  method: CheckoutMethod;
  label: string;
  hint: string;
  selected: boolean;
  disabled?: boolean;
  /** Radios in one group share a name so arrow keys move between them. */
  name: string;
  onSelect: (method: CheckoutMethod) => void;
}

/** One selectable payment option. A real radio input underneath: keyboard, screen readers and focus ring come for free. */
export default function PaymentMethodCard({ method, label, hint, selected, disabled = false, name, onSelect }: PaymentMethodCardProps) {
  const Icon = ICONS[method];
  return (
    <label
      className={`flex min-h-[44px] cursor-pointer items-center gap-3 rounded border px-3 py-2 transition-colors has-[:focus-visible]:ring-2 has-[:focus-visible]:ring-brand has-[:focus-visible]:ring-offset-2 ${
        selected ? "border-brand bg-brand-soft" : "border-line bg-panel hover:bg-canvas"
      } ${disabled ? "cursor-not-allowed opacity-60" : ""}`}
    >
      <input
        type="radio"
        name={name}
        value={method}
        checked={selected}
        disabled={disabled}
        onChange={() => onSelect(method)}
        className={`h-4 w-4 shrink-0 accent-[#4f46e5] ${FOCUS_RING}`}
      />
      <Icon className="h-5 w-5 shrink-0 text-brand" aria-hidden="true" />
      <span className="min-w-0">
        <span className="block text-sm font-medium text-ink">{label}</span>
        <span className="block break-words text-xs text-muted">{hint}</span>
      </span>
    </label>
  );
}
