import { useEffect } from "react";
import { useQuery } from "@tanstack/react-query";
import { Link, useParams } from "react-router-dom";
import { Star } from "lucide-react";
import { bookingApi, type NormalizedApiError } from "@/services/bookingApi";
import { ErrorState, LoadingState } from "@/components/customer";
import { FOCUS_RING } from "@/components/customer/focusRing";
import { customerPath } from "@/routes/customerPath";
import { useBookingDraftStore } from "@/features/booking";
import { BOOKING_STATUS, type BookingView } from "@/types/booking";
import { formatSlotLabel } from "../Book/components/SlotPicker";

function formatDate(iso: string): string {
  const [y, m, d] = iso.split("-").map(Number);
  return new Date(y, m - 1, d).toLocaleDateString("en-US", {
    month: "long",
    day: "numeric",
    year: "numeric",
  });
}

function StarHeader() {
  return (
    <div className="flex items-center justify-center gap-1.5 text-[#bfa071] select-none" aria-hidden="true">
      <span className="h-1 w-1 rounded-full bg-[#bfa071]" />
      <Star className="h-2.5 w-2.5 fill-[#bfa071] text-[#bfa071]" />
      <Star className="h-3 w-3 fill-[#bfa071] text-[#bfa071] -translate-y-0.5" />
      <Star className="h-4 w-4 fill-[#bfa071] text-[#bfa071] -translate-y-1" />
      <Star className="h-3 w-3 fill-[#bfa071] text-[#bfa071] -translate-y-0.5" />
      <Star className="h-2.5 w-2.5 fill-[#bfa071] text-[#bfa071]" />
      <span className="h-1 w-1 rounded-full bg-[#bfa071]" />
    </div>
  );
}

export default function BookingSuccess() {
  const { bookingId } = useParams<{ bookingId: string }>();

  const { data, isLoading, isError, error, refetch } = useQuery<BookingView, NormalizedApiError>({
    queryKey: ["booking", bookingId],
    queryFn: () => bookingApi.getBooking(bookingId as string),
    enabled: Boolean(bookingId),
    refetchInterval: (query) => {
      // Auto-refresh every 5 seconds if the payment is still pending
      return query.state.data?.status === BOOKING_STATUS.PENDING_PAYMENT ? 5000 : false;
    },
  });

  const clearDraft = useBookingDraftStore((s) => s.clearDraft);
  
  const isPaymentPending = data?.status === BOOKING_STATUS.PENDING_PAYMENT;
  
  // Valid states for this page: Paid, Cash on Service (Pending), or Online Payment Processing
  const isValidView =
    data !== undefined &&
    data.status !== BOOKING_STATUS.CANCELLED_BY_CUSTOMER &&
    (data.paymentStatus === "PAID" || data.paymentStatus === "PENDING" || isPaymentPending);

  useEffect(() => {
    if (isValidView) clearDraft();
  }, [isValidView, clearDraft]);

  if (isLoading) return <LoadingState label="Loading your booking…" />;

  if (isError || !data) {
    return (
      <ErrorState
        title="Couldn't load your booking"
        message={error?.message}
        onRetry={() => void refetch()}
      />
    );
  }

  // "Cash on Service" condition (booking is confirmed, but payment is intentionally pending)
  const payOnService = data.paymentStatus === "PENDING" && !isPaymentPending;

  if (!isValidView) {
    return (
      <div className="flex min-h-[calc(100vh-64px)] w-full items-center justify-center px-4 py-8">
        <div className="w-full max-w-lg rounded-2xl border border-line bg-panel p-6 text-center shadow-sm">
          <h1 className="font-serif text-xl font-semibold text-ink">Booking Cancelled or Invalid</h1>
          <p className="mt-2 text-sm text-muted">
            This booking cannot be displayed. Check My Bookings for more details.
          </p>
          <Link
            to={customerPath("/bookings")}
            className={`mt-5 inline-flex min-h-[44px] items-center justify-center rounded-lg bg-brand px-6 text-sm font-semibold text-white shadow-sm transition-opacity hover:opacity-90 ${FOCUS_RING}`}
          >
            View My Bookings
          </Link>
        </div>
      </div>
    );
  }

  const base = data.priceSnapshot.lines.find((l) => l.kind === "BASE");
  const a = data.addressSnapshot;
  const address = [a.line1, a.line2, a.city, a.state].filter(Boolean).join(", ") + ` — ${a.pincode}`;
  const slot = formatSlotLabel(data.slot);
  const bookingNumber = data._id.slice(-6).toUpperCase();

  return (
    <div className="min-h-[calc(100vh-64px)] w-full bg-white">
      {/* Dynamic Banner: Amber for pending, Green for confirmed */}
      <div className={`w-full bg-gradient-to-b ${isPaymentPending ? 'from-amber-100 via-amber-50' : 'from-[#dcfce7] via-[#f0fdf4]'} to-white px-6 pb-8 pt-12 sm:pt-16`}>
        <div className="mx-auto max-w-4xl text-center">
          <StarHeader />

          <h1 className="mt-4 font-serif text-3xl font-normal tracking-tight text-gray-900 outline-none focus:outline-none sm:text-4xl">
            {isPaymentPending ? "Payment Processing" : "Booking Confirmed"}
          </h1>

          <div className="mt-6 space-y-2 text-xs text-gray-600 sm:text-sm">
            {isPaymentPending ? (
              <>
                <p>We have recorded your booking request and are waiting for payment confirmation.</p>
                <p className="font-semibold text-amber-700 animate-pulse">
                  Please do not refresh. This page will update automatically...
                </p>
              </>
            ) : (
              <>
                <p>We are pleased to inform you that your reservation request has been received and confirmed.</p>
                <p className="font-semibold text-gray-800">
                  Your booking is confirmed. Thank You!
                </p>
              </>
            )}
            
            {payOnService && (
              <p className="text-gray-700">
                Payment: cash on service. Please pay ₹{data.priceSnapshot.total} to the professional after the visit.
              </p>
            )}
          </div>
        </div>
      </div>

      <main className="mx-auto max-w-4xl px-6 pb-16 pt-2 sm:px-8">
        <section aria-labelledby="details-heading">
          <h2 id="details-heading" className="font-serif text-xl font-medium text-gray-900 sm:text-2xl">
            Booking Details
          </h2>

          <div className="mt-5 grid grid-cols-2 gap-y-6 border-y border-dashed border-gray-200 py-4 sm:grid-cols-4 sm:gap-x-4 sm:border-y-0 sm:py-2">
            <div className="sm:border-r sm:border-dashed sm:border-gray-200 sm:pr-6">
              <span className="block text-xs text-gray-500">Booking:</span>
              <span className="mt-1 block font-bold text-gray-900">{bookingNumber}</span>
            </div>

            <div className="sm:border-r sm:border-dashed sm:border-gray-200 sm:px-6">
              <span className="block text-xs text-gray-500">Date &amp; Time:</span>
              <span className="mt-1 block font-bold text-gray-900">
                {formatDate(data.date)}
              </span>
              <span className="block text-xs text-gray-500">{slot}</span>
            </div>

            <div className="sm:border-r sm:border-dashed sm:border-gray-200 sm:px-6">
              <span className="block text-xs text-gray-500">Total:</span>
              <span className="mt-1 block font-bold text-gray-900">₹{data.priceSnapshot.total}</span>
            </div>

            <div className="sm:pl-6">
              <span className="block text-xs text-gray-500">Status:</span>
              <span className={`mt-1 block font-bold capitalize ${isPaymentPending ? 'text-amber-600' : 'text-gray-900'}`}>
                {data.status.replace(/_/g, ' ').toLowerCase()}
              </span>
            </div>
          </div>

          <div className="mt-6 text-xs text-gray-600 sm:text-sm">
            <span className="font-medium text-gray-800">Details: </span>
            <span className="font-medium text-[#bfa071]">{base?.name ?? "Service Package"}</span>
            <span className="mx-2 text-gray-300">|</span>
            <span className="text-gray-500 break-words">{address}</span>
          </div>

          <div className="mt-8 flex items-center gap-6 text-xs sm:text-sm">
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