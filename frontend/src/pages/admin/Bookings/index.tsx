import React, { useCallback, useEffect, useState } from "react";

import BookingDrawer from "@/components/admin/BookingDrawer";
import BookingTable from "@/components/admin/BookingTable";
import AssignPartnerDialog from "@/components/admin/AssignPartnerDialog";
import StatusOverrideDialog from "@/components/admin/StatusOverrideDialog";

import { adminBookingApi } from "@/services/adminBookingApi";

import type {
  AdminBooking,
  BookingFilters,
  BookingPartnerCandidate,
  BookingStatus,
  PaymentStatus,
} from "@/types/adminBooking";

import "./index.css";

const INITIAL_FILTERS: BookingFilters = {
  search: "",
  status: "",
  city: "",
  category: "",
  customer: "",
  partner: "",
  date: "",
  paymentStatus: "",
};

const BOOKING_STATUS_OPTIONS: Array<{
  value: BookingStatus;
  label: string;
}> = [
  {
    value: "created",
    label: "Pending",
  },
  {
    value: "searching_for_partner",
    label: "Searching for Partner",
  },
  {
    value: "assigned",
    label: "Assigned",
  },
  {
    value: "en_route",
    label: "En Route",
  },
  {
    value: "arrived",
    label: "Arrived",
  },
  {
    value: "in_progress",
    label: "In Progress",
  },
  {
    value: "completed",
    label: "Completed",
  },
  {
    value: "rated",
    label: "Rated",
  },
  {
    value: "cancelled_by_customer",
    label: "Cancelled by Customer",
  },
  {
    value: "cancelled_by_partner",
    label: "Cancelled by Partner",
  },
  {
    value: "no_show",
    label: "No Show",
  },
  {
    value: "disputed",
    label: "Disputed",
  },
];

const PAYMENT_STATUS_OPTIONS: PaymentStatus[] = [
  "Pending",
  "Paid",
  "Failed",
  "Refunded",
];

export const AdminBookingsPage: React.FC = () => {
  const [filters, setFilters] =
    useState<BookingFilters>(INITIAL_FILTERS);

  const [bookings, setBookings] =
    useState<AdminBooking[]>([]);

  const [loading, setLoading] =
    useState<boolean>(true);

  const [error, setError] =
    useState<string>("");

  const [isOffline, setIsOffline] =
    useState<boolean>(
      typeof navigator !== "undefined"
        ? !navigator.onLine
        : false,
    );

  const [selectedBooking, setSelectedBooking] =
    useState<AdminBooking | null>(null);

  const [drawerOpen, setDrawerOpen] =
    useState<boolean>(false);

  const [eligiblePartners, setEligiblePartners] =
    useState<BookingPartnerCandidate[]>([]);

  const [eligiblePartnersLoading, setEligiblePartnersLoading] =
    useState<boolean>(false);

  const [assignDialogOpen, setAssignDialogOpen] =
    useState<boolean>(false);

  const [statusOverrideDialogOpen, setStatusOverrideDialogOpen] =
    useState<boolean>(false);

  const loadBookings = useCallback(async () => {
    setLoading(true);
    setError("");

    if (typeof navigator !== "undefined") {
      setIsOffline(!navigator.onLine);
    }

    try {
      const data =
        await adminBookingApi.getBookings(filters);

      if (!Array.isArray(data)) {
        throw new Error(
          "Invalid bookings response received from the server.",
        );
      }

      setBookings(data);

      setSelectedBooking((current) => {
        if (!current) {
          return null;
        }

        return (
          data.find(
            (booking) =>
              booking.id === current.id,
          ) ?? null
        );
      });
    } catch (err) {
      const message =
        typeof err === "object" &&
        err !== null &&
        "message" in err &&
        typeof err.message === "string"
          ? err.message
          : "Unable to load bookings. Please try again.";

      setError(message);
      setBookings([]);
      setSelectedBooking(null);
    } finally {
      setLoading(false);
    }
  }, [filters]);

  useEffect(() => {
    void loadBookings();
  }, [loadBookings]);

  useEffect(() => {
    const handleOnline = () => {
      setIsOffline(false);
    };

    const handleOffline = () => {
      setIsOffline(true);
    };

    window.addEventListener(
      "online",
      handleOnline,
    );

    window.addEventListener(
      "offline",
      handleOffline,
    );

    return () => {
      window.removeEventListener(
        "online",
        handleOnline,
      );

      window.removeEventListener(
        "offline",
        handleOffline,
      );
    };
  }, []);

  const updateFilter = <
    K extends keyof BookingFilters
  >(
    key: K,
    value: BookingFilters[K],
  ) => {
    setFilters((current) => ({
      ...current,
      [key]: value,
    }));
  };

  const clearFilters = () => {
    setFilters(INITIAL_FILTERS);
  };

  const handleBookingSelect = (
    booking: AdminBooking,
  ) => {
    setSelectedBooking(booking);
    setDrawerOpen(true);
  };

  const handleCloseDrawer = () => {
    setDrawerOpen(false);
  };

  const handleOpenAssignDialog = async (
    booking: AdminBooking,
  ) => {
    setSelectedBooking(booking);
    setAssignDialogOpen(true);
    setEligiblePartners([]);
    setEligiblePartnersLoading(true);
    setError("");

    try {
      const partners =
        await adminBookingApi.getEligiblePartners(
          booking.id,
        );

      setEligiblePartners(partners);
    } catch (err) {
      const message =
        typeof err === "object" &&
        err !== null &&
        "message" in err &&
        typeof err.message === "string"
          ? err.message
          : "Unable to load eligible partners.";

      setError(message);
      setEligiblePartners([]);
    } finally {
      setEligiblePartnersLoading(false);
    }
  };

  const handleCloseAssignDialog = () => {
    setAssignDialogOpen(false);
    setEligiblePartners([]);
    setEligiblePartnersLoading(false);
  };

  const handleOpenStatusOverride = (
    booking: AdminBooking,
  ) => {
    setSelectedBooking(booking);
    setStatusOverrideDialogOpen(true);
  };

  const handleCloseStatusOverride = () => {
    setStatusOverrideDialogOpen(false);
  };

  const handleBookingUpdated = (
    updatedBooking: AdminBooking,
  ) => {
    setBookings((current) =>
      current.map((booking) =>
        booking.id === updatedBooking.id
          ? updatedBooking
          : booking,
      ),
    );

    setSelectedBooking(updatedBooking);
  };

  const handleAssignedPartner = (
    updatedBooking: AdminBooking,
  ) => {
    handleBookingUpdated(updatedBooking);

    setAssignDialogOpen(false);
    setEligiblePartners([]);
    setEligiblePartnersLoading(false);
  };

  const handleStatusOverridden = (
    updatedBooking: AdminBooking,
  ) => {
    handleBookingUpdated(updatedBooking);
    setStatusOverrideDialogOpen(false);
  };

  const handleCancelled = (
    updatedBooking: AdminBooking,
  ) => {
    handleBookingUpdated(updatedBooking);
  };

  return (
    <div className="admin-bookings">
      <div className="admin-bookings__header">
        <div>
          <h1 className="admin-bookings__title">
            Bookings & Operations
          </h1>

          <p className="admin-bookings__subtitle">
            Manage bookings, partners, statuses and payments.
          </p>
        </div>

        <button
          type="button"
          onClick={() => void loadBookings()}
          disabled={loading}
          className="booking-button booking-button--secondary"
        >
          {loading ? "Refreshing..." : "Refresh"}
        </button>
      </div>

      {isOffline && (
        <div
          role="alert"
          className="booking-alert booking-alert--offline"
        >
          You are offline. Booking data may not be up to date.
        </div>
      )}

      {error && (
        <div
          role="alert"
          className="booking-alert booking-alert--error"
        >
          <span>{error}</span>

          <button
            type="button"
            onClick={() => void loadBookings()}
            className="booking-button booking-button--danger"
          >
            Try again
          </button>
        </div>
      )}

      <section
        aria-label="Booking filters"
        className="booking-card booking-filters"
      >
        <div className="booking-card__header">
          <h2 className="booking-card__title">
            Filters
          </h2>

          <button
            type="button"
            onClick={clearFilters}
            className="booking-link-button"
          >
            Clear filters
          </button>
        </div>

        <div className="booking-filters__grid">
          <div className="booking-field">
            <label htmlFor="booking-search">
              Search
            </label>

            <input
              id="booking-search"
              type="search"
              value={filters.search}
              onChange={(event) =>
                updateFilter(
                  "search",
                  event.target.value,
                )
              }
              placeholder="Booking ID, name..."
            />
          </div>

          <div className="booking-field">
            <label htmlFor="booking-status">
              Status
            </label>

            <select
              id="booking-status"
              value={filters.status}
              onChange={(event) =>
                updateFilter(
                  "status",
                  event.target.value as BookingStatus | "",
                )
              }
            >
              <option value="">
                All statuses
              </option>

              {BOOKING_STATUS_OPTIONS.map(
                (status) => (
                  <option
                    key={status.value}
                    value={status.value}
                  >
                    {status.label}
                  </option>
                ),
              )}
            </select>
          </div>

          <div className="booking-field">
            <label htmlFor="booking-city">
              City
            </label>

            <input
              id="booking-city"
              type="text"
              value={filters.city}
              onChange={(event) =>
                updateFilter(
                  "city",
                  event.target.value,
                )
              }
              placeholder="City"
            />
          </div>

          <div className="booking-field">
            <label htmlFor="booking-category">
              Category
            </label>

            <input
              id="booking-category"
              type="text"
              value={filters.category}
              onChange={(event) =>
                updateFilter(
                  "category",
                  event.target.value,
                )
              }
              placeholder="Service category"
            />
          </div>

          <div className="booking-field">
            <label htmlFor="booking-customer">
              Customer
            </label>

            <input
              id="booking-customer"
              type="text"
              value={filters.customer}
              onChange={(event) =>
                updateFilter(
                  "customer",
                  event.target.value,
                )
              }
              placeholder="Customer name"
            />
          </div>

          <div className="booking-field">
            <label htmlFor="booking-partner">
              Partner
            </label>

            <input
              id="booking-partner"
              type="text"
              value={filters.partner}
              onChange={(event) =>
                updateFilter(
                  "partner",
                  event.target.value,
                )
              }
              placeholder="Partner name"
            />
          </div>

          <div className="booking-field">
            <label htmlFor="booking-date">
              Date
            </label>

            <input
              id="booking-date"
              type="date"
              value={filters.date}
              onChange={(event) =>
                updateFilter(
                  "date",
                  event.target.value,
                )
              }
            />
          </div>

          <div className="booking-field">
            <label htmlFor="booking-payment">
              Payment status
            </label>

            <select
              id="booking-payment"
              value={filters.paymentStatus}
              onChange={(event) =>
                updateFilter(
                  "paymentStatus",
                  event.target.value as
                    | PaymentStatus
                    | "",
                )
              }
            >
              <option value="">
                All payment statuses
              </option>

              {PAYMENT_STATUS_OPTIONS.map(
                (status) => (
                  <option
                    key={status}
                    value={status}
                  >
                    {status}
                  </option>
                ),
              )}
            </select>
          </div>
        </div>
      </section>

      <section
        aria-label="Bookings"
        className="booking-card booking-table-card"
      >
        <div className="booking-card__header">
          <div>
            <h2 className="booking-card__title">
              Bookings
            </h2>

            {!loading && (
              <p className="booking-card__count">
                {bookings.length} booking
                {bookings.length === 1
                  ? ""
                  : "s"}
              </p>
            )}
          </div>
        </div>

        {loading ? (
          <div
            className="booking-state"
            role="status"
            aria-live="polite"
          >
            <p>Loading bookings...</p>
          </div>
        ) : error ? (
          <div className="booking-state">
            <h3>
              Unable to load bookings
            </h3>

            <p>
              Check your connection and try again.
            </p>
          </div>
        ) : (
          <BookingTable
            bookings={bookings}
            onBookingSelect={handleBookingSelect}
          />
        )}
      </section>

      <BookingDrawer
        booking={selectedBooking}
        open={drawerOpen}
        onClose={handleCloseDrawer}
        onAssignPartner={handleOpenAssignDialog}
        onStatusOverride={
          handleOpenStatusOverride
        }
        onCancelBooking={handleCancelled}
      />

      {selectedBooking && (
        <>
          <AssignPartnerDialog
            booking={selectedBooking}
            open={assignDialogOpen}
            partners={eligiblePartners}
            loading={eligiblePartnersLoading}
            onClose={handleCloseAssignDialog}
            onAssigned={handleAssignedPartner}
          />

          <StatusOverrideDialog
            booking={selectedBooking}
            open={statusOverrideDialogOpen}
            onClose={handleCloseStatusOverride}
            onUpdated={handleStatusOverridden}
          />
        </>
      )}
    </div>
  );
};

export default AdminBookingsPage;