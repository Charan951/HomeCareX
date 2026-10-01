import { useState, useMemo } from "react";
import { useQuery } from "@tanstack/react-query";
import { Link } from "react-router-dom";
import { bookingApi, type NormalizedApiError } from "@/services/bookingApi";
import { EmptyState, ErrorState, LoadingState } from "@/components/customer";
import { FOCUS_RING } from "@/components/customer/focusRing";
import { customerPath } from "@/routes/customerPath";
import type { BookingView } from "@/types/booking";

type TabType = "upcoming" | "live" | "completed" | "cancelled";

const TABS: { id: TabType; label: string }[] = [
  { id: "upcoming", label: "Upcoming" },
  { id: "live", label: "Live" },
  { id: "completed", label: "Completed" },
  { id: "cancelled", label: "Cancelled" },
];

export default function MyBookingsPage() {
  const [activeTab, setActiveTab] = useState<TabType>("upcoming");

  // Fetch real customer bookings from MongoDB via API
  const {
    data: rawBookings = [],
    isLoading,
    isError,
    error,
    refetch,
  } = useQuery<any, NormalizedApiError>({
    queryKey: ["customer-bookings"],
    queryFn: () => bookingApi.getBookings(),
  });

  // Safely extract booking array regardless of backend payload wrapper ({ success, data } vs direct array)
  const bookings: any[] = useMemo(() => {
    if (Array.isArray(rawBookings)) return rawBookings;
    if (Array.isArray((rawBookings as any)?.data)) return (rawBookings as any).data;
    if (Array.isArray((rawBookings as any)?.bookings)) return (rawBookings as any).bookings;
    return [];
  }, [rawBookings]);

  // Helper to extract normalized payment status
  const resolvePaymentStatus = (booking: any): "PAID" | "FAILED" | "UNPAID" => {
    const rawStatus = String(
      booking.paymentStatus ||
      booking.payment_status ||
      booking.paymentDetails?.status ||
      booking.payment?.status ||
      ""
    ).trim().toUpperCase();

    const bookingStatus = String(booking.status || "").trim().toUpperCase();
    const hasPaymentId = Boolean(
      booking.paymentDetails?.paymentId ||
      booking.paymentId ||
      booking.razorpayPaymentId
    );

    if (rawStatus === "FAILED" || bookingStatus === "PAYMENT_FAILED" || rawStatus === "CANCELLED") {
      return "FAILED";
    }

    if (rawStatus === "PAID" || booking.isPaid === true || hasPaymentId) {
      return "PAID";
    }

    // If backend marked booking as CONFIRMED and there is no active failure, mark as PAID
    if (bookingStatus === "CONFIRMED" && rawStatus !== "UNPAID") {
      return "PAID";
    }

    return "UNPAID";
  };

  // Filter bookings strictly by tab status
  const filteredBookings = useMemo(() => {
    return bookings.filter((b: any) => {
      const status = String(b.status || "").trim().toUpperCase();
      const paymentStatus = resolvePaymentStatus(b);

      const isFailedOrCancelled =
        status === "CANCELLED" ||
        status === "CANCELED" ||
        status === "PAYMENT_FAILED" ||
        paymentStatus === "FAILED";

      switch (activeTab) {
        case "live":
          return (
            (status === "IN_PROGRESS" ||
              status === "IN-PROGRESS" ||
              status === "STARTED" ||
              status === "EN_ROUTE") &&
            !isFailedOrCancelled
          );
        case "upcoming":
          return (
            (status === "CONFIRMED" || status === "PENDING" || status === "ASSIGNED") &&
            !isFailedOrCancelled
          );
        case "completed":
          return status === "COMPLETED" && !isFailedOrCancelled;
        case "cancelled":
          return isFailedOrCancelled;
        default:
          return false;
      }
    });
  }, [bookings, activeTab]);

  const getServiceName = (b: any): string => {
    const baseLine = b.priceSnapshot?.lines?.find((l: any) => l.kind === "BASE");
    return baseLine?.name || b.serviceName || "Home Service";
  };

  const getBookingCode = (b: any): string => {
    if (b.bookingNumber) return b.bookingNumber;
    const rawId = String(b._id || b.id || "");
    return `BK-${rawId.slice(-5).toUpperCase()}`;
  };

  const formatSlotTime = (dateStr: string, slotStr: string): string => {
    if (!dateStr) return slotStr || "Scheduled";
    const today = new Date().toISOString().slice(0, 10);
    const prefix = dateStr === today ? "Today" : dateStr;
    return `${prefix}, ${slotStr}`;
  };

  const getStatusBadge = (booking: any) => {
    const status = String(booking.status || "").trim().toUpperCase();
    const paymentStatus = resolvePaymentStatus(booking);

    if (
      status === "CANCELLED" ||
      status === "CANCELED" ||
      status === "PAYMENT_FAILED" ||
      paymentStatus === "FAILED"
    ) {
      return (
        <span className="rounded-full bg-red-100 px-3 py-0.5 text-xs font-semibold text-red-700">
          {paymentStatus === "FAILED" || status === "PAYMENT_FAILED" ? "Payment Failed" : "Cancelled"}
        </span>
      );
    }
    if (status.includes("PROGRESS") || status === "STARTED" || status === "EN_ROUTE") {
      return (
        <span className="rounded-full bg-orange-100 px-3 py-0.5 text-xs font-semibold text-orange-700">
          In Progress
        </span>
      );
    }
    if (status === "CONFIRMED" || status === "ASSIGNED") {
      return (
        <span className="rounded-full bg-blue-100 px-3 py-0.5 text-xs font-semibold text-blue-700">
          Confirmed
        </span>
      );
    }
    if (status === "COMPLETED") {
      return (
        <span className="rounded-full bg-green-100 px-3 py-0.5 text-xs font-semibold text-green-700">
          Completed
        </span>
      );
    }
    return (
      <span className="rounded-full bg-gray-100 px-3 py-0.5 text-xs font-semibold text-gray-700">
        {status}
      </span>
    );
  };

  const getPaymentBadge = (booking: any) => {
    const pStatus = resolvePaymentStatus(booking);

    if (pStatus === "FAILED") {
      return (
        <span className="inline-flex items-center gap-1 text-[11px] font-semibold text-rose-600">
          <span className="h-1.5 w-1.5 rounded-full bg-rose-500"></span>
          Failed
        </span>
      );
    }

    if (pStatus === "PAID") {
      return (
        <span className="inline-flex items-center gap-1 text-[11px] font-semibold text-emerald-600">
          <span className="h-1.5 w-1.5 rounded-full bg-emerald-500"></span>
          Paid
        </span>
      );
    }

    return (
      <span className="inline-flex items-center gap-1 text-[11px] font-semibold text-amber-600">
        <span className="h-1.5 w-1.5 rounded-full bg-amber-500"></span>
        Unpaid
      </span>
    );
  };

  return (
    <div className="mx-auto max-w-5xl px-4 py-8 sm:px-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight text-gray-900">Bookings</h1>
        <p className="mt-1 text-sm text-gray-500">
          Track, manage, and revisit your service bookings.
        </p>
      </div>

      <div className="mt-6 border-b border-gray-200">
        <nav className="-mb-px flex space-x-8" aria-label="Tabs">
          {TABS.map((tab) => {
            const isActive = activeTab === tab.id;
            return (
              <button
                key={tab.id}
                type="button"
                onClick={() => setActiveTab(tab.id)}
                className={`whitespace-nowrap border-b-2 pb-3 text-sm font-medium transition-colors ${
                  isActive
                    ? "border-indigo-600 text-indigo-600"
                    : "border-transparent text-gray-500 hover:border-gray-300 hover:text-gray-700"
                } ${FOCUS_RING}`}
              >
                {tab.label}
              </button>
            );
          })}
        </nav>
      </div>

      <div className="mt-6">
        {isLoading && <LoadingState label="Loading your bookings from database…" />}

        {isError && (
          <ErrorState
            title="Couldn't load bookings"
            message={error?.message || "Failed to fetch bookings from server"}
            onRetry={() => void refetch()}
          />
        )}

        {!isLoading && !isError && filteredBookings.length === 0 && (
          <EmptyState
            title={`No ${activeTab} bookings`}
            description={`You don't have any ${activeTab} service bookings right now.`}
          />
        )}

        {!isLoading && !isError && filteredBookings.length > 0 && (
          <div className="grid gap-4 sm:grid-cols-1 md:grid-cols-2">
            {filteredBookings.map((booking: any) => {
              const serviceName = getServiceName(booking);
              const bookingCode = getBookingCode(booking);
              const totalAmount = booking.priceSnapshot?.total ?? booking.expectedTotal ?? 0;
              const slotDisplay = formatSlotTime(booking.date, booking.slot);
              const partner = booking.partnerId || booking.partner;
              const bookingId = booking._id || booking.id;

              return (
                <Link
                  key={bookingId}
                  to={customerPath(`/bookings/${bookingId}`)}
                  className="block rounded-xl border border-gray-200 bg-white p-5 shadow-sm transition hover:border-indigo-300 hover:shadow-md"
                >
                  <div className="flex items-start justify-between">
                    <div>
                      <h3 className="font-semibold text-gray-900">{serviceName}</h3>
                      <p className="mt-0.5 text-xs text-gray-500">
                        {booking.categoryName || "Home Service"} · {bookingCode}
                      </p>
                    </div>
                    <div>{getStatusBadge(booking)}</div>
                  </div>

                  <div className="mt-4 flex items-center justify-between text-sm">
                    <span className="text-gray-600">{slotDisplay}</span>
                    <div className="flex items-center gap-2">
                      {getPaymentBadge(booking)}
                      <span className="font-semibold text-gray-900">₹{totalAmount}</span>
                    </div>
                  </div>

                  {partner && (
                    <div className="mt-3 border-t border-gray-100 pt-3 text-xs text-gray-500">
                      Partner:{" "}
                      <span className="font-medium text-gray-800">
                        {partner.name || "Assigned Partner"}
                      </span>
                      {partner.rating && (
                        <span className="ml-1 text-amber-500">★ {partner.rating}</span>
                      )}
                    </div>
                  )}
                </Link>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}