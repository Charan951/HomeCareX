import type { CheckoutMethod } from "@/types/payment";

export interface MethodInfo {
  id: CheckoutMethod;
  label: string;
  hint: string;
}

export const CHECKOUT_METHODS: MethodInfo[] = [
  { id: "upi", label: "UPI", hint: "Google Pay, PhonePe, Paytm, any UPI app" },
  { id: "card", label: "Credit / Debit card", hint: "Visa, Mastercard, RuPay" },
  { id: "netbanking", label: "Netbanking", hint: "All major banks" },
  { id: "wallet", label: "Wallet", hint: "Paytm, PhonePe and other wallets" },
  { id: "cod", label: "Cash on service", hint: "Pay the professional after the service" },
];

const LABELS: Record<string, string> = {
  upi: "UPI",
  card: "Card",
  netbanking: "Netbanking",
  wallet: "Wallet",
  cod: "Cash on service",
  emi: "EMI",
  paylater: "Pay later",
};

export function methodLabel(method: string | null | undefined): string {
  if (!method) return "—";
  return LABELS[method] ?? method.charAt(0).toUpperCase() + method.slice(1);
}
