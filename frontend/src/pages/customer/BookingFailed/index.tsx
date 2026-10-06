import { Link, useNavigate, useParams, useSearchParams } from "react-router-dom";
import { XCircle } from "lucide-react";
import { useBookingDraftStore } from "@/features/booking";
import { FOCUS_RING } from "@/components/customer/focusRing";
import { customerPath } from "@/routes/customerPath";

type Reason = "failed" | "verification" | "network" | "slot" | "cancelled";

const COPY: Record<Reason, { title: string; lines: string[]; canRetry: boolean }> = {
  failed: {
    title: "Payment Failed",
    lines: [
      "Your payment could not be completed.",
      "Your booking has not been confirmed. Please try again.",
    ],
    canRetry: true,
  },
  cancelled: {
    title: "Payment Cancelled",
    lines: [
      "You closed the payment window, so you have not been charged.",
      "Your booking is not confirmed yet. You can retry or choose cash on service.",
    ],
    canRetry: true,
  },
  verification: {
    title: "Payment Verification Failed",
    lines: [
      "Payment verification failed.",
      "Please contact support or retry.",
    ],
    canRetry: true,
  },
  network: {
    title: "We Couldn't Confirm Your Payment",
    lines: [
      "Something went wrong while confirming your payment.",
      "Please check My Bookings / payment status before trying again.",
    ],
    canRetry: false,
  },
  slot: {
    title: "Slot No Longer Available",
    lines: [
      "This slot is no longer available.",
      "Please select another slot.",
    ],
    canRetry: false,
  },
};

export default function BookingFailed() {
  const { bookingId } = useParams<{ bookingId: string }>();
  const [params] = useSearchParams();
  const navigate = useNavigate();
  const serviceSlug = useBookingDraftStore((s) => s.serviceSlug);
  const setStep = useBookingDraftStore((s) => s.setStep);

  const raw = params.get("reason");
  const reason: Reason =
    raw === "verification" || raw === "network" || raw === "slot" || raw === "cancelled" ? raw : "failed";
  const copy = COPY[reason];

  const goBack = (step: 3 | 4) => {
    if (!serviceSlug) return navigate(customerPath("/services"), { replace: true });
    setStep(step);
    navigate(`${customerPath(`/book/${serviceSlug}`)}?step=${step}`, { replace: true });
  };

  const bookingCode = bookingId ? `BK-${bookingId.slice(-5).toUpperCase()}` : null;

  return (
    <div className="min-h-[calc(100vh-64px)] w-full bg-white">
      {/* Top Header with Soft Blue Shade Fading Downward */}
      <div className="w-full bg-gradient-to-b from-blue-50/70 via-blue-50/20 to-transparent px-6 pb-6 pt-12 sm:pt-16">
        <div className="mx-auto max-w-4xl text-center">
          <span className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-red-50 text-red-600 select-none">
            <XCircle className="h-7 w-7" aria-hidden="true" />
          </span>

          <h1 className="mt-4 font-serif text-3xl font-normal tracking-tight text-gray-900 outline-none focus:outline-none sm:text-4xl">
            {copy.title}
          </h1>

          <div role="alert" className="mt-5 space-y-1.5 text-xs text-gray-500 sm:text-sm">
            {copy.lines.map((l) => (
              <p key={l}>{l}</p>
            ))}
          </div>

          {bookingCode && (
            <p className="mt-3 text-xs text-gray-400">
              Reference: <span className="font-medium text-gray-600">{bookingCode}</span>
            </p>
          )}
        </div>
      </div>

      {/* Main Action Section (Wide Canvas max-w-4xl) */}
      <main className="mx-auto max-w-4xl px-6 pb-16 pt-6 sm:px-8">
        <section aria-labelledby="actions-heading">
          <h2 id="actions-heading" className="font-serif text-xl font-medium text-gray-900 sm:text-2xl">
            Next Steps
          </h2>

          <p className="mt-2 text-xs text-gray-500 sm:text-sm">
            You can try completing your payment again or view your existing requests in My Bookings.
          </p>

          <div className="mt-6 flex flex-wrap items-center gap-6 text-xs sm:text-sm">
            {copy.canRetry && (
              <button
                type="button"
                onClick={() => goBack(4)}
                className={`font-semibold text-brand underline underline-offset-4 transition-colors hover:text-brand/80 ${FOCUS_RING}`}
              >
                Retry Payment
              </button>
            )}

            {reason === "slot" && (
              <button
                type="button"
                onClick={() => goBack(3)}
                className={`font-semibold text-brand underline underline-offset-4 transition-colors hover:text-brand/80 ${FOCUS_RING}`}
              >
                Choose another slot
              </button>
            )}

            <Link
              to={customerPath("/bookings")}
              className={`underline underline-offset-4 text-gray-700 hover:text-black transition-colors ${FOCUS_RING}`}
            >
              View My Bookings
            </Link>

            <Link
              to={customerPath("/")}
              className={`underline underline-offset-4 text-gray-500 hover:text-black transition-colors ${FOCUS_RING}`}
            >
              Return to Home
            </Link>
          </div>
        </section>
      </main>
    </div>
  );
}