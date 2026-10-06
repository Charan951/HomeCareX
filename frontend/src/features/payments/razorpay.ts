import type { CheckoutMethod } from "@/types/payment";

/** Only the parts of Razorpay Checkout this app uses, so no `any` is needed. */
export interface RazorpaySuccess {
  razorpay_order_id: string;
  razorpay_payment_id: string;
  razorpay_signature: string;
}

export interface RazorpayFailure {
  error?: { code?: string; description?: string; reason?: string };
}

type RazorpayMethodFlags = Partial<Record<"upi" | "card" | "netbanking" | "wallet" | "emi" | "paylater", boolean>>;

export interface RazorpayOptions {
  key: string;
  amount: number;
  currency: string;
  name: string;
  description?: string;
  order_id: string;
  handler: (response: RazorpaySuccess) => void;
  prefill?: { name?: string; email?: string; contact?: string };
  theme?: { color?: string };
  method?: RazorpayMethodFlags;
  modal?: { ondismiss?: () => void };
}

export interface RazorpayInstance {
  open(): void;
  close(): void;
  on(event: "payment.failed", callback: (response: RazorpayFailure) => void): void;
}

declare global {
  interface Window {
    Razorpay?: new (options: RazorpayOptions) => RazorpayInstance;
  }
}

const SCRIPT_ID = "razorpay-checkout-js";
const SCRIPT_SRC = "https://checkout.razorpay.com/v1/checkout.js";

/** Loads checkout.js once. Resolves false (never throws) when offline or blocked. */
export function loadRazorpayScript(): Promise<boolean> {
  if (typeof window !== "undefined" && window.Razorpay) return Promise.resolve(true);
  return new Promise((resolve) => {
    const existing = document.getElementById(SCRIPT_ID);
    if (existing) existing.remove(); // a previous load that failed leaves a dead tag behind
    const script = document.createElement("script");
    script.id = SCRIPT_ID;
    script.src = SCRIPT_SRC;
    script.onload = () => resolve(Boolean(window.Razorpay));
    script.onerror = () => {
      script.remove();
      resolve(false);
    };
    document.body.appendChild(script);
  });
}

/** Shows only the method the customer picked inside Razorpay's popup. */
export function razorpayMethodOptions(method: Exclude<CheckoutMethod, "cod">): RazorpayMethodFlags {
  return { upi: false, card: false, netbanking: false, wallet: false, emi: false, paylater: false, [method]: true };
}

/** Removes the Razorpay backdrop/iframe if it is left behind after a cancel or an unmount. */
export function forceCloseRazorpayModal(): void {
  document.querySelectorAll(".razorpay-container, iframe[src*='razorpay'], .razorpay-backdrop").forEach((el) => el.remove());
  document.body.style.overflow = "";
}
