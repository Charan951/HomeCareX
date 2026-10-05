export interface RazorpaySuccess {
  razorpay_payment_id: string;
  razorpay_order_id: string;
  razorpay_signature: string;
}

export interface RazorpayCheckoutInput {
  key: string;
  orderId: string;

  /** Amount in paise. Example: ₹599 = 59900 */
  amount: number;

  currency?: string;
  name?: string;
  description?: string;

  prefill?: {
    name?: string;
    email?: string;
    contact?: string;
  };
}

export class RazorpayCancelledError extends Error {
  constructor() {
    super("Payment was cancelled.");
    this.name = "RazorpayCancelledError";
  }
}

export class RazorpayFailedError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "RazorpayFailedError";
  }
}

interface RazorpayFailureResponse {
  error?: {
    code?: string;
    description?: string;
    source?: string;
    step?: string;
    reason?: string;
    metadata?: Record<string, unknown>;
  };
}

interface RazorpayInstance {
  open: () => void;
  close?: () => void;
  on: (
    event: "payment.failed" | string,
    callback: (response: RazorpayFailureResponse) => void
  ) => void;
}

interface RazorpayOptions {
  key: string;
  order_id: string;
  amount: number;
  currency: string;
  name: string;
  description?: string;

  prefill?: {
    name?: string;
    email?: string;
    contact?: string;
  };

  theme?: {
    color?: string;
  };

  handler: (response: RazorpaySuccess) => void;

  modal?: {
    ondismiss?: () => void;
    confirm_close?: boolean;
  };
}

declare global {
  interface Window {
    Razorpay?: new (options: RazorpayOptions) => RazorpayInstance;
  }
}

let scriptPromise: Promise<void> | null = null;

export function loadRazorpayScript(): Promise<void> {
  if (typeof window === "undefined") {
    return Promise.reject(
      new RazorpayFailedError(
        "Razorpay Checkout is only available in the browser."
      )
    );
  }

  if (window.Razorpay) {
    return Promise.resolve();
  }

  if (scriptPromise) {
    return scriptPromise;
  }

  scriptPromise = new Promise<void>((resolve, reject) => {
    // Avoid inserting the script more than once.
    const existingScript = document.querySelector<HTMLScriptElement>(
      'script[src="https://checkout.razorpay.com/v1/checkout.js"]'
    );

    if (existingScript) {
      existingScript.addEventListener("load", () => {
        if (window.Razorpay) {
          resolve();
        } else {
          scriptPromise = null;

          reject(
            new RazorpayFailedError(
              "Razorpay script loaded but Checkout is unavailable."
            )
          );
        }
      });

      existingScript.addEventListener("error", () => {
        scriptPromise = null;

        reject(
          new RazorpayFailedError(
            "Could not load Razorpay. Check your connection and try again."
          )
        );
      });

      return;
    }

    const script = document.createElement("script");

    script.src = "https://checkout.razorpay.com/v1/checkout.js";
    script.async = true;

    script.onload = () => {
      if (window.Razorpay) {
        resolve();
      } else {
        scriptPromise = null;

        reject(
          new RazorpayFailedError(
            "Razorpay Checkout could not be initialized."
          )
        );
      }
    };

    script.onerror = () => {
      scriptPromise = null;

      reject(
        new RazorpayFailedError(
          "Could not load Razorpay. Check your connection and try again."
        )
      );
    };

    document.body.appendChild(script);
  });

  return scriptPromise;
}

/**
 * Opens Razorpay Checkout.
 *
 * Resolves with:
 * - razorpay_payment_id
 * - razorpay_order_id
 * - razorpay_signature
 *
 * Rejects if payment fails or the modal is closed.
 */
export async function openRazorpayCheckout(
  input: RazorpayCheckoutInput
): Promise<RazorpaySuccess> {
  if (!input.key) {
    throw new RazorpayFailedError("Razorpay key is missing.");
  }

  if (!input.orderId) {
    throw new RazorpayFailedError("Razorpay order ID is missing.");
  }

  if (!Number.isFinite(input.amount) || input.amount <= 0) {
    throw new RazorpayFailedError("Invalid Razorpay payment amount.");
  }

  await loadRazorpayScript();

  if (!window.Razorpay) {
    throw new RazorpayFailedError("Razorpay Checkout is unavailable.");
  }

  return new Promise<RazorpaySuccess>((resolve, reject) => {
    let settled = false;

    const succeed = (response: RazorpaySuccess) => {
      if (settled) return;

      settled = true;
      resolve(response);
    };

    const fail = (error: Error) => {
      if (settled) return;

      settled = true;
      reject(error);
    };

    try {
      const razorpay = new window.Razorpay({
        key: input.key,
        order_id: input.orderId,
        amount: input.amount,
        currency: input.currency ?? "INR",

        name: input.name ?? "HomeCareX",
        description: input.description ?? "Home service booking",

        ...(input.prefill ? { prefill: input.prefill } : {}),

        theme: {
          color: "#4338ca",
        },

        handler: (response: RazorpaySuccess) => {
          console.log("[Razorpay] Payment success:", response);

          succeed(response);
        },

        modal: {
          confirm_close: true,

          ondismiss: () => {
            console.log("[Razorpay] Checkout dismissed");

            fail(new RazorpayCancelledError());
          },
        },
      });

      razorpay.on("payment.failed", (response) => {
        console.error("[Razorpay] Payment failed:", response);

        fail(
          new RazorpayFailedError(
            response?.error?.description ??
              "Payment failed. Please try again."
          )
        );
      });

      console.log("[Razorpay] Opening Checkout", {
        orderId: input.orderId,
        amount: input.amount,
        currency: input.currency ?? "INR",
      });

      razorpay.open();
    } catch (error) {
      console.error("[Razorpay] Checkout open error:", error);

      fail(
        error instanceof Error
          ? new RazorpayFailedError(error.message)
          : new RazorpayFailedError(
              "Unable to open Razorpay Checkout."
            )
      );
    }
  });
}