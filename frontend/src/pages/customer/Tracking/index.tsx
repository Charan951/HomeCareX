import { useMemo } from "react";
import { useQuery } from "@tanstack/react-query";
import { Link } from "react-router-dom";
import { bookingApi, type NormalizedApiError } from "@/services/bookingApi";
import { EmptyState, ErrorState, LoadingState } from "@/components/customer";
import { FOCUS_RING } from "@/components/customer/focusRing";
import type { BookingView } from "@/types/booking";

// Timeline steps corresponding to booking lifecycle
const TIMELINE_STEPS = [
  { key: "CONFIRMED", label: "Confirmed" },
  { key: "SEARCHING_FOR_PARTNER", label: "Searching for Partner" },
  { key: "ASSIGNED", label: "Partner Assigned" },
  { key: "EN_ROUTE", label: "En Route" },
  { key: "ARRIVED", label: "Arrived" },
  { key: "IN_PROGRESS", label: "In Progress" },
  { key: "COMPLETED", label: "Completed" },
];

export default function TrackingPage() {
  // Fetch real customer bookings from MongoDB; poll every 15s for live status updates
  const {
    data: bookings = [],
    isLoading,
    isError,
    error,
    refetch,
  } = useQuery<BookingView[], NormalizedApiError>({
    queryKey: ["customer-bookings"],
    queryFn: () => bookingApi.getBookings(),
    refetchInterval: 15000,
  });

  // Pick the latest confirmed / active booking from MongoDB
  const activeBooking = useMemo(() => {
    return bookings.find((b: any) => {
      const status = (b.status || "").toUpperCase();
      return (
        status === "CONFIRMED" ||
        status === "CREATED" ||
        status === "SEARCHING_FOR_PARTNER" ||
        status === "ASSIGNED" ||
        status === "EN_ROUTE" ||
        status === "ARRIVED" ||
        status === "IN_PROGRESS" ||
        status === "STARTED" ||
        status === "PENDING"
      );
    });
  }, [bookings]);

  if (isLoading) {
    return (
      <div className="mx-auto max-w-5xl px-4 py-8">
        <LoadingState label="Loading your active service status…" />
      </div>
    );
  }

  if (isError) {
    return (
      <div className="mx-auto max-w-5xl px-4 py-8">
        <ErrorState
          title="Could not load active booking"
          message={error?.message || "Failed to fetch status from server"}
          onRetry={() => void refetch()}
        />
      </div>
    );
  }

  // Display empty state if the customer has no active bookings in MongoDB
  if (!activeBooking) {
    return (
      <div className="mx-auto max-w-5xl px-4 py-8">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-gray-900">Tracking</h1>
          <p className="mt-1 text-sm text-gray-500">Live status for your ongoing booking.</p>
        </div>
        <div className="mt-8">
          <EmptyState
            title="No Active Booking"
            description="You do not have any confirmed or ongoing service bookings at the moment."
          />
          <div className="mt-6 flex justify-center">
            <Link
              to="/customer/book"
              className={`rounded-lg bg-indigo-600 px-6 py-2.5 text-sm font-medium text-white hover:bg-indigo-700 ${FOCUS_RING}`}
            >
              Book a Service
            </Link>
          </div>
        </div>
      </div>
    );
  }

  const b = activeBooking as any;

  // Extract service name from price snapshot or direct field
  const serviceName =
    b.priceSnapshot?.lines?.find((l: any) => l.kind === "BASE")?.name ||
    b.serviceName ||
    "Home Care Service";

  // Booking reference (e.g., BK-10231)
  const bookingCode =
    b.bookingNumber || `BK-${String(b._id || b.id || "").slice(-5).toUpperCase()}`;

  const currentStatus = (b.status || "").toUpperCase();
  const getStatusIndex = (status: string): number => {
    switch (status) {
      case "CONFIRMED":
      case "CREATED":
      case "PENDING":
        return 0;
      case "SEARCHING_FOR_PARTNER":
        return 1;
      case "ASSIGNED":
        return 2;
      case "EN_ROUTE":
        return 3;
      case "ARRIVED":
        return 4;
      case "IN_PROGRESS":
      case "STARTED":
        return 5;
      case "COMPLETED":
        return 6;
      default:
        return 0;
    }
  };
  const activeStepIdx = getStatusIndex(currentStatus);

  const formatTime = (isoString?: string | Date) => {
    if (!isoString) return "";
    const d = new Date(isoString);
    if (isNaN(d.getTime())) return "";
    return d.toLocaleTimeString([], { hour: "numeric", minute: "2-digit" });
  };

  const getStepTime = (stepKey: string): string => {
    const history = b.statusHistory ?? b.history;
    if (!Array.isArray(history)) {
      if (stepKey === "CONFIRMED") return formatTime(b.createdAt);
      return "";
    }
    const entry = history.find(
      (h: any) => (h.to || "").toUpperCase() === stepKey || (h.status || "").toUpperCase() === stepKey
    );
    if (entry && entry.at) return formatTime(entry.at);
    if (stepKey === "CONFIRMED") return formatTime(b.createdAt);
    return "";
  };

  const partner = b.partnerId || b.partner;

  return (
    <div className="mx-auto max-w-5xl px-4 py-8 sm:px-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold tracking-tight text-gray-900">Tracking</h1>
        <p className="mt-1 text-sm text-gray-500">Live status for your ongoing booking.</p>
      </div>

      {/* 1. Map & Partner Card */}
      <div className="mt-6 overflow-hidden rounded-xl border border-gray-200 bg-white shadow-sm">
        <div className="flex h-64 w-full items-center justify-center bg-gray-50 text-sm font-medium text-gray-400">
          <div className="flex items-center gap-2">
            <span className="text-lg">🗺️</span>
            <span>Live map — partner location &amp; ETA</span>
          </div>
        </div>

        <div className="flex flex-col justify-between gap-4 border-t border-gray-100 p-4 sm:flex-row sm:items-center">
          <div>
            <h4 className="font-semibold text-gray-900">
              {partner ? partner.name : "Assigning Partner..."}
            </h4>
            <p className="text-xs text-gray-500">
              {partner
                ? currentStatus === "IN_PROGRESS"
                  ? "Service currently in progress"
                  : "Arriving for scheduled slot"
                : "Looking for an available specialist near you"}
            </p>
          </div>

          <div className="flex items-center gap-3">
            <button
              type="button"
              disabled={!partner}
              onClick={() => alert(`Chat feature with ${partner?.name || "partner"} coming soon.`)}
              className="rounded-lg border border-gray-200 px-4 py-2 text-xs font-semibold text-indigo-600 hover:bg-gray-50 disabled:cursor-not-allowed disabled:opacity-50"
            >
              Chat
            </button>
            <button
              type="button"
              disabled={!partner?.phone}
              onClick={() => {
                if (partner?.phone) window.open(`tel:${partner.phone}`);
              }}
              className="rounded-lg bg-indigo-600 px-4 py-2 text-xs font-semibold text-white hover:bg-indigo-700 disabled:cursor-not-allowed disabled:opacity-50"
            >
              Call
            </button>
          </div>
        </div>
      </div>

      {/* 2. Real Service Details & Timeline Card */}
      <div className="mt-6 rounded-xl border border-gray-200 bg-white p-6 shadow-sm">
        <div className="border-b border-gray-100 pb-4">
          <h2 className="text-base font-semibold text-gray-900">
            {serviceName} · {bookingCode}
          </h2>
          <div className="mt-1 flex flex-wrap gap-4 text-xs text-gray-500">
            <span>📅 {b.date} ({b.slot})</span>
            <span>📍 {b.addressSnapshot?.city || b.addressSnapshot?.addressLine1 || "Customer Address"}</span>
            <span>💰 ₹{b.priceSnapshot?.total ?? 0}</span>
          </div>
        </div>

        <div className="mt-6 flow-root">
          <ul className="-mb-8">
            {TIMELINE_STEPS.map((step, idx) => {
              const isPast = idx < activeStepIdx;
              const isCurrent = idx === activeStepIdx;
              const isReached = isPast || isCurrent;
              const timeDisplay = getStepTime(step.key);

              return (
                <li key={step.key}>
                  <div className="relative pb-8">
                    {idx !== TIMELINE_STEPS.length - 1 && (
                      <span
                        className={`absolute left-2.5 top-3 -ml-px h-full w-0.5 ${
                          isPast ? "bg-indigo-600" : "bg-gray-200"
                        }`}
                        aria-hidden="true"
                      />
                    )}

                    <div className="relative flex items-center justify-between">
                      <div className="flex items-center gap-4">
                        <span
                          className={`flex h-5 w-5 items-center justify-center rounded-full ${
                            isReached
                              ? "bg-indigo-600 ring-4 ring-indigo-50"
                              : "border-2 border-gray-300 bg-white"
                          }`}
                        >
                          {isPast && (
                            <svg className="h-3 w-3 text-white" viewBox="0 0 20 20" fill="currentColor">
                              <path
                                fillRule="evenodd"
                                d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z"
                                clipRule="evenodd"
                              />
                            </svg>
                          )}
                        </span>

                        <span
                          className={`text-sm ${
                            isCurrent
                              ? "font-semibold text-gray-900"
                              : isPast
                              ? "font-medium text-gray-700"
                              : "text-gray-400"
                          }`}
                        >
                          {step.label}
                        </span>
                      </div>

                      {timeDisplay && isReached && (
                        <span className="text-xs font-normal text-gray-400">{timeDisplay}</span>
                      )}
                    </div>
                  </div>
                </li>
              );
            })}
          </ul>
        </div>
      </div>
    </div>
  );
}