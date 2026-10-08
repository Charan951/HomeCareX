import {
  useState,
  useEffect,
  useCallback,
  useRef,
  type FormEvent,
} from "react";
import { Loader2, X } from "lucide-react";
import { useQueryClient } from "@tanstack/react-query";
import { FOCUS_RING } from "@/components/customer/focusRing";
import { api } from "@/lib/api";
import { loadRazorpayScript } from "@/features/payments/razorpayLoader";

interface RazorpaySuccessPayload {
  razorpay_payment_id: string;
  razorpay_order_id: string;
  razorpay_signature: string;
}

interface RazorpayFailurePayload {
  error: {
    code: string;
    description: string;
    source: string;
    step: string;
    reason: string;
  };
}

interface AddMoneyModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess?: () => void;
  userEmail?: string;
  userName?: string;
}

const PRESET_AMOUNTS = [100, 200, 500, 1000];
const MIN_AMOUNT = 10;
const MAX_AMOUNT = 50000;
const MAX_FAILED_ATTEMPTS = 3;

export function AddMoneyModal({
  isOpen,
  onClose,
  onSuccess,
  userEmail,
  userName,
}: AddMoneyModalProps) {
  const [amount, setAmount] = useState<string>("500");
  const [isLoading, setIsLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const queryClient = useQueryClient();

  // Track failure count across the current payment session
  const failureCountRef = useRef(0);

  useEffect(() => {
    if (isOpen) {
      setErrorMsg(null);
      failureCountRef.current = 0;
    }
  }, [isOpen]);

  const handleKeyDown = useCallback(
    (e: KeyboardEvent) => {
      if (e.key === "Escape" && !isLoading) {
        onClose();
      }
    },
    [isLoading, onClose],
  );

  useEffect(() => {
    if (!isOpen) return;
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [isOpen, handleKeyDown]);

  if (!isOpen) return null;

  const handleTopup = async (e?: FormEvent) => {
    if (e) e.preventDefault();
    setErrorMsg(null);

    const numericAmount = Number(amount);
    if (!numericAmount || numericAmount < MIN_AMOUNT) {
      setErrorMsg(`Please enter an amount of at least ₹${MIN_AMOUNT}.`);
      return;
    }
    if (numericAmount > MAX_AMOUNT) {
      setErrorMsg(
        `Maximum top-up amount is ₹${MAX_AMOUNT.toLocaleString("en-IN")}.`,
      );
      return;
    }

    setIsLoading(true);

    try {
      const isLoaded = await loadRazorpayScript();
      const RazorpayConstructor = (window as unknown as { Razorpay: any })
        .Razorpay;

      if (!isLoaded || !RazorpayConstructor) {
        throw new Error(
          "Razorpay SDK failed to load. Please check your internet connection.",
        );
      }

      // 1. Create Order on Backend
      const { data: orderRes } = await api.post("/wallet/topup/order", {
        amount: numericAmount,
      });

      const { orderId, amount: amountInPaise, keyId } = orderRes.data;

      // 2. Open Razorpay Checkout modal
      const rzp = new RazorpayConstructor({
        key: keyId,
        amount: amountInPaise,
        currency: "INR",
        name: "HomeCareX",
        description: "Wallet Balance Top-Up",
        order_id: orderId,
        prefill: {
          name: userName,
          email: userEmail,
        },
        theme: {
          color: "#201547",
        },
        handler: async (response: RazorpaySuccessPayload) => {
          try {
            const { data: verifyRes } = await api.post("/wallet/topup/verify", {
              razorpay_order_id: response.razorpay_order_id,
              razorpay_payment_id: response.razorpay_payment_id,
              razorpay_signature: response.razorpay_signature,
              amount: amountInPaise,
            });

            const newBalance = verifyRes?.data?.balance;

            if (typeof newBalance === "number") {
              queryClient.setQueriesData(
                { queryKey: ["wallet"] },
                (old: any) => (old ? { ...old, balance: newBalance } : old),
              );
              queryClient.setQueriesData(
                { queryKey: ["customer", "wallet"] },
                (old: any) => (old ? { ...old, balance: newBalance } : old),
              );
            }

            await Promise.all([
              queryClient.invalidateQueries({ queryKey: ["wallet"] }),
              queryClient.invalidateQueries({
                queryKey: ["customer", "wallet"],
              }),
            ]);

            onSuccess?.();
            setIsLoading(false);
            onClose();
          } catch (err: unknown) {
            const error = err as { response?: { data?: { message?: string } } };
            setErrorMsg(
              error.response?.data?.message || "Failed to verify transaction.",
            );
            setIsLoading(false);
          }
        },
        modal: {
          ondismiss: () => {
            setIsLoading(false);
          },
        },
      });

      // 3. Listen to gateway failure events
      rzp.on("payment.failed", async (response: RazorpayFailurePayload) => {
        failureCountRef.current += 1;
        const currentFailures = failureCountRef.current;

        if (currentFailures >= MAX_FAILED_ATTEMPTS) {
          try {
            // Notify backend to record the transaction as failed in the ledger
            await api.post("/wallet/topup/fail", {
              orderId,
              amount: amountInPaise,
              reason: `Payment failed after 3 attempts: ${response.error.description || "Declined"}`,
            });

            // Instantly refresh the ledger so "Payment Failed" displays in the table
            await Promise.all([
              queryClient.invalidateQueries({ queryKey: ["wallet"] }),
              queryClient.invalidateQueries({
                queryKey: ["customer", "wallet"],
              }),
            ]);
            onSuccess?.();

            setErrorMsg(
              "Payment failed 3 times. The transaction has been recorded as failed.",
            );
          } catch (failErr) {
            console.error("Failed to record topup failure:", failErr);
          } finally {
            setIsLoading(false);
          }
        } else {
          setErrorMsg(
            `Payment attempt ${currentFailures} of ${MAX_FAILED_ATTEMPTS} failed: ${
              response.error.description ||
              "Please retry or use another payment method."
            }`,
          );
          setIsLoading(false);
        }
      });

      rzp.open();
    } catch (err: unknown) {
      const error = err as {
        response?: { data?: { message?: string } };
        message?: string;
      };
      setErrorMsg(
        error.response?.data?.message ||
          error.message ||
          "Could not initiate top-up.",
      );
      setIsLoading(false);
    }
  };

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-labelledby="add-money-title"
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4 backdrop-blur-sm"
      onClick={(e) => {
        if (e.target === e.currentTarget && !isLoading) {
          onClose();
        }
      }}
    >
      <div className="w-full max-w-md rounded-2xl border border-line bg-white p-6 shadow-xl">
        <div className="flex items-center justify-between border-b border-line pb-3">
          <h3 id="add-money-title" className="text-lg font-semibold text-ink">
            Top Up Wallet
          </h3>
          <button
            type="button"
            onClick={onClose}
            disabled={isLoading}
            className={`rounded-lg p-1 text-muted hover:bg-canvas disabled:opacity-50 ${FOCUS_RING}`}
          >
            <X className="h-5 w-5" />
            <span className="sr-only">Close</span>
          </button>
        </div>

        <form onSubmit={handleTopup} className="mt-4">
          <label
            htmlFor="topup-amount"
            className="block text-xs font-semibold uppercase tracking-wider text-muted"
          >
            Enter Amount (₹)
          </label>
          <div className="relative mt-1.5">
            <span className="pointer-events-none absolute left-3.5 top-1/2 -translate-y-1/2 text-lg font-semibold text-ink">
              ₹
            </span>
            <input
              id="topup-amount"
              type="number"
              min={MIN_AMOUNT}
              max={MAX_AMOUNT}
              disabled={isLoading}
              value={amount}
              onChange={(e) => {
                setAmount(e.target.value);
                if (errorMsg) setErrorMsg(null);
              }}
              className={`w-full rounded-xl border border-line py-2.5 pl-8 pr-4 text-lg font-semibold text-ink shadow-sm placeholder:text-muted disabled:bg-canvas disabled:text-muted ${FOCUS_RING}`}
              placeholder="500"
              autoFocus
            />
          </div>

          <div className="mt-3 flex gap-2">
            {PRESET_AMOUNTS.map((p) => (
              <button
                key={p}
                type="button"
                disabled={isLoading}
                onClick={() => {
                  setAmount(p.toString());
                  if (errorMsg) setErrorMsg(null);
                }}
                className="flex-1 rounded-lg border border-line bg-canvas py-1.5 text-xs font-medium text-ink transition-colors hover:border-brand hover:text-brand disabled:cursor-not-allowed disabled:opacity-50"
              >
                +₹{p}
              </button>
            ))}
          </div>

          {errorMsg && (
            <p className="mt-3 rounded-lg bg-red-50 p-2.5 text-xs font-medium text-red-600">
              {errorMsg}
            </p>
          )}

          <div className="mt-6 flex gap-3">
            <button
              type="button"
              onClick={onClose}
              disabled={isLoading}
              className={`w-1/2 rounded-xl border border-line bg-white py-2.5 text-sm font-medium text-ink hover:bg-canvas disabled:cursor-not-allowed disabled:opacity-50 ${FOCUS_RING}`}
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isLoading}
              className={`inline-flex w-1/2 items-center justify-center gap-2 rounded-xl bg-brand py-2.5 text-sm font-medium text-white shadow-sm hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-50 ${FOCUS_RING}`}
            >
              {isLoading && <Loader2 className="h-4 w-4 animate-spin" />}
              {isLoading ? "Processing…" : "Proceed to Pay"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
