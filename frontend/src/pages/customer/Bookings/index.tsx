import { useState, useMemo } from "react";
import { useQuery } from "@tanstack/react-query";
import { Link } from "react-router-dom";
import { bookingApi, type NormalizedApiError } from "@/services/bookingApi";
import { EmptyState, ErrorState, LoadingState } from "@/components/customer";
import { FOCUS_RING } from "@/components/customer/focusRing";
import type { BookingView } from "@/types/booking";

type TabType = "upcoming" | "live" | "completed" | "cancelled";

const TABS: { id: TabType; label: string }[] = [
  { id: "upcoming", label: "Upcoming" },
  { id: "live", label: "Live" },
  { id: "completed", label: "Completed" },
  { id: "cancelled", label: "Cancelled" },
];

export default function MyBookingsPage() {
  const [activeTab, setActiveTab] = useState<TabType>("live");

  // Fetch real customer bookings from MongoDB via API
  const {
    data: bookings = [],
    isLoading,
    isError,
    error,
    refetch,
  } = useQuery<BookingView[], NormalizedApiError>({
    queryKey: ["customer-bookings"],
    queryFn: () => bookingApi.getBookings(),
  });

  // Filter real MongoDB bookings by tab status
  const filteredBookings = useMemo(() => {
    return bookings.filter((b: any) => {
      const status = (b.status || "").toUpperCase();

      switch (activeTab) {
        case "live":
          // Live / in-progress statuses
          return (
            status === "IN_PROGRESS" ||
            status === "IN-PROGRESS" ||
            status === "STARTED" ||
            status === "EN_ROUTE" ||
            status === "ARRIVED"
          );
        case "upcoming":
          // Confirmed, pending, or scheduled
          return (
            status === "CONFIRMED" ||
            status === "PENDING" ||
            status === "PENDING_PAYMENT" ||
            status === "CREATED" ||
            status === "SEARCHING_FOR_PARTNER" ||
            status === "ASSIGNED"
          );
        case "completed":
          return status === "COMPLETED" || status === "RATED";
        case "cancelled":
          return status.startsWith("CANCEL");
        default:
          return false;
      }
    });
  }, [bookings, activeTab]);

  // Helper to format service name from snapshot or fallback
  const getServiceName = (b: any): string => {
    const baseLine = b.priceSnapshot?.lines?.find((l: any) => l.kind === "BASE");
    return baseLine?.name || b.serviceName || "Home Service";
  };

  // Helper to display short booking reference code (e.g. BK-10231)
  const getBookingCode = (b: any): string => {
    if (b.bookingNumber) return b.bookingNumber;
    const rawId = String(b._id || b.id || "");
    return `BK-${rawId.slice(-5).toUpperCase()}`;
  };

  // Helper to display human-readable date & time
  const formatSlotTime = (dateStr: string, slotStr: string): string => {
    if (!dateStr) return slotStr || "Scheduled";
    const today = new Date().toISOString().slice(0, 10);
    const prefix = dateStr === today ? "Today" : dateStr;
    return `${prefix}, ${slotStr}`;
  };

  // Badge appearance by status
  const getStatusBadge = (status: string) => {
    const s = (status || "").toUpperCase();
    if (s.includes("PROGRESS") || s === "STARTED" || s === "EN_ROUTE" || s === "ARRIVED") {
      return (
        <span className="rounded-full bg-orange-100 px-3 py-0.5 text-xs font-semibold text-orange-700">
          In Progress
        </span>
      );
    }
    if (s === "CONFIRMED" || s === "CREATED" || s === "SEARCHING_FOR_PARTNER" || s === "ASSIGNED") {
      return (
        <span className="rounded-full bg-blue-100 px-3 py-0.5 text-xs font-semibold text-blue-700">
          Confirmed
        </span>
      );
    }
    if (s === "COMPLETED" || s === "RATED") {
      return (
        <span className="rounded-full bg-green-100 px-3 py-0.5 text-xs font-semibold text-green-700">
          Completed
        </span>
      );
    }
    if (s.includes("CANCEL")) {
      return (
        <span className="rounded-full bg-red-100 px-3 py-0.5 text-xs font-semibold text-red-700">
          Cancelled
        </span>
      );
    }
    return (
      <span className="rounded-full bg-gray-100 px-3 py-0.5 text-xs font-semibold text-gray-700">
        {status}
      </span>
    );
  };

  return (
    <div className="mx-auto max-w-5xl px-4 py-8 sm:px-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold tracking-tight text-gray-900">Bookings</h1>
        <p className="mt-1 text-sm text-gray-500">
          Track, manage, and revisit your service bookings.
        </p>
      </div>

      {/* Filter Tabs */}
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

      {/* Content Section */}
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
              const totalAmount = booking.priceSnapshot?.total ?? 0;
              const slotDisplay = formatSlotTime(booking.date, booking.slot);
              const partner = booking.partnerId || booking.partner;

              return (
                <Link
                  key={booking._id || booking.id}
                  to={`/customer/bookings/${booking._id || booking.id}`}
                  className="block rounded-xl border border-gray-200 bg-white p-5 shadow-sm transition hover:border-indigo-300 hover:shadow-md"
                >
                  <div className="flex items-start justify-between">
                    <div>
                      <h3 className="font-semibold text-gray-900">{serviceName}</h3>
                      <p className="mt-0.5 text-xs text-gray-500">
                        {booking.categoryName || "Home Service"} · {bookingCode}
                      </p>
                    </div>
                    <div>{getStatusBadge(booking.status)}</div>
                  </div>

                  <div className="mt-4 flex items-center justify-between text-sm">
                    <span className="text-gray-600">{slotDisplay}</span>
                    <span className="font-semibold text-gray-900">₹{totalAmount}</span>
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