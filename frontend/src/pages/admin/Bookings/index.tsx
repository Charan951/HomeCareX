import { useEffect, useMemo, useState } from "react";
import {
  BookingDrawer,
} from "@/components/admin/BookingDrawer";
import {
  BookingTable,
} from "@/components/admin/BookingTable";
import {
  AssignPartnerDialog,
} from "@/components/admin/AssignPartnerDialog";
import {
  StatusOverrideDialog,
} from "@/components/admin/StatusOverrideDialog";
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

const STATUS_OPTIONS: BookingStatus[] = [
  "created",
  "searching_for_partner",
  "assigned",
  "en_route",
  "arrived",
  "in_progress",
  "completed",
  "rated",
  "cancelled_by_customer",
  "cancelled_by_partner",
  "cancelled_by_admin",
  "no_show",
  "disputed",
];

const PAYMENT_STATUS_OPTIONS: PaymentStatus[] = [
  "Pending",
  "Paid",
  "Failed",
  "Refunded",
];

/*
 * Frontend fallback partner.
 *
 * This is only for frontend testing while the backend
 * eligibility/availability setup is being completed.
 */
const MOCK_ELIGIBLE_PARTNERS: BookingPartnerCandidate[] = [
  {
    id: "6abcd9a2113bfeaa34911617",
    name: "Test Partner",
  } as BookingPartnerCandidate,
];

function filtersAreEqual(
  first: BookingFilters,
  second: BookingFilters,
): boolean {
  return (
    first.search === second.search &&
    first.status === second.status &&
    first.city === second.city &&
    first.category === second.category &&
    first.customer === second.customer &&
    first.partner === second.partner &&
    first.date === second.date &&
    first.paymentStatus === second.paymentStatus
  );
}

function hasAnyFilters(
  filters: BookingFilters,
): boolean {
  return Boolean(
    filters.search.trim() ||
      filters.status ||
      filters.city.trim() ||
      filters.category.trim() ||
      filters.customer.trim() ||
      filters.partner.trim() ||
      filters.date ||
      filters.paymentStatus,
  );
}

function formatStatus(
  status: string,
): string {
  return status
    .split("_")
    .map(
      (word) =>
        word.charAt(0).toUpperCase() +
        word.slice(1),
    )
    .join(" ");
}

function escapeCsv(
  value: unknown,
): string {
  const text = String(value ?? "");

  if (
    text.includes(",") ||
    text.includes('"') ||
    text.includes("\n")
  ) {
    return `"${text.replace(
      /"/g,
      '""',
    )}"`;
  }

  return text;
}

function downloadCsv(
  bookings: AdminBooking[],
): void {
  const headers = [
    "Booking ID",
    "Customer",
    "Partner",
    "Service",
    "Category",
    "City",
    "Booking Date",
    "Start Time",
    "End Time",
    "Amount",
    "Payment Status",
    "Booking Status",
    "Created At",
  ];

  const rows = bookings.map(
    (booking) => [
      booking.id,
      booking.customer.name,
      booking.partner?.name ??
        "Not Assigned",
      booking.service.name,
      booking.service.category,
      booking.city,
      booking.slot.date,
      booking.slot.startTime,
      booking.slot.endTime,
      booking.pricing.totalAmount,
      booking.payment.status,
      formatStatus(
        booking.status,
      ),
      booking.createdAt,
    ],
  );

  const csv = [
    headers
      .map(escapeCsv)
      .join(","),
    ...rows.map((row) =>
      row
        .map(escapeCsv)
        .join(","),
    ),
  ].join("\n");

  const blob = new Blob(
    [csv],
    {
      type: "text/csv;charset=utf-8;",
    },
  );

  const url =
    URL.createObjectURL(blob);

  const link =
    document.createElement("a");

  link.href = url;

  link.download =
    `admin-bookings-${new Date()
      .toISOString()
      .slice(0, 10)}.csv`;

  document.body.appendChild(link);

  link.click();

  document.body.removeChild(link);

  URL.revokeObjectURL(url);
}

export default function Bookings() {
  const [filters, setFilters] =
    useState<BookingFilters>(
      INITIAL_FILTERS,
    );

  const [draftFilters, setDraftFilters] =
    useState<BookingFilters>(
      INITIAL_FILTERS,
    );

  const [bookings, setBookings] =
    useState<AdminBooking[]>([]);

  const [loading, setLoading] =
    useState<boolean>(true);

  const [error, setError] =
    useState<string>("");

  const [offline, setOffline] =
    useState<boolean>(
      !navigator.onLine,
    );

  const [filterOpen, setFilterOpen] =
    useState<boolean>(false);

  const [
    selectedBooking,
    setSelectedBooking,
  ] =
    useState<AdminBooking | null>(
      null,
    );

  const [drawerOpen, setDrawerOpen] =
    useState<boolean>(false);

  const [
    assignDialogOpen,
    setAssignDialogOpen,
  ] =
    useState<boolean>(false);

  const [
    statusDialogOpen,
    setStatusDialogOpen,
  ] =
    useState<boolean>(false);

  const [
    eligiblePartners,
    setEligiblePartners,
  ] =
    useState<
      BookingPartnerCandidate[]
    >([]);

  const [
    eligiblePartnersLoading,
    setEligiblePartnersLoading,
  ] =
    useState<boolean>(false);

  const activeFilterCount =
    useMemo(() => {
      let count = 0;

      if (filters.status) {
        count += 1;
      }

      if (filters.city.trim()) {
        count += 1;
      }

      if (
        filters.category.trim()
      ) {
        count += 1;
      }

      if (
        filters.customer.trim()
      ) {
        count += 1;
      }

      if (
        filters.partner.trim()
      ) {
        count += 1;
      }

      if (filters.date) {
        count += 1;
      }

      if (
        filters.paymentStatus
      ) {
        count += 1;
      }

      return count;
    }, [filters]);

  const loadBookings = async (
    activeFilters: BookingFilters =
      filters,
  ) => {
    setLoading(true);
    setError("");

    try {
      const data =
        await adminBookingApi.getBookings(
          activeFilters,
        );

      setBookings(data);
    } catch (err) {
      const normalized =
        err as {
          message?: string;
        };

      setError(
        normalized?.message ||
          "Unable to load bookings. Please try again.",
      );
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    void loadBookings(filters);
  }, [
    filters.search,
    filters.status,
    filters.city,
    filters.category,
    filters.customer,
    filters.partner,
    filters.date,
    filters.paymentStatus,
  ]);

  useEffect(() => {
    const handleOnline = () => {
      setOffline(false);
    };

    const handleOffline = () => {
      setOffline(true);
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

  const updateDraftFilter = <
    K extends keyof BookingFilters
  >(
    key: K,
    value: BookingFilters[K],
  ) => {
    setDraftFilters(
      (current) => ({
        ...current,
        [key]: value,
      }),
    );
  };

  const handleSearchChange = (
    event: React.ChangeEvent<HTMLInputElement>,
  ) => {
    const value =
      event.target.value;

    setFilters((current) => ({
      ...current,
      search: value,
    }));

    setDraftFilters(
      (current) => ({
        ...current,
        search: value,
      }),
    );
  };

  const applyFilters = () => {
    setFilters(draftFilters);
    setFilterOpen(false);
  };

  const clearFilters = () => {
    setFilters(
      INITIAL_FILTERS,
    );

    setDraftFilters(
      INITIAL_FILTERS,
    );
  };

  const handleExportCsv = () => {
    if (!bookings.length) {
      return;
    }

    downloadCsv(bookings);
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

  const handleAssignPartner = (
    booking: AdminBooking,
  ) => {
    setSelectedBooking(booking);
    setDrawerOpen(false);
    setAssignDialogOpen(true);
  };

  const handleStatusOverride = (
    booking: AdminBooking,
  ) => {
    setSelectedBooking(booking);
    setDrawerOpen(false);
    setStatusDialogOpen(true);
  };

  /**
   * Cancel booking.
   *
   * IMPORTANT:
   * The cancellation reason now comes from
   * the BookingDrawer.
   *
   * There is NO window.prompt here.
   *
   * This prevents the reason from being asked
   * twice.
   */
  const handleCancelBooking = async (
    booking: AdminBooking,
    reason: string,
  ) => {
    const trimmedReason =
      reason.trim();

    if (!trimmedReason) {
      setError(
        "Cancellation reason is required.",
      );

      return;
    }

    try {
      const updatedBooking =
        await adminBookingApi.cancelBooking(
          booking.id,
          {
            reason:
              trimmedReason,
          },
        );

      setBookings((current) =>
        current.map((item) =>
          item.id ===
          updatedBooking.id
            ? updatedBooking
            : item,
        ),
      );

      setSelectedBooking(
        updatedBooking,
      );
    } catch (err) {
      const normalized =
        err as {
          message?: string;
        };

      setError(
        normalized?.message ||
          "Unable to cancel the booking.",
      );
    }
  };

  const handleBookingUpdated = (
    updatedBooking: AdminBooking,
  ) => {
    setBookings((current) =>
      current.map(
        (booking) =>
          booking.id ===
          updatedBooking.id
            ? updatedBooking
            : booking,
      ),
    );

    setSelectedBooking(
      updatedBooking,
    );
  };

  /*
   * Load eligible partners.
   *
   * Backend partners are used when available.
   * Otherwise the frontend test partner is shown.
   */
  const handleLoadEligiblePartners =
    async (
      booking: AdminBooking,
    ) => {
      setEligiblePartnersLoading(
        true,
      );

      try {
        const partners =
          await adminBookingApi.getEligiblePartners(
            booking.id,
          );

        if (partners.length > 0) {
          setEligiblePartners(
            partners,
          );
        } else {
          setEligiblePartners(
            MOCK_ELIGIBLE_PARTNERS,
          );
        }
      } catch (err) {
        const normalized =
          err as {
            message?: string;
          };

        console.warn(
          "Eligible partner API unavailable:",
          normalized?.message ||
            "Unknown error",
        );

        setEligiblePartners(
          MOCK_ELIGIBLE_PARTNERS,
        );
      } finally {
        setEligiblePartnersLoading(
          false,
        );
      }
    };

  useEffect(() => {
    if (
      !assignDialogOpen ||
      !selectedBooking
    ) {
      return;
    }

    void handleLoadEligiblePartners(
      selectedBooking,
    );
  }, [
    assignDialogOpen,
    selectedBooking,
  ]);

  const handleAssignDialogClose =
    () => {
      setAssignDialogOpen(
        false,
      );

      setEligiblePartners([]);
    };

  const handlePartnerAssigned = (
    updatedBooking: AdminBooking,
  ) => {
    handleBookingUpdated(
      updatedBooking,
    );

    setAssignDialogOpen(false);

    setEligiblePartners([]);
  };

  const handleStatusDialogClose =
    () => {
      setStatusDialogOpen(false);
    };

  const handleStatusUpdated = (
    updatedBooking: AdminBooking,
  ) => {
    handleBookingUpdated(
      updatedBooking,
    );

    setStatusDialogOpen(false);
  };

  const filterButtonClassName = [
    "booking-filter-button",

    filterOpen ||
    activeFilterCount > 0
      ? "booking-filter-button--active"
      : "",
  ]
    .filter(Boolean)
    .join(" ");

  return (
    <main className="bookings-page">

      {/* PAGE HEADER */}

      <header className="bookings-page__header">
        <div className="bookings-page__title-section">

          <h1>Bookings</h1>

          <p>
            Monitor and manage customer
            bookings and service requests.
          </p>

        </div>

        <div className="bookings-page__actions">
          <button
            type="button"
            className="booking-top-button"
            onClick={
              handleExportCsv
            }
            disabled={
              !bookings.length ||
              loading
            }
          >
            <svg
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="1.8"
              aria-hidden="true"
            >
              <path
                d="M12 3v11"
                strokeLinecap="round"
              />

              <path
                d="m7.5 10.5 4.5 4.5 4.5-4.5"
                strokeLinecap="round"
                strokeLinejoin="round"
              />

              <path
                d="M5 20h14"
                strokeLinecap="round"
              />
            </svg>

            Export CSV
          </button>
        </div>
      </header>

      {/* ALERTS */}

      {offline && (
        <div className="bookings-alert bookings-alert--warning">
          <div>
            <strong>
              You are offline.
            </strong>

            <span>
              Booking data may not be up to date.
            </span>
          </div>
        </div>
      )}

      {error && (
        <div className="bookings-alert bookings-alert--error">
          <div>
            <strong>
              Unable to load bookings.
            </strong>

            <span>
              {error}
            </span>
          </div>

          <button
            type="button"
            onClick={() =>
              void loadBookings(
                filters,
              )
            }
          >
            Retry
          </button>
        </div>
      )}

      {/* BOOKINGS */}

      <section className="booking-results">

        <div className="booking-results__header">
          <div>
            <h2>
              Booking List
            </h2>

            <p>
              {loading
                ? "Loading bookings..."
                : `${bookings.length} ${
                    bookings.length ===
                    1
                      ? "booking"
                      : "bookings"
                  } found`}
            </p>
          </div>
        </div>

        {/* SEARCH + FILTER */}

        <div className="booking-toolbar">

          <div className="booking-search">
            <svg
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="1.8"
              aria-hidden="true"
            >
              <circle
                cx="11"
                cy="11"
                r="6.5"
              />

              <path
                d="m16 16 5 5"
                strokeLinecap="round"
              />
            </svg>

            <input
              type="search"
              value={
                filters.search
              }
              onChange={
                handleSearchChange
              }
              placeholder="Search bookings..."
              aria-label="Search bookings"
            />
          </div>

          <button
            type="button"
            className={
              filterButtonClassName
            }
            onClick={() =>
              setFilterOpen(
                (current) =>
                  !current,
              )
            }
            aria-expanded={
              filterOpen
            }
          >
            <svg
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="1.8"
              aria-hidden="true"
            >
              <path
                d="M4 6h16"
                strokeLinecap="round"
              />

              <path
                d="M7 12h10"
                strokeLinecap="round"
              />

              <path
                d="M10 18h4"
                strokeLinecap="round"
              />
            </svg>

            <span>
              Filter
            </span>

            {activeFilterCount >
              0 && (
              <span className="booking-filter-count">
                {
                  activeFilterCount
                }
              </span>
            )}
          </button>

        </div>

        {/* FILTER PANEL */}

        {filterOpen && (
          <div className="booking-filter-section">

            <div className="booking-filter-header">
              <h3>
                Filters
              </h3>

              <button
                type="button"
                className="booking-filter-close"
                onClick={() =>
                  setFilterOpen(
                    false,
                  )
                }
                aria-label="Close filters"
              >
                ×
              </button>
            </div>

            <div className="booking-filter-body">

              <div className="booking-filter-grid">

                <label className="booking-filter-field">
                  <span>
                    Status
                  </span>

                  <select
                    value={
                      draftFilters.status
                    }
                    onChange={(
                      event,
                    ) =>
                      updateDraftFilter(
                        "status",
                        event.target
                          .value as
                          | BookingStatus
                          | "",
                      )
                    }
                  >
                    <option value="">
                      All statuses
                    </option>

                    {STATUS_OPTIONS.map(
                      (status) => (
                        <option
                          key={
                            status
                          }
                          value={
                            status
                          }
                        >
                          {formatStatus(
                            status,
                          )}
                        </option>
                      ),
                    )}
                  </select>
                </label>

                <label className="booking-filter-field">
                  <span>
                    Payment Status
                  </span>

                  <select
                    value={
                      draftFilters.paymentStatus
                    }
                    onChange={(
                      event,
                    ) =>
                      updateDraftFilter(
                        "paymentStatus",
                        event.target
                          .value as
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
                          key={
                            status
                          }
                          value={
                            status
                          }
                        >
                          {status}
                        </option>
                      ),
                    )}
                  </select>
                </label>

                <label className="booking-filter-field">
                  <span>
                    Booking Date
                  </span>

                  <input
                    type="date"
                    value={
                      draftFilters.date
                    }
                    onChange={(
                      event,
                    ) =>
                      updateDraftFilter(
                        "date",
                        event.target
                          .value,
                      )
                    }
                  />
                </label>

                <label className="booking-filter-field">
                  <span>
                    City
                  </span>

                  <input
                    type="text"
                    value={
                      draftFilters.city
                    }
                    onChange={(
                      event,
                    ) =>
                      updateDraftFilter(
                        "city",
                        event.target
                          .value,
                      )
                    }
                    placeholder="Enter city"
                  />
                </label>

                <label className="booking-filter-field">
                  <span>
                    Category
                  </span>

                  <input
                    type="text"
                    value={
                      draftFilters.category
                    }
                    onChange={(
                      event,
                    ) =>
                      updateDraftFilter(
                        "category",
                        event.target
                          .value,
                      )
                    }
                    placeholder="Enter category"
                  />
                </label>

                <label className="booking-filter-field">
                  <span>
                    Customer
                  </span>

                  <input
                    type="text"
                    value={
                      draftFilters.customer
                    }
                    onChange={(
                      event,
                    ) =>
                      updateDraftFilter(
                        "customer",
                        event.target
                          .value,
                      )
                    }
                    placeholder="Customer name or ID"
                  />
                </label>

                <label className="booking-filter-field">
                  <span>
                    Partner
                  </span>

                  <input
                    type="text"
                    value={
                      draftFilters.partner
                    }
                    onChange={(
                      event,
                    ) =>
                      updateDraftFilter(
                        "partner",
                        event.target
                          .value,
                      )
                    }
                    placeholder="Partner name or ID"
                  />
                </label>

              </div>

            </div>

            <div className="booking-filter-footer">

              <button
                type="button"
                className="booking-filter-clear"
                onClick={
                  clearFilters
                }
                disabled={
                  !hasAnyFilters(
                    draftFilters,
                  )
                }
              >
                Clear
              </button>

              <button
                type="button"
                className="booking-filter-apply"
                onClick={
                  applyFilters
                }
                disabled={filtersAreEqual(
                  filters,
                  draftFilters,
                )}
              >
                Apply Filters
              </button>

            </div>

          </div>
        )}

        {/* TABLE */}

        <div className="booking-results__table">
          <BookingTable
            bookings={
              bookings
            }
            onBookingSelect={
              handleBookingSelect
            }
          />
        </div>

      </section>

      {/* DRAWER */}

      <BookingDrawer
        booking={
          selectedBooking
        }
        open={
          drawerOpen
        }
        onClose={
          handleCloseDrawer
        }
        onAssignPartner={
          handleAssignPartner
        }
        onStatusOverride={
          handleStatusOverride
        }
        onCancelBooking={
          handleCancelBooking
        }
      />

      {/* ASSIGN PARTNER */}

      <AssignPartnerDialog
        booking={
          selectedBooking
        }
        open={
          assignDialogOpen
        }
        partners={
          eligiblePartners
        }
        loading={
          eligiblePartnersLoading
        }
        onClose={
          handleAssignDialogClose
        }
        onAssigned={
          handlePartnerAssigned
        }
      />

      {/* STATUS OVERRIDE */}

      <StatusOverrideDialog
        booking={
          selectedBooking
        }
        open={
          statusDialogOpen
        }
        onClose={
          handleStatusDialogClose
        }
        onUpdated={
          handleStatusUpdated
        }
      />

    </main>
  );
}