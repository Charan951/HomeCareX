import React, {
  useEffect,
  useMemo,
  useState,
} from "react";

import { adminBookingApi } from "@/services/adminBookingApi";

import type {
  AdminBooking,
  BookingPartnerCandidate,
} from "@/types/adminBooking";

interface AssignPartnerDialogProps {
  booking: AdminBooking | null;
  open: boolean;
  partners: BookingPartnerCandidate[];
  loading?: boolean;
  onClose: () => void;
  onAssigned?: (booking: AdminBooking) => void;
}

/**
 * The backend /eligible-partners endpoint already performs the
 * authoritative eligibility filtering.
 *
 * The frontend therefore only performs safe UI-level checks.
 * All optional arrays are normalized so a missing property can
 * never cause `.some()`, `.join()` or `.length` to crash.
 */
function isEligiblePartner(
  partner: BookingPartnerCandidate,
  booking: AdminBooking,
): boolean {
  void booking;

  const categories = Array.isArray(partner.categories)
    ? partner.categories
    : [];

  const cities = Array.isArray(partner.cities)
    ? partner.cities
    : [];

  const areas = Array.isArray(partner.areas)
    ? partner.areas
    : [];

  const conflictBookingIds = Array.isArray(
    partner.conflictBookingIds,
  )
    ? partner.conflictBookingIds
    : [];

  /*
   * If the backend does not provide the detailed legacy
   * eligibility fields, don't reject the partner on the
   * frontend. The backend endpoint is already responsible
   * for returning eligible partners.
   */
  const hasDetailedEligibility =
    typeof partner.kycStatus === "string" ||
    typeof partner.accountStatus === "string" ||
    typeof partner.available === "boolean" ||
    categories.length > 0 ||
    cities.length > 0 ||
    areas.length > 0 ||
    conflictBookingIds.length > 0;

  if (!hasDetailedEligibility) {
    return true;
  }

  const kycApproved =
    partner.kycStatus === undefined ||
    partner.kycStatus === "Approved";

  const accountActive =
    partner.accountStatus === undefined ||
    partner.accountStatus === "Active";

  const available =
    partner.available === undefined ||
    partner.available;

  const noConflict =
    conflictBookingIds.length === 0;

  /*
   * Only apply category/city/area checks when the backend
   * actually supplies those arrays.
   */
  const categoryMatches =
    categories.length === 0 ||
    categories.some((category) => {
      const normalizedCategory =
        category.toLowerCase();

      return (
        normalizedCategory ===
          booking.service.category.toLowerCase() ||
        normalizedCategory ===
          booking.service.name.toLowerCase()
      );
    });

  const cityMatches =
    cities.length === 0 ||
    cities.some(
      (city) =>
        city.toLowerCase() ===
        booking.city.toLowerCase(),
    );

  const areaMatches =
    areas.length === 0 ||
    areas.some(
      (area) =>
        area.toLowerCase() ===
        booking.address.area.toLowerCase(),
    );

  return (
    kycApproved &&
    accountActive &&
    categoryMatches &&
    cityMatches &&
    areaMatches &&
    available &&
    noConflict
  );
}

function getEligibilityReasons(
  partner: BookingPartnerCandidate,
  booking: AdminBooking,
): string[] {
  const reasons: string[] = [];

  const categories = Array.isArray(partner.categories)
    ? partner.categories
    : [];

  const cities = Array.isArray(partner.cities)
    ? partner.cities
    : [];

  const areas = Array.isArray(partner.areas)
    ? partner.areas
    : [];

  const conflictBookingIds = Array.isArray(
    partner.conflictBookingIds,
  )
    ? partner.conflictBookingIds
    : [];

  if (
    partner.kycStatus !== undefined &&
    partner.kycStatus !== "Approved"
  ) {
    reasons.push("KYC is not approved");
  }

  if (
    partner.accountStatus !== undefined &&
    partner.accountStatus !== "Active"
  ) {
    reasons.push(
      `Account is ${partner.accountStatus.toLowerCase()}`,
    );
  }

  if (categories.length > 0) {
    const categoryMatches = categories.some(
      (category) => {
        const normalizedCategory =
          category.toLowerCase();

        return (
          normalizedCategory ===
            booking.service.category.toLowerCase() ||
          normalizedCategory ===
            booking.service.name.toLowerCase()
        );
      },
    );

    if (!categoryMatches) {
      reasons.push(
        "Service category does not match",
      );
    }
  }

  if (cities.length > 0) {
    const cityMatches = cities.some(
      (city) =>
        city.toLowerCase() ===
        booking.city.toLowerCase(),
    );

    if (!cityMatches) {
      reasons.push("City does not match");
    }
  }

  if (areas.length > 0) {
    const areaMatches = areas.some(
      (area) =>
        area.toLowerCase() ===
        booking.address.area.toLowerCase(),
    );

    if (!areaMatches) {
      reasons.push(
        "Service area does not match",
      );
    }
  }

  if (
    partner.available !== undefined &&
    !partner.available
  ) {
    reasons.push(
      "Partner is currently unavailable",
    );
  }

  if (conflictBookingIds.length > 0) {
    reasons.push(
      `Schedule conflict (${conflictBookingIds.length} booking${
        conflictBookingIds.length === 1
          ? ""
          : "s"
      })`,
    );
  }

  return reasons;
}

function getCategories(
  partner: BookingPartnerCandidate,
): string[] {
  return Array.isArray(partner.categories)
    ? partner.categories
    : [];
}

function getCities(
  partner: BookingPartnerCandidate,
): string[] {
  return Array.isArray(partner.cities)
    ? partner.cities
    : [];
}

function getAreas(
  partner: BookingPartnerCandidate,
): string[] {
  return Array.isArray(partner.areas)
    ? partner.areas
    : [];
}

function getConflictBookingIds(
  partner: BookingPartnerCandidate,
): string[] {
  return Array.isArray(
    partner.conflictBookingIds,
  )
    ? partner.conflictBookingIds
    : [];
}

export const AssignPartnerDialog: React.FC<
  AssignPartnerDialogProps
> = ({
  booking,
  open,
  partners,
  loading = false,
  onClose,
  onAssigned,
}) => {
  const [selectedPartnerId, setSelectedPartnerId] =
    useState("");

  const [assigning, setAssigning] =
    useState(false);

  const [error, setError] = useState("");

  const [showAllPartners, setShowAllPartners] =
    useState(false);

  useEffect(() => {
    if (!open) {
      setSelectedPartnerId("");
      setError("");
      setAssigning(false);
      setShowAllPartners(false);
      return;
    }

    setSelectedPartnerId(
      booking?.partner?.id ?? "",
    );

    setError("");
  }, [open, booking]);

  const eligiblePartners = useMemo(() => {
    if (!booking) {
      return [];
    }

    return partners.filter((partner) =>
      isEligiblePartner(partner, booking),
    );
  }, [booking, partners]);

  const ineligiblePartners = useMemo(() => {
    if (!booking) {
      return [];
    }

    return partners.filter(
      (partner) =>
        !isEligiblePartner(partner, booking),
    );
  }, [booking, partners]);

  const displayedPartners = showAllPartners
    ? partners
    : eligiblePartners;

  const selectedPartner = useMemo(
    () =>
      partners.find(
        (partner) =>
          partner.id === selectedPartnerId,
      ) ?? null,
    [partners, selectedPartnerId],
  );

  const handleAssign = async () => {
    if (!booking || !selectedPartner) {
      setError(
        "Please select an eligible partner.",
      );
      return;
    }

    if (
      !isEligiblePartner(
        selectedPartner,
        booking,
      )
    ) {
      setError(
        "This partner does not satisfy all assignment requirements.",
      );
      return;
    }

    setAssigning(true);
    setError("");

    try {
      const updatedBooking =
        await adminBookingApi.assignPartner(
          booking.id,
          {
            partnerId:
              selectedPartner.id,
          },
        );

      onAssigned?.(updatedBooking);
      onClose();
    } catch (err) {
      const message =
        typeof err === "object" &&
        err !== null &&
        "message" in err &&
        typeof err.message === "string"
          ? err.message
          : "Unable to assign partner. Please try again.";

      setError(message);
    } finally {
      setAssigning(false);
    }
  };

  if (!open || !booking) {
    return null;
  }

  const isReassignment =
    Boolean(booking.partner);

  return (
    <>
      <style>{`
        .assign-partner-dialog__backdrop {
          position: fixed;
          inset: 0;
          z-index: 1100;
          background: rgba(15, 23, 42, 0.55);
          display: flex;
          align-items: center;
          justify-content: center;
          padding: 20px;
        }

        .assign-partner-dialog {
          width: min(760px, 100%);
          max-height: min(720px, calc(100vh - 40px));
          display: flex;
          flex-direction: column;
          overflow: hidden;
          background: #ffffff;
          border-radius: 12px;
          box-shadow: 0 24px 70px rgba(15, 23, 42, 0.25);
        }

        .assign-partner-dialog__header {
          display: flex;
          align-items: flex-start;
          justify-content: space-between;
          gap: 16px;
          padding: 20px 22px;
          border-bottom: 1px solid #e5e7eb;
        }

        .assign-partner-dialog__title {
          margin: 0;
          color: #111827;
          font-size: 18px;
          font-weight: 700;
        }

        .assign-partner-dialog__subtitle {
          margin: 5px 0 0;
          color: #6b7280;
          font-size: 13px;
        }

        .assign-partner-dialog__close {
          flex: 0 0 auto;
          width: 36px;
          height: 36px;
          border: 1px solid #e5e7eb;
          border-radius: 8px;
          background: #ffffff;
          color: #374151;
          font-size: 20px;
          line-height: 1;
          cursor: pointer;
        }

        .assign-partner-dialog__close:hover {
          background: #f9fafb;
        }

        .assign-partner-dialog__close:focus-visible,
        .assign-partner-dialog button:focus-visible {
          outline: 2px solid #2563eb;
          outline-offset: 2px;
        }

        .assign-partner-dialog__body {
          flex: 1;
          overflow-y: auto;
          padding: 20px 22px;
        }

        .assign-partner-dialog__booking-summary {
          margin-bottom: 18px;
          padding: 14px;
          border: 1px solid #e5e7eb;
          border-radius: 8px;
          background: #f8fafc;
        }

        .assign-partner-dialog__summary-title {
          margin: 0 0 6px;
          color: #111827;
          font-size: 14px;
          font-weight: 700;
        }

        .assign-partner-dialog__summary-text {
          margin: 0;
          color: #4b5563;
          font-size: 13px;
          line-height: 1.5;
        }

        .assign-partner-dialog__toolbar {
          display: flex;
          align-items: center;
          justify-content: space-between;
          gap: 12px;
          margin-bottom: 12px;
        }

        .assign-partner-dialog__count {
          color: #374151;
          font-size: 13px;
          font-weight: 600;
        }

        .assign-partner-dialog__toggle {
          padding: 0;
          border: 0;
          background: transparent;
          color: #2563eb;
          font: inherit;
          font-size: 13px;
          font-weight: 600;
          cursor: pointer;
        }

        .assign-partner-dialog__toggle:hover {
          text-decoration: underline;
        }

        .assign-partner-dialog__loading,
        .assign-partner-dialog__empty {
          padding: 32px 16px;
          text-align: center;
          border: 1px solid #e5e7eb;
          border-radius: 8px;
          color: #6b7280;
          font-size: 14px;
        }

        .assign-partner-dialog__list {
          display: grid;
          gap: 10px;
        }

        .assign-partner-dialog__partner {
          width: 100%;
          padding: 14px;
          border: 1px solid #e5e7eb;
          border-radius: 10px;
          background: #ffffff;
          text-align: left;
          cursor: pointer;
        }

        .assign-partner-dialog__partner:hover:not(:disabled) {
          border-color: #93c5fd;
          background: #f8fbff;
        }

        .assign-partner-dialog__partner--selected {
          border-color: #2563eb;
          background: #eff6ff;
        }

        .assign-partner-dialog__partner--ineligible {
          cursor: not-allowed;
          opacity: 0.72;
          background: #f9fafb;
        }

        .assign-partner-dialog__partner:disabled {
          cursor: not-allowed;
        }

        .assign-partner-dialog__partner-header {
          display: flex;
          align-items: flex-start;
          justify-content: space-between;
          gap: 12px;
        }

        .assign-partner-dialog__partner-name {
          margin: 0;
          color: #111827;
          font-size: 15px;
          font-weight: 700;
        }

        .assign-partner-dialog__partner-email {
          margin: 3px 0 0;
          color: #6b7280;
          font-size: 12px;
        }

        .assign-partner-dialog__selected-badge {
          flex: 0 0 auto;
          padding: 4px 8px;
          border-radius: 999px;
          background: #dbeafe;
          color: #1d4ed8;
          font-size: 11px;
          font-weight: 700;
        }

        .assign-partner-dialog__details {
          display: flex;
          flex-wrap: wrap;
          gap: 6px;
          margin-top: 12px;
        }

        .assign-partner-dialog__badge {
          display: inline-flex;
          align-items: center;
          padding: 4px 8px;
          border-radius: 999px;
          background: #f3f4f6;
          color: #374151;
          font-size: 11px;
          font-weight: 600;
        }

        .assign-partner-dialog__badge--approved,
        .assign-partner-dialog__badge--active,
        .assign-partner-dialog__badge--available {
          background: #dcfce7;
          color: #166534;
        }

        .assign-partner-dialog__badge--danger {
          background: #fee2e2;
          color: #991b1b;
        }

        .assign-partner-dialog__requirements {
          margin-top: 10px;
          padding: 9px 10px;
          border-radius: 7px;
          background: #fff7ed;
          color: #9a3412;
          font-size: 12px;
          line-height: 1.45;
        }

        .assign-partner-dialog__conflict {
          margin: 10px 0 0;
          padding: 9px 10px;
          border-radius: 7px;
          background: #fef2f2;
          color: #991b1b;
          font-size: 12px;
          line-height: 1.4;
        }

        .assign-partner-dialog__error {
          margin-top: 14px;
          padding: 10px 12px;
          border: 1px solid #fecaca;
          border-radius: 8px;
          background: #fef2f2;
          color: #991b1b;
          font-size: 13px;
          line-height: 1.4;
        }

        .assign-partner-dialog__footer {
          display: flex;
          justify-content: flex-end;
          gap: 10px;
          padding: 16px 22px;
          border-top: 1px solid #e5e7eb;
          background: #ffffff;
        }

        .assign-partner-dialog__button {
          min-height: 40px;
          padding: 9px 16px;
          border-radius: 8px;
          font: inherit;
          font-size: 14px;
          font-weight: 600;
          cursor: pointer;
        }

        .assign-partner-dialog__button--secondary {
          border: 1px solid #d1d5db;
          background: #ffffff;
          color: #374151;
        }

        .assign-partner-dialog__button--primary {
          border: 1px solid #2563eb;
          background: #2563eb;
          color: #ffffff;
        }

        .assign-partner-dialog__button--primary:hover:not(:disabled) {
          background: #1d4ed8;
        }

        .assign-partner-dialog__button:disabled {
          cursor: not-allowed;
          opacity: 0.55;
        }

        @media (max-width: 600px) {
          .assign-partner-dialog__backdrop {
            align-items: flex-end;
            padding: 0;
          }

          .assign-partner-dialog {
            width: 100%;
            max-height: 92vh;
            border-radius: 12px 12px 0 0;
          }

          .assign-partner-dialog__header,
          .assign-partner-dialog__body,
          .assign-partner-dialog__footer {
            padding-left: 16px;
            padding-right: 16px;
          }

          .assign-partner-dialog__footer {
            flex-direction: column-reverse;
          }

          .assign-partner-dialog__button {
            width: 100%;
          }
        }
      `}</style>

      <div
        className="assign-partner-dialog__backdrop"
        role="presentation"
        onMouseDown={(event) => {
          if (
            event.target ===
            event.currentTarget
          ) {
            onClose();
          }
        }}
      >
        <section
          className="assign-partner-dialog"
          role="dialog"
          aria-modal="true"
          aria-labelledby="assign-partner-dialog-title"
        >
          <header className="assign-partner-dialog__header">
            <div>
              <h2
                id="assign-partner-dialog-title"
                className="assign-partner-dialog__title"
              >
                {isReassignment
                  ? "Reassign partner"
                  : "Assign partner"}
              </h2>

              <p className="assign-partner-dialog__subtitle">
                Booking {booking.id}
              </p>
            </div>

            <button
              type="button"
              className="assign-partner-dialog__close"
              onClick={onClose}
              aria-label="Close assign partner dialog"
              disabled={assigning}
            >
              ×
            </button>
          </header>

          <div className="assign-partner-dialog__body">
            <div className="assign-partner-dialog__booking-summary">
              <p className="assign-partner-dialog__summary-title">
                {booking.service.name}
              </p>

              <p className="assign-partner-dialog__summary-text">
                {booking.service.category} ·{" "}
                {booking.city} ·{" "}
                {booking.address.area} ·{" "}
                {booking.slot.date} ·{" "}
                {booking.slot.startTime} -{" "}
                {booking.slot.endTime}
              </p>
            </div>

            <div className="assign-partner-dialog__toolbar">
              <span className="assign-partner-dialog__count">
                {eligiblePartners.length} eligible{" "}
                partner
                {eligiblePartners.length === 1
                  ? ""
                  : "s"}
              </span>

              {ineligiblePartners.length > 0 && (
                <button
                  type="button"
                  className="assign-partner-dialog__toggle"
                  onClick={() =>
                    setShowAllPartners(
                      (value) => !value,
                    )
                  }
                >
                  {showAllPartners
                    ? "Show eligible only"
                    : `Show all (${partners.length})`}
                </button>
              )}
            </div>

            {loading ? (
              <div className="assign-partner-dialog__loading">
                Loading eligible partners...
              </div>
            ) : displayedPartners.length ===
              0 ? (
              <div className="assign-partner-dialog__empty">
                No eligible partners are currently
                available for this booking.
              </div>
            ) : (
              <div className="assign-partner-dialog__list">
                {displayedPartners.map(
                  (partner) => {
                    const eligible =
                      isEligiblePartner(
                        partner,
                        booking,
                      );

                    const reasons =
                      getEligibilityReasons(
                        partner,
                        booking,
                      );

                    const selected =
                      partner.id ===
                      selectedPartnerId;

                    const categories =
                      getCategories(partner);

                    const cities =
                      getCities(partner);

                    const areas =
                      getAreas(partner);

                    const conflictBookingIds =
                      getConflictBookingIds(
                        partner,
                      );

                    return (
                      <button
                        key={partner.id}
                        type="button"
                        className={[
                          "assign-partner-dialog__partner",
                          selected
                            ? "assign-partner-dialog__partner--selected"
                            : "",
                          !eligible
                            ? "assign-partner-dialog__partner--ineligible"
                            : "",
                        ]
                          .filter(Boolean)
                          .join(" ")}
                        disabled={
                          !eligible ||
                          assigning
                        }
                        onClick={() =>
                          setSelectedPartnerId(
                            partner.id,
                          )
                        }
                        aria-pressed={selected}
                      >
                        <div className="assign-partner-dialog__partner-header">
                          <div>
                            <p className="assign-partner-dialog__partner-name">
                              {partner.name}
                            </p>

                            <p className="assign-partner-dialog__partner-email">
                              {partner.email ??
                                "Partner"}
                            </p>
                          </div>

                          {selected && (
                            <span className="assign-partner-dialog__selected-badge">
                              Selected
                            </span>
                          )}
                        </div>

                        <div className="assign-partner-dialog__details">
                          {categories.length >
                            0 && (
                            <span className="assign-partner-dialog__badge">
                              Category:{" "}
                              {categories.join(
                                ", ",
                              )}
                            </span>
                          )}

                          {cities.length > 0 && (
                            <span className="assign-partner-dialog__badge">
                              City:{" "}
                              {cities.join(", ")}
                            </span>
                          )}

                          {areas.length > 0 && (
                            <span className="assign-partner-dialog__badge">
                              Area:{" "}
                              {areas.join(", ")}
                            </span>
                          )}

                          {partner.kycStatus !==
                            undefined && (
                            <span
                              className={[
                                "assign-partner-dialog__badge",
                                partner.kycStatus ===
                                "Approved"
                                  ? "assign-partner-dialog__badge--approved"
                                  : "assign-partner-dialog__badge--danger",
                              ].join(" ")}
                            >
                              KYC:{" "}
                              {
                                partner.kycStatus
                              }
                            </span>
                          )}

                          {partner.accountStatus !==
                            undefined && (
                            <span
                              className={[
                                "assign-partner-dialog__badge",
                                partner.accountStatus ===
                                "Active"
                                  ? "assign-partner-dialog__badge--active"
                                  : "assign-partner-dialog__badge--danger",
                              ].join(" ")}
                            >
                              Account:{" "}
                              {
                                partner.accountStatus
                              }
                            </span>
                          )}

                          {partner.available !==
                            undefined && (
                            <span
                              className={[
                                "assign-partner-dialog__badge",
                                partner.available
                                  ? "assign-partner-dialog__badge--available"
                                  : "assign-partner-dialog__badge--danger",
                              ].join(" ")}
                            >
                              {partner.available
                                ? "Available"
                                : "Unavailable"}
                            </span>
                          )}

                          {conflictBookingIds.length >
                            0 && (
                            <span
                              className={[
                                "assign-partner-dialog__badge",
                                "assign-partner-dialog__badge--danger",
                              ].join(" ")}
                            >
                              {
                                conflictBookingIds.length
                              }{" "}
                              conflict
                              {conflictBookingIds.length ===
                              1
                                ? ""
                                : "s"}
                            </span>
                          )}

                          {conflictBookingIds.length ===
                            0 && (
                            <span className="assign-partner-dialog__badge assign-partner-dialog__badge--approved">
                              No conflict
                            </span>
                          )}
                        </div>

                        {!eligible &&
                          reasons.length > 0 && (
                            <div className="assign-partner-dialog__requirements">
                              <strong>
                                Cannot assign:
                              </strong>{" "}
                              {reasons.join(
                                " · ",
                              )}
                            </div>
                          )}

                        {conflictBookingIds.length >
                          0 && (
                          <div className="assign-partner-dialog__conflict">
                            <strong>
                              Conflict warning:
                            </strong>{" "}
                            This partner has an
                            existing booking
                            conflict:{" "}
                            {conflictBookingIds.join(
                              ", ",
                            )}
                          </div>
                        )}
                      </button>
                    );
                  },
                )}
              </div>
            )}

            {error && (
              <div
                className="assign-partner-dialog__error"
                role="alert"
              >
                {error}
              </div>
            )}
          </div>

          <footer className="assign-partner-dialog__footer">
            <button
              type="button"
              className="assign-partner-dialog__button assign-partner-dialog__button--secondary"
              onClick={onClose}
              disabled={assigning}
            >
              Cancel
            </button>

            <button
              type="button"
              className="assign-partner-dialog__button assign-partner-dialog__button--primary"
              onClick={() =>
                void handleAssign()
              }
              disabled={
                assigning ||
                loading ||
                !selectedPartner ||
                !isEligiblePartner(
                  selectedPartner,
                  booking,
                )
              }
            >
              {assigning
                ? "Assigning..."
                : isReassignment
                  ? "Reassign partner"
                  : "Assign partner"}
            </button>
          </footer>
        </section>
      </div>
    </>
  );
};

export default AssignPartnerDialog;