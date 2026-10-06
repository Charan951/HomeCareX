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

const FRONTEND_TEST_PARTNER_ID =
  "6abcd9a2113bfeaa34911617";

function isFrontendTestPartner(
  partner: BookingPartnerCandidate,
): boolean {
  return partner.id === FRONTEND_TEST_PARTNER_ID;
}

function isEligiblePartner(
  partner: BookingPartnerCandidate,
  booking: AdminBooking,
): boolean {
  if (isFrontendTestPartner(partner)) {
    return true;
  }

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
  if (isFrontendTestPartner(partner)) {
    return [];
  }

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
  if (isFrontendTestPartner(partner)) {
    return [];
  }

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

  const [assignmentReason, setAssignmentReason] =
    useState("");

  const [assigning, setAssigning] =
    useState(false);

  const [error, setError] = useState("");

  const [showAllPartners, setShowAllPartners] =
    useState(false);

  useEffect(() => {
    if (!open) {
      setSelectedPartnerId("");
      setAssignmentReason("");
      setError("");
      setAssigning(false);
      setShowAllPartners(false);
      return;
    }

    setSelectedPartnerId(
      booking?.partner?.id ?? "",
    );

    setAssignmentReason("");
    setError("");
  }, [open, booking]);

  useEffect(() => {
    if (!open) {
      return;
    }

    const handleEscape = (
      event: KeyboardEvent,
    ) => {
      if (
        event.key === "Escape" &&
        !assigning
      ) {
        onClose();
      }
    };

    document.addEventListener(
      "keydown",
      handleEscape,
    );

    const previousOverflow =
      document.body.style.overflow;

    document.body.style.overflow = "hidden";

    return () => {
      document.removeEventListener(
        "keydown",
        handleEscape,
      );

      document.body.style.overflow =
        previousOverflow;
    };
  }, [
    open,
    onClose,
    assigning,
  ]);

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

    if (!assignmentReason.trim()) {
      setError("Assignment reason is required");
      return;
    }

    setAssigning(true);
    setError("");

    try {
      const updatedBooking =
        await adminBookingApi.assignPartner(
          booking.id,
          {
            partnerId: selectedPartner.id,
            reason: assignmentReason.trim(),
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

  const canAssign =
    selectedPartner !== null &&
    isEligiblePartner(
      selectedPartner,
      booking,
    ) &&
    assignmentReason.trim().length > 0 &&
    !assigning &&
    !loading;

  return (
    <>
      <style>{`
        /* =====================================================
           FULL SCREEN ASSIGN / REASSIGN PARTNER
           ===================================================== */

        .assign-partner-dialog__backdrop {
          position: fixed;
          inset: 0;
          z-index: 9998;

          width: 100vw;
          height: 100vh;

          min-width: 100%;
          min-height: 100%;

          display: flex;
          align-items: stretch;
          justify-content: stretch;

          margin: 0;
          padding: 0;

          box-sizing: border-box;

          background: #f8fafc;
        }

        .assign-partner-dialog {
          position: relative;

          width: 100vw;
          height: 100vh;

          min-width: 100%;
          min-height: 100%;

          max-width: none;
          max-height: none;

          display: flex;
          flex-direction: column;

          overflow: hidden;

          margin: 0;
          padding: 0;

          box-sizing: border-box;

          border: 0;
          border-radius: 0;

          background: #ffffff;

          box-shadow: none;
        }

        /* =====================================================
           HEADER
           ===================================================== */

        .assign-partner-dialog__header {
          width: 100%;

          display: flex;
          align-items: center;
          justify-content: space-between;

          gap: 24px;

          flex-shrink: 0;

          padding: 24px 40px;

          box-sizing: border-box;

          border-bottom: 1px solid #e5e7eb;

          background: #ffffff;
        }

        .assign-partner-dialog__title {
          margin: 0;

          color: #111827;

          font-size: 24px;
          line-height: 1.3;
          font-weight: 700;
        }

        .assign-partner-dialog__subtitle {
          margin: 7px 0 0;

          color: #6b7280;

          font-size: 14px;
          line-height: 1.5;
        }

        .assign-partner-dialog__close {
          display: inline-flex;
          align-items: center;
          justify-content: center;

          width: 42px;
          height: 42px;

          flex: 0 0 auto;

          padding: 0;

          border: 1px solid #d1d5db;
          border-radius: 8px;

          background: #ffffff;
          color: #374151;

          font-size: 24px;
          line-height: 1;

          cursor: pointer;
        }

        .assign-partner-dialog__close:hover:not(:disabled) {
          background: #f3f4f6;
          border-color: #9ca3af;
        }

        .assign-partner-dialog__close:disabled {
          cursor: not-allowed;
          opacity: 0.55;
        }

        /* =====================================================
           BODY
           ===================================================== */

        .assign-partner-dialog__body {
          flex: 1 1 auto;

          min-height: 0;

          overflow-y: auto;

          padding: 36px 40px;

          box-sizing: border-box;

          background: #f8fafc;
        }

        .assign-partner-dialog__content {
          width: 100%;
          max-width: 1150px;

          margin: 0 auto;
        }

        /* =====================================================
           BOOKING SUMMARY
           ===================================================== */

        .assign-partner-dialog__booking-summary {
          margin-bottom: 24px;

          padding: 20px;

          border: 1px solid #dbe3ec;
          border-radius: 10px;

          background: #ffffff;
        }

        .assign-partner-dialog__summary-title {
          margin: 0 0 7px;

          color: #111827;

          font-size: 18px;
          font-weight: 700;
        }

        .assign-partner-dialog__summary-text {
          margin: 0;

          color: #6b7280;

          font-size: 14px;
          line-height: 1.6;
        }

        /* =====================================================
           TOOLBAR
           ===================================================== */

        .assign-partner-dialog__toolbar {
          display: flex;
          align-items: center;
          justify-content: space-between;

          gap: 16px;

          margin-bottom: 14px;
        }

        .assign-partner-dialog__count {
          color: #374151;

          font-size: 14px;
          font-weight: 600;
        }

        .assign-partner-dialog__toggle {
          padding: 0;

          border: 0;

          background: transparent;
          color: #2563eb;

          font: inherit;
          font-size: 14px;
          font-weight: 600;

          cursor: pointer;
        }

        .assign-partner-dialog__toggle:hover {
          text-decoration: underline;
        }

        /* =====================================================
           PARTNER LIST
           ===================================================== */

        .assign-partner-dialog__loading,
        .assign-partner-dialog__empty {
          padding: 50px 20px;

          text-align: center;

          border: 1px solid #dbe3ec;
          border-radius: 10px;

          background: #ffffff;

          color: #6b7280;

          font-size: 14px;
        }

        .assign-partner-dialog__list {
          display: grid;

          grid-template-columns:
            repeat(2, minmax(0, 1fr));

          gap: 16px;
        }

        .assign-partner-dialog__partner {
          width: 100%;

          padding: 18px;

          border: 1px solid #dbe3ec;
          border-radius: 10px;

          background: #ffffff;

          text-align: left;

          cursor: pointer;

          transition:
            border-color 0.15s ease,
            background 0.15s ease;
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

          gap: 16px;
        }

        .assign-partner-dialog__partner-name {
          margin: 0;

          color: #111827;

          font-size: 16px;
          font-weight: 700;
        }

        .assign-partner-dialog__partner-email {
          margin: 4px 0 0;

          color: #6b7280;

          font-size: 13px;
        }

        .assign-partner-dialog__selected-badge {
          flex: 0 0 auto;

          padding: 5px 9px;

          border-radius: 999px;

          background: #dbeafe;
          color: #1d4ed8;

          font-size: 11px;
          font-weight: 700;
        }

        .assign-partner-dialog__details {
          display: flex;

          flex-wrap: wrap;

          gap: 7px;

          margin-top: 14px;
        }

        .assign-partner-dialog__badge {
          display: inline-flex;
          align-items: center;

          padding: 5px 9px;

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
          margin-top: 12px;

          padding: 10px 12px;

          border-radius: 8px;

          background: #fff7ed;
          color: #9a3412;

          font-size: 12px;
          line-height: 1.5;
        }

        .assign-partner-dialog__conflict {
          margin-top: 10px;

          padding: 10px 12px;

          border-radius: 8px;

          background: #fef2f2;
          color: #991b1b;

          font-size: 12px;
          line-height: 1.5;
        }

        /* =====================================================
           REASON
           ===================================================== */

        .assign-partner-dialog__reason {
          margin-top: 24px;

          padding: 20px;

          border: 1px solid #dbe3ec;
          border-radius: 10px;

          background: #ffffff;
        }

        .assign-partner-dialog__reason-label {
          display: block;

          margin-bottom: 8px;

          color: #374151;

          font-size: 14px;
          font-weight: 600;
        }

        .assign-partner-dialog__reason-label span {
          color: #dc2626;
        }

        .assign-partner-dialog__reason-input {
          width: 100%;

          min-height: 120px;

          box-sizing: border-box;

          padding: 12px 14px;

          border: 1px solid #cbd5e1;
          border-radius: 10px;

          background: #ffffff;
          color: #111827;

          font-family: inherit;
          font-size: 14px;

          line-height: 1.5;

          resize: vertical;

          outline: none;
        }

        .assign-partner-dialog__reason-input:hover {
          border-color: #94a3b8;
        }

        .assign-partner-dialog__reason-input:focus {
          border-color: #2563eb;

          box-shadow:
            0 0 0 3px rgba(37, 99, 235, 0.1);
        }

        .assign-partner-dialog__reason-input:disabled {
          background: #f3f4f6;

          cursor: not-allowed;
        }

        .assign-partner-dialog__reason-help {
          margin: 7px 0 0;

          color: #6b7280;

          font-size: 12px;
        }

        /* =====================================================
           ERROR
           ===================================================== */

        .assign-partner-dialog__error {
          margin-top: 18px;

          padding: 14px 16px;

          border: 1px solid #fecaca;
          border-radius: 10px;

          background: #fef2f2;
          color: #991b1b;

          font-size: 14px;
          line-height: 1.5;
        }

        /* =====================================================
           FOOTER
           ===================================================== */

        .assign-partner-dialog__footer {
          width: 100%;

          display: flex;
          align-items: center;
          justify-content: flex-end;

          gap: 12px;

          flex-shrink: 0;

          padding: 20px 40px;

          box-sizing: border-box;

          border-top: 1px solid #e5e7eb;

          background: #ffffff;
        }

        .assign-partner-dialog__button {
          min-height: 46px;

          min-width: 140px;

          padding: 10px 22px;

          border-radius: 9px;

          font: inherit;

          font-size: 14px;
          font-weight: 600;

          cursor: pointer;
        }

        .assign-partner-dialog__button--secondary {
          border: 1px solid #cbd5e1;

          background: #ffffff;
          color: #374151;
        }

        .assign-partner-dialog__button--secondary:hover:not(:disabled) {
          background: #f8fafc;
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

        .assign-partner-dialog__close:focus-visible,
        .assign-partner-dialog button:focus-visible,
        .assign-partner-dialog textarea:focus-visible {
          outline: 2px solid #2563eb;
          outline-offset: 2px;
        }

        /* =====================================================
           TABLET
           ===================================================== */

        @media (max-width: 900px) {
          .assign-partner-dialog__header {
            padding: 22px 24px;
          }

          .assign-partner-dialog__body {
            padding: 28px 24px;
          }

          .assign-partner-dialog__footer {
            padding: 18px 24px;
          }

          .assign-partner-dialog__list {
            grid-template-columns: 1fr;
          }
        }

        /* =====================================================
           MOBILE
           ===================================================== */

        @media (max-width: 600px) {
          .assign-partner-dialog__header {
            padding: 18px 16px;
          }

          .assign-partner-dialog__title {
            font-size: 20px;
          }

          .assign-partner-dialog__subtitle {
            font-size: 13px;
          }

          .assign-partner-dialog__close {
            width: 38px;
            height: 38px;
          }

          .assign-partner-dialog__body {
            padding: 22px 16px;
          }

          .assign-partner-dialog__booking-summary {
            padding: 16px;
          }

          .assign-partner-dialog__toolbar {
            align-items: flex-start;
            flex-direction: column;
          }

          .assign-partner-dialog__partner {
            padding: 15px;
          }

          .assign-partner-dialog__reason {
            padding: 16px;
          }

          .assign-partner-dialog__footer {
            flex-direction: column-reverse;

            align-items: stretch;

            padding: 16px;
          }

          .assign-partner-dialog__button {
            width: 100%;
          }
        }

        @media (max-width: 360px) {
          .assign-partner-dialog__header {
            padding: 16px 12px;
          }

          .assign-partner-dialog__body {
            padding: 20px 12px;
          }

          .assign-partner-dialog__footer {
            padding: 14px 12px;
          }

          .assign-partner-dialog__title {
            font-size: 18px;
          }
        }
      `}</style>

      <div
        className="assign-partner-dialog__backdrop"
        role="presentation"
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
                  ? "Reassign Partner"
                  : "Assign Partner"}
              </h2>

              <p className="assign-partner-dialog__subtitle">
                Booking ID: {booking.id}
              </p>
            </div>

            <button
              type="button"
              className="assign-partner-dialog__close"
              onClick={onClose}
              aria-label="Close assign partner"
              disabled={assigning}
            >
              ×
            </button>
          </header>

          <div className="assign-partner-dialog__body">
            <div className="assign-partner-dialog__content">
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
                              <span className="assign-partner-dialog__badge assign-partner-dialog__badge--danger">
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
                              {reasons.join(" · ")}
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

              <div className="assign-partner-dialog__reason">
                <label
                  htmlFor="assignment-reason"
                  className="assign-partner-dialog__reason-label"
                >
                  Assignment Reason{" "}
                  <span>*</span>
                </label>

                <textarea
                  id="assignment-reason"
                  value={assignmentReason}
                  onChange={(event) => {
                    setAssignmentReason(
                      event.target.value,
                    );

                    if (
                      error ===
                      "Assignment reason is required"
                    ) {
                      setError("");
                    }
                  }}
                  placeholder="Enter reason for assigning this partner"
                  rows={4}
                  disabled={assigning}
                  className="assign-partner-dialog__reason-input"
                />

                <p className="assign-partner-dialog__reason-help">
                  Reason is required for audit
                  purposes.
                </p>
              </div>

              {error && (
                <div
                  className="assign-partner-dialog__error"
                  role="alert"
                >
                  {error}
                </div>
              )}
            </div>
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
              disabled={!canAssign}
            >
              {assigning
                ? "Assigning..."
                : isReassignment
                  ? "Reassign Partner"
                  : "Assign Partner"}
            </button>
          </footer>
        </section>
      </div>
    </>
  );
};

export default AssignPartnerDialog;