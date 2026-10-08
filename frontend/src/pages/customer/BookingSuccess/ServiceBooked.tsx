import { useEffect, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { useLocation, useNavigate, useParams } from "react-router-dom";
import { ErrorState, LoadingState } from "@/components/customer";
import { useBookingDraftStore } from "@/features/booking";
import { customerPath } from "@/routes/customerPath";
import { bookingApi, type NormalizedApiError } from "@/services/bookingApi";
import { BOOKING_STATUS, PAYMENT_STATUS, type BookingView } from "@/types/booking";
import { formatSlotLabel } from "../Book/components/SlotPicker";
import { formatINR } from "../Book/formatMoney";
import type { BookedPageState } from "../Book/settledBooking";

/** "2026-10-12" -> "12 October 2026" (date-only string, so no timezone shift). */
function formatDate(iso: string): string {
  const [y, m, d] = iso.split("-").map(Number);
  return new Date(y, m - 1, d).toLocaleDateString("en-GB", { day: "numeric", month: "long", year: "numeric" });
}

const STATUS_LABEL: Record<string, string> = {
  [BOOKING_STATUS.CONFIRMED]: "Confirmed",
  [BOOKING_STATUS.PENDING_PAYMENT]: "Awaiting payment",
};
const statusLabel = (s: string) => STATUS_LABEL[s] ?? s.replace(/_/g, " ").replace(/^./, (c) => c.toUpperCase());

/** Confirmation for a booking that is confirmed without an online payment (cash on service). */
export default function ServiceBooked() {
  const navigate = useNavigate();
  const location = useLocation();
  const { id } = useParams<{ id: string }>();
  const [isVisible, setIsVisible] = useState(false);
  const clearDraft = useBookingDraftStore((s) => s.clearDraft);
  const onlineNotCharged = (location.state as BookedPageState | null)?.onlineNotCharged === true;

  const { data, isLoading, error, refetch } = useQuery<BookingView, NormalizedApiError>({
    queryKey: ["booking", id],
    queryFn: () => bookingApi.getBooking(id as string),
    enabled: Boolean(id),
  });

  useEffect(() => {
    const timer = setTimeout(() => setIsVisible(true), 100);
    return () => clearTimeout(timer);
  }, []);

  // The booking exists now, so the saved draft (and its Idempotency-Key) must not be reused for the next one.
  useEffect(() => {
    if (data) clearDraft();
  }, [data, clearDraft]);

  if (isLoading) return <LoadingState label="Loading your booking…" />;
  if (!data) {
    return <ErrorState title="Couldn't load your booking" message={error?.message} onRetry={() => void refetch()} />;
  }

  const paid = data.paymentStatus === PAYMENT_STATUS.PAID;
  const total = data.priceSnapshot.total;
  const serviceName = data.priceSnapshot.lines.find((l) => l.kind === "BASE")?.name ?? "Home service";
  const a = data.addressSnapshot;
  const address = [a.line1, a.city].filter(Boolean).join(", ");
  const bookingCode = `BK-${data._id.slice(-5).toUpperCase()}`;

  return (
    <div className="flex min-h-[calc(100vh-100px)] w-full items-center justify-center p-4 font-sans bg-transparent">
      <div
        className={`max-w-md w-full bg-white rounded-2xl shadow-[0_4px_20px_-4px_rgba(0,0,0,0.1)] border border-gray-100 p-6 transform transition-all duration-700 ease-out ${
          isVisible ? "opacity-100 translate-y-0" : "opacity-0 translate-y-8"
        }`}
      >
        <div className="text-center mb-5">
          <div className="mx-auto w-12 h-12 bg-green-100 rounded-full flex items-center justify-center mb-3">
            <svg className="w-6 h-6 text-green-600" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={3}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
            </svg>
          </div>

          <h1 className="text-xl sm:text-2xl font-extrabold text-gray-900 mb-1">Service Booked Successfully!</h1>
          <p className="text-sm text-gray-500">Your service has been successfully placed.</p>
        </div>

        {onlineNotCharged && !paid && (
          <div role="status" className="mb-4 rounded-xl border border-amber-200 bg-amber-50 p-3 text-sm text-amber-800">
            <p className="font-semibold">You have not been charged.</p>
            <p className="mt-0.5">
              Online payment isn&apos;t available right now, so your booking was saved without a payment. Please pay{" "}
              {formatINR(total)} to the professional after the visit.
            </p>
          </div>
        )}

        {/* Booking Summary Card */}
        <div className="bg-gray-50 border border-gray-100 rounded-xl p-4 mb-5">
          <h2 className="text-base font-bold text-gray-900 border-b border-gray-200 pb-2 mb-3">{serviceName}</h2>

          <div className="space-y-2.5 text-sm">
            <div className="flex justify-between">
              <span className="text-gray-500 font-medium">Booking ID:</span>
              <span className="font-bold text-gray-900">{bookingCode}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-500 font-medium">Date:</span>
              <span className="font-bold text-gray-900">{formatDate(data.date)}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-500 font-medium">Time:</span>
              <span className="font-bold text-gray-900">{formatSlotLabel(data.slot)}</span>
            </div>
            <div className="flex justify-between gap-4">
              <span className="text-gray-500 font-medium">Address:</span>
              <span className="font-bold text-gray-900 text-right">{address}</span>
            </div>
            <div className="flex justify-between items-center py-2 border-y border-gray-200 my-1">
              <span className="text-gray-500 font-medium">Payment:</span>
              <span className={`font-bold ${paid ? "text-green-600" : "text-amber-600"}`}>
                {paid ? "Paid online" : "Pay on service"}
              </span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-500 font-medium">Amount:</span>
              <span className="font-bold text-gray-900">{formatINR(total)}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-500 font-medium">Status:</span>
              <span className="font-bold text-green-600">{statusLabel(data.status)}</span>
            </div>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="flex gap-3">
          <button
            onClick={() => navigate(customerPath("/bookings"))}
            className="flex-1 bg-[#152822] text-white font-bold py-3 px-2 rounded-xl hover:bg-[#1a342b] transition-colors active:scale-[0.98] shadow-sm uppercase tracking-wide text-xs sm:text-sm"
          >
            View Booking
          </button>
          <button
            onClick={() => navigate(customerPath("/"))}
            className="flex-1 bg-white border border-gray-300 text-gray-700 font-bold py-3 px-2 rounded-xl hover:bg-gray-50 transition-colors active:scale-[0.98] shadow-sm uppercase tracking-wide text-xs sm:text-sm"
          >
            Go Home
          </button>
        </div>
      </div>
    </div>
  );
}
