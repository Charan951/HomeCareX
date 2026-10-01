import React, { useEffect, useState } from "react";
import { createPortal } from "react-dom";

import { adminBookingApi } from "@/services/adminBookingApi";

import type {
  AdminBooking,
  BookingStatus,
  TimelineActorType,
} from "@/types/adminBooking";

import Timeline, {
  type TimelineItem,
} from "@/components/admin/Timeline";

interface BookingDrawerProps {
  booking: AdminBooking | null;
  open: boolean;
  onClose: () => void;

  onAssignPartner?: (booking: AdminBooking) => void;
  onStatusOverride?: (booking: AdminBooking) => void;
  onCancelBooking?: (booking: AdminBooking) => void;
}

function formatDate(value: string): string {
  if (!value) return "-";

  const date = new Date(value);

  if (Number.isNaN(date.getTime())) {
    return value;
  }

  return date.toLocaleDateString("en-IN", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  });
}

function formatDateTime(value: string): string {
  if (!value) return "-";

  const date = new Date(value);

  if (Number.isNaN(date.getTime())) {
    return value;
  }

  return date.toLocaleString("en-IN", {
    day: "2-digit",
    month: "short",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

function formatAmount(amount: number): string {
  return new Intl.NumberFormat("en-IN", {
    style: "currency",
    currency: "INR",
    maximumFractionDigits: 2,
  }).format(amount);
}

function getStatusLabel(status: BookingStatus): string {
  switch (status) {
    case "created":
      return "Pending";

    case "searching_for_partner":
      return "Searching for Partner";

    case "assigned":
      return "Assigned";

    case "en_route":
      return "En Route";

    case "arrived":
      return "Arrived";

    case "in_progress":
      return "In Progress";

    case "completed":
      return "Completed";

    case "rated":
      return "Rated";

    case "cancelled_by_customer":
      return "Cancelled by Customer";

    case "cancelled_by_partner":
      return "Cancelled by Partner";

    case "no_show":
      return "No Show";

    case "disputed":
      return "Disputed";

    default:
      return status;
  }
}

function getStatusClass(status: BookingStatus): string {
  switch (status) {
    case "completed":
    case "rated":
      return "booking-drawer__status booking-drawer__status--completed";

    case "cancelled_by_customer":
    case "cancelled_by_partner":
    case "no_show":
      return "booking-drawer__status booking-drawer__status--cancelled";

    case "in_progress":
    case "en_route":
    case "arrived":
      return "booking-drawer__status booking-drawer__status--progress";

    case "assigned":
      return "booking-drawer__status booking-drawer__status--assigned";

    case "searching_for_partner":
      return "booking-drawer__status booking-drawer__status--confirmed";

    case "disputed":
      return "booking-drawer__status booking-drawer__status--cancelled";

    case "created":
    default:
      return "booking-drawer__status booking-drawer__status--pending";
  }
}

function getPaymentClass(status: string): string {
  switch (status) {
    case "Paid":
      return "booking-drawer__status booking-drawer__status--paid";

    case "Failed":
      return "booking-drawer__status booking-drawer__status--failed";

    case "Refunded":
      return "booking-drawer__status booking-drawer__status--refunded";

    case "Pending":
    default:
      return "booking-drawer__status booking-drawer__status--payment-pending";
  }
}

function getActorLabel(actorType: TimelineActorType): string {
  switch (actorType) {
    case "Admin":
      return "Admin";

    case "Customer":
      return "Customer";

    case "Partner":
      return "Partner";

    case "System":
      return "System";

    default:
      return actorType;
  }
}

function buildTimelineItems(
  booking: AdminBooking,
): TimelineItem[] {
  if (!Array.isArray(booking.timeline)) {
    return [];
  }

  return booking.timeline.map((item) => ({
    id: item.id,
    title: getStatusLabel(item.status),
    description: (
      <>
        {item.note && <span>{item.note}</span>}

        {item.location && (
          <span className="booking-drawer__timeline-location">
            {" "}
            • {item.location}
          </span>
        )}
      </>
    ),
    time: formatDateTime(item.timestamp),
    actor: `${getActorLabel(item.actorType)}: ${item.actor}`,
  }));
}

export const BookingDrawer: React.FC<BookingDrawerProps> = ({
  booking,
  open,
  onClose,
  onAssignPartner,
  onStatusOverride,
  onCancelBooking,
}) => {
  const [showCancelForm, setShowCancelForm] = useState(false);
  const [cancelReason, setCancelReason] = useState("");
  const [cancelling, setCancelling] = useState(false);
  const [cancelError, setCancelError] = useState("");

  useEffect(() => {
    if (!open) {
      return;
    }

    const handleEscape = (event: KeyboardEvent) => {
      if (event.key === "Escape" && !cancelling) {
        onClose();
      }
    };

    document.addEventListener("keydown", handleEscape);

    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";

    return () => {
      document.removeEventListener("keydown", handleEscape);
      document.body.style.overflow = previousOverflow;
    };
  }, [open, onClose, cancelling]);

  useEffect(() => {
    if (!open || !booking) {
      setShowCancelForm(false);
      setCancelReason("");
      setCancelError("");
      setCancelling(false);
    }
  }, [open, booking]);

  if (!open || !booking) {
    return null;
  }

  const timelineItems = buildTimelineItems(booking);

  const isCancelled =
    booking.status === "cancelled_by_customer" ||
    booking.status === "cancelled_by_partner";

  const isCompleted =
    booking.status === "completed" ||
    booking.status === "rated";

  const handleOpenCancelForm = () => {
    setShowCancelForm(true);
    setCancelReason("");
    setCancelError("");
  };

  const handleCloseCancelForm = () => {
    if (cancelling) {
      return;
    }

    setShowCancelForm(false);
    setCancelReason("");
    setCancelError("");
  };

  const handleCancelBooking = async () => {
    const reason = cancelReason.trim();

    if (!reason) {
      setCancelError("Cancellation reason is required.");
      return;
    }

    setCancelling(true);
    setCancelError("");

    try {
      const updatedBooking =
        await adminBookingApi.cancelBooking(
          booking.id,
          {
            reason,
          },
        );

      setShowCancelForm(false);
      setCancelReason("");
      setCancelError("");

      onCancelBooking?.(updatedBooking);
    } catch (err) {
      const message =
        typeof err === "object" &&
        err !== null &&
        "message" in err &&
        typeof err.message === "string"
          ? err.message
          : "Unable to cancel booking. Please try again.";

      setCancelError(message);
    } finally {
      setCancelling(false);
    }
  };

  return createPortal(
    <>
      <style>{`
        .booking-drawer__backdrop {
          position: fixed;
          inset: 0;
          z-index: 1000;
          background: rgba(15, 23, 42, 0.45);
        }

        .booking-drawer {
          position: fixed;
          top: 0;
          right: 0;
          z-index: 1001;
          display: flex;
          flex-direction: column;
          width: min(560px, 100vw);
          height: 100vh;
          background: #ffffff;
          box-shadow: -8px 0 30px rgba(15, 23, 42, 0.15);
          animation: booking-drawer-slide-in 180ms ease-out;
        }

        @keyframes booking-drawer-slide-in {
          from {
            transform: translateX(100%);
          }

          to {
            transform: translateX(0);
          }
        }

        .booking-drawer__header {
          display: flex;
          align-items: flex-start;
          justify-content: space-between;
          gap: 16px;
          padding: 20px;
          border-bottom: 1px solid #e5e7eb;
          flex-shrink: 0;
        }

        .booking-drawer__header-content {
          min-width: 0;
        }

        .booking-drawer__eyebrow {
          margin: 0 0 4px;
          color: #6b7280;
          font-size: 12px;
          font-weight: 600;
          text-transform: uppercase;
          letter-spacing: 0.05em;
        }

        .booking-drawer__title {
          margin: 0;
          color: #111827;
          font-size: 20px;
          font-weight: 700;
          word-break: break-word;
        }

        .booking-drawer__header-status {
          margin-top: 10px;
        }

        .booking-drawer__close {
          display: inline-flex;
          align-items: center;
          justify-content: center;
          width: 36px;
          height: 36px;
          flex-shrink: 0;
          border: 1px solid #d1d5db;
          border-radius: 8px;
          background: #ffffff;
          color: #374151;
          font-size: 22px;
          line-height: 1;
          cursor: pointer;
        }

        .booking-drawer__close:hover {
          background: #f9fafb;
        }

        .booking-drawer__close:focus-visible,
        .booking-drawer__action:focus-visible,
        .booking-drawer__cancel-button:focus-visible,
        .booking-drawer__cancel-textarea:focus-visible {
          outline: 2px solid #2563eb;
          outline-offset: 2px;
        }

        .booking-drawer__body {
          flex: 1;
          overflow-y: auto;
          padding: 20px;
        }

        .booking-drawer__section {
          margin-bottom: 24px;
        }

        .booking-drawer__section:last-child {
          margin-bottom: 0;
        }

        .booking-drawer__section-title {
          margin: 0 0 12px;
          color: #111827;
          font-size: 15px;
          font-weight: 700;
        }

        .booking-drawer__grid {
          display: grid;
          grid-template-columns: repeat(2, minmax(0, 1fr));
          gap: 12px;
        }

        .booking-drawer__field {
          min-width: 0;
          padding: 12px;
          border: 1px solid #e5e7eb;
          border-radius: 8px;
          background: #f9fafb;
        }

        .booking-drawer__field--full {
          grid-column: 1 / -1;
        }

        .booking-drawer__label {
          display: block;
          margin-bottom: 4px;
          color: #6b7280;
          font-size: 11px;
          font-weight: 600;
          text-transform: uppercase;
          letter-spacing: 0.04em;
        }

        .booking-drawer__value {
          color: #111827;
          font-size: 14px;
          line-height: 1.45;
          word-break: break-word;
        }

        .booking-drawer__value--strong {
          font-weight: 600;
        }

        .booking-drawer__muted {
          color: #6b7280;
        }

        .booking-drawer__status {
          display: inline-flex;
          align-items: center;
          justify-content: center;
          padding: 5px 10px;
          border-radius: 999px;
          font-size: 12px;
          font-weight: 600;
          line-height: 1.2;
          white-space: nowrap;
        }

        .booking-drawer__status--completed {
          background: #dcfce7;
          color: #166534;
        }

        .booking-drawer__status--cancelled {
          background: #fee2e2;
          color: #991b1b;
        }

        .booking-drawer__status--progress {
          background: #dbeafe;
          color: #1d4ed8;
        }

        .booking-drawer__status--confirmed {
          background: #e0e7ff;
          color: #3730a3;
        }

        .booking-drawer__status--assigned {
          background: #fef3c7;
          color: #92400e;
        }

        .booking-drawer__status--pending {
          background: #f3f4f6;
          color: #374151;
        }

        .booking-drawer__status--paid {
          background: #dcfce7;
          color: #166534;
        }

        .booking-drawer__status--failed {
          background: #fee2e2;
          color: #991b1b;
        }

        .booking-drawer__status--refunded {
          background: #e0e7ff;
          color: #3730a3;
        }

        .booking-drawer__status--payment-pending {
          background: #f3f4f6;
          color: #374151;
        }

        .booking-drawer__price-list {
          display: flex;
          flex-direction: column;
          gap: 8px;
          padding: 14px;
          border: 1px solid #e5e7eb;
          border-radius: 8px;
          background: #f9fafb;
        }

        .booking-drawer__price-row {
          display: flex;
          justify-content: space-between;
          gap: 16px;
          color: #4b5563;
          font-size: 14px;
        }

        .booking-drawer__price-row--discount {
          color: #15803d;
        }

        .booking-drawer__price-row--total {
          margin-top: 4px;
          padding-top: 12px;
          border-top: 1px solid #d1d5db;
          color: #111827;
          font-size: 16px;
          font-weight: 700;
        }

        .booking-drawer__timeline-location {
          color: #6b7280;
        }

        .booking-drawer__footer {
          display: flex;
          flex-wrap: wrap;
          gap: 8px;
          padding: 16px 20px;
          border-top: 1px solid #e5e7eb;
          background: #ffffff;
          flex-shrink: 0;
        }

        .booking-drawer__action {
          min-height: 40px;
          padding: 9px 14px;
          border: 1px solid #d1d5db;
          border-radius: 7px;
          background: #ffffff;
          color: #374151;
          font-size: 13px;
          font-weight: 600;
          cursor: pointer;
        }

        .booking-drawer__action:hover {
          background: #f9fafb;
        }

        .booking-drawer__action--primary {
          border-color: #2563eb;
          background: #2563eb;
          color: #ffffff;
        }

        .booking-drawer__action--primary:hover {
          background: #1d4ed8;
        }

        .booking-drawer__action--danger {
          border-color: #dc2626;
          color: #b91c1c;
        }

        .booking-drawer__action--danger:hover {
          background: #fef2f2;
        }

        .booking-drawer__empty {
          padding: 16px;
          border: 1px dashed #d1d5db;
          border-radius: 8px;
          color: #6b7280;
          font-size: 14px;
          text-align: center;
        }

        .booking-drawer__cancel-panel {
          margin-top: 20px;
          padding: 16px;
          border: 1px solid #fecaca;
          border-radius: 10px;
          background: #fef2f2;
        }

        .booking-drawer__cancel-title {
          margin: 0 0 6px;
          color: #991b1b;
          font-size: 16px;
          font-weight: 700;
        }

        .booking-drawer__cancel-description {
          margin: 0 0 14px;
          color: #7f1d1d;
          font-size: 13px;
          line-height: 1.5;
        }

        .booking-drawer__cancel-label {
          display: block;
          margin-bottom: 6px;
          color: #374151;
          font-size: 13px;
          font-weight: 600;
        }

        .booking-drawer__cancel-required {
          color: #dc2626;
        }

        .booking-drawer__cancel-textarea {
          width: 100%;
          min-height: 100px;
          box-sizing: border-box;
          padding: 10px 12px;
          border: 1px solid #d1d5db;
          border-radius: 8px;
          background: #ffffff;
          color: #111827;
          font: inherit;
          font-size: 14px;
          line-height: 1.5;
          resize: vertical;
        }

        .booking-drawer__cancel-textarea--error {
          border-color: #dc2626;
        }

        .booking-drawer__cancel-help {
          margin: 6px 0 0;
          color: #6b7280;
          font-size: 12px;
        }

        .booking-drawer__cancel-error {
          margin: 7px 0 0;
          color: #b91c1c;
          font-size: 12px;
          line-height: 1.4;
        }

        .booking-drawer__cancel-actions {
          display: flex;
          justify-content: flex-end;
          gap: 10px;
          margin-top: 14px;
        }

        .booking-drawer__cancel-button {
          min-height: 38px;
          padding: 8px 14px;
          border-radius: 8px;
          font: inherit;
          font-size: 13px;
          font-weight: 600;
          cursor: pointer;
        }

        .booking-drawer__cancel-button--secondary {
          border: 1px solid #d1d5db;
          background: #ffffff;
          color: #374151;
        }

        .booking-drawer__cancel-button--secondary:hover:not(:disabled) {
          background: #f9fafb;
        }

        .booking-drawer__cancel-button--danger {
          border: 1px solid #dc2626;
          background: #dc2626;
          color: #ffffff;
        }

        .booking-drawer__cancel-button--danger:hover:not(:disabled) {
          background: #b91c1c;
        }

        .booking-drawer__cancel-button:disabled {
          cursor: not-allowed;
          opacity: 0.55;
        }

        @media (max-width: 560px) {
          .booking-drawer {
            width: 100vw;
          }

          .booking-drawer__header {
            padding: 16px;
          }

          .booking-drawer__body {
            padding: 16px;
          }

          .booking-drawer__footer {
            padding: 12px 16px;
          }

          .booking-drawer__grid {
            grid-template-columns: 1fr;
          }

          .booking-drawer__field--full {
            grid-column: auto;
          }

          .booking-drawer__action {
            flex: 1 1 100%;
          }

          .booking-drawer__cancel-actions {
            flex-direction: column;
          }

          .booking-drawer__cancel-button {
            width: 100%;
          }
        }

        @media (prefers-reduced-motion: reduce) {
          .booking-drawer {
            animation: none;
          }
        }
      `}</style>

      <div
        className="booking-drawer__backdrop"
        onClick={() => {
          if (!showCancelForm && !cancelling) {
            onClose();
          }
        }}
        aria-hidden="true"
      />

      <aside
        className="booking-drawer"
        role="dialog"
        aria-modal="true"
        aria-labelledby="booking-drawer-title"
      >
        <header className="booking-drawer__header">
          <div className="booking-drawer__header-content">
            <p className="booking-drawer__eyebrow">
              Booking Details
            </p>

            <h2
              id="booking-drawer-title"
              className="booking-drawer__title"
            >
              {booking.id}
            </h2>

            <div className="booking-drawer__header-status">
              <span className={getStatusClass(booking.status)}>
                {getStatusLabel(booking.status)}
              </span>
            </div>
          </div>

          <button
            type="button"
            className="booking-drawer__close"
            onClick={onClose}
            disabled={cancelling}
            aria-label="Close booking details"
          >
            ×
          </button>
        </header>

        <div className="booking-drawer__body">
          {/* Customer */}
          <section className="booking-drawer__section">
            <h3 className="booking-drawer__section-title">
              Customer
            </h3>

            <div className="booking-drawer__grid">
              <div className="booking-drawer__field">
                <span className="booking-drawer__label">
                  Name
                </span>

                <div className="booking-drawer__value booking-drawer__value--strong">
                  {booking.customer.name}
                </div>
              </div>

              <div className="booking-drawer__field">
                <span className="booking-drawer__label">
                  Phone
                </span>

                <div className="booking-drawer__value">
                  {booking.customer.phone}
                </div>
              </div>

              <div className="booking-drawer__field booking-drawer__field--full">
                <span className="booking-drawer__label">
                  Email
                </span>

                <div className="booking-drawer__value">
                  {booking.customer.email}
                </div>
              </div>
            </div>
          </section>

          {/* Partner */}
          <section className="booking-drawer__section">
            <h3 className="booking-drawer__section-title">
              Partner
            </h3>

            {booking.partner ? (
              <div className="booking-drawer__grid">
                <div className="booking-drawer__field">
                  <span className="booking-drawer__label">
                    Name
                  </span>

                  <div className="booking-drawer__value booking-drawer__value--strong">
                    {booking.partner.name}
                  </div>
                </div>

                <div className="booking-drawer__field">
                  <span className="booking-drawer__label">
                    Category
                  </span>

                  <div className="booking-drawer__value">
                    {booking.partner.category}
                  </div>
                </div>

                <div className="booking-drawer__field">
                  <span className="booking-drawer__label">
                    Phone
                  </span>

                  <div className="booking-drawer__value">
                    {booking.partner.phone}
                  </div>
                </div>

                <div className="booking-drawer__field">
                  <span className="booking-drawer__label">
                    City
                  </span>

                  <div className="booking-drawer__value">
                    {booking.partner.city}
                  </div>
                </div>

                <div className="booking-drawer__field booking-drawer__field--full">
                  <span className="booking-drawer__label">
                    Email
                  </span>

                  <div className="booking-drawer__value">
                    {booking.partner.email}
                  </div>
                </div>
              </div>
            ) : (
              <div className="booking-drawer__empty">
                No partner is currently assigned.
              </div>
            )}
          </section>

          {/* Service */}
          <section className="booking-drawer__section">
            <h3 className="booking-drawer__section-title">
              Service
            </h3>

            <div className="booking-drawer__grid">
              <div className="booking-drawer__field">
                <span className="booking-drawer__label">
                  Service
                </span>

                <div className="booking-drawer__value booking-drawer__value--strong">
                  {booking.service.name}
                </div>
              </div>

              <div className="booking-drawer__field">
                <span className="booking-drawer__label">
                  Category
                </span>

                <div className="booking-drawer__value">
                  {booking.service.category}
                </div>
              </div>

              <div className="booking-drawer__field">
                <span className="booking-drawer__label">
                  Duration
                </span>

                <div className="booking-drawer__value">
                  {booking.service.durationMinutes} minutes
                </div>
              </div>
            </div>
          </section>

          {/* Address */}
          <section className="booking-drawer__section">
            <h3 className="booking-drawer__section-title">
              Address
            </h3>

            <div className="booking-drawer__grid">
              <div className="booking-drawer__field booking-drawer__field--full">
                <span className="booking-drawer__label">
                  Address
                </span>

                <div className="booking-drawer__value">
                  {booking.address.line1}

                  {booking.address.line2 && (
                    <>
                      <br />
                      {booking.address.line2}
                    </>
                  )}
                </div>
              </div>

              <div className="booking-drawer__field">
                <span className="booking-drawer__label">
                  Area
                </span>

                <div className="booking-drawer__value">
                  {booking.address.area}
                </div>
              </div>

              <div className="booking-drawer__field">
                <span className="booking-drawer__label">
                  City
                </span>

                <div className="booking-drawer__value">
                  {booking.address.city}
                </div>
              </div>

              <div className="booking-drawer__field">
                <span className="booking-drawer__label">
                  State
                </span>

                <div className="booking-drawer__value">
                  {booking.address.state}
                </div>
              </div>

              <div className="booking-drawer__field">
                <span className="booking-drawer__label">
                  Pincode
                </span>

                <div className="booking-drawer__value">
                  {booking.address.pincode}
                </div>
              </div>
            </div>
          </section>

          {/* Schedule */}
          <section className="booking-drawer__section">
            <h3 className="booking-drawer__section-title">
              Schedule
            </h3>

            <div className="booking-drawer__grid">
              <div className="booking-drawer__field">
                <span className="booking-drawer__label">
                  Date
                </span>

                <div className="booking-drawer__value booking-drawer__value--strong">
                  {formatDate(booking.slot.date)}
                </div>
              </div>

              <div className="booking-drawer__field">
                <span className="booking-drawer__label">
                  Time
                </span>

                <div className="booking-drawer__value booking-drawer__value--strong">
                  {booking.slot.startTime} - {booking.slot.endTime}
                </div>
              </div>
            </div>
          </section>

          {/* Pricing */}
          <section className="booking-drawer__section">
            <h3 className="booking-drawer__section-title">
              Pricing
            </h3>

            <div className="booking-drawer__price-list">
              <div className="booking-drawer__price-row">
                <span>Base amount</span>

                <span>
                  {formatAmount(booking.pricing.baseAmount)}
                </span>
              </div>

              <div className="booking-drawer__price-row">
                <span>Tax</span>

                <span>
                  {formatAmount(booking.pricing.tax)}
                </span>
              </div>

              <div className="booking-drawer__price-row booking-drawer__price-row--discount">
                <span>Discount</span>

                <span>
                  -{formatAmount(booking.pricing.discount)}
                </span>
              </div>

              <div className="booking-drawer__price-row booking-drawer__price-row--total">
                <span>Total</span>

                <span>
                  {formatAmount(booking.pricing.totalAmount)}
                </span>
              </div>
            </div>
          </section>

          {/* Payment */}
          <section className="booking-drawer__section">
            <h3 className="booking-drawer__section-title">
              Payment
            </h3>

            <div className="booking-drawer__grid">
              <div className="booking-drawer__field">
                <span className="booking-drawer__label">
                  Payment ID
                </span>

                <div className="booking-drawer__value">
                  {booking.payment.paymentId || "-"}
                </div>
              </div>

              <div className="booking-drawer__field">
                <span className="booking-drawer__label">
                  Method
                </span>

                <div className="booking-drawer__value">
                  {booking.payment.method || "-"}
                </div>
              </div>

              <div className="booking-drawer__field">
                <span className="booking-drawer__label">
                  Amount
                </span>

                <div className="booking-drawer__value booking-drawer__value--strong">
                  {formatAmount(booking.payment.amount)}
                </div>
              </div>

              <div className="booking-drawer__field">
                <span className="booking-drawer__label">
                  Status
                </span>

                <div className="booking-drawer__value">
                  <span
                    className={getPaymentClass(
                      booking.payment.status,
                    )}
                  >
                    {booking.payment.status}
                  </span>
                </div>
              </div>

              {booking.payment.paidAt && (
                <div className="booking-drawer__field booking-drawer__field--full">
                  <span className="booking-drawer__label">
                    Paid At
                  </span>

                  <div className="booking-drawer__value">
                    {formatDateTime(booking.payment.paidAt)}
                  </div>
                </div>
              )}
            </div>
          </section>

          {/* Booking metadata */}
          <section className="booking-drawer__section">
            <h3 className="booking-drawer__section-title">
              Booking Information
            </h3>

            <div className="booking-drawer__grid">
              <div className="booking-drawer__field">
                <span className="booking-drawer__label">
                  Booking ID
                </span>

                <div className="booking-drawer__value">
                  {booking.id}
                </div>
              </div>

              <div className="booking-drawer__field">
                <span className="booking-drawer__label">
                  City
                </span>

                <div className="booking-drawer__value">
                  {booking.city}
                </div>
              </div>

              <div className="booking-drawer__field">
                <span className="booking-drawer__label">
                  Created
                </span>

                <div className="booking-drawer__value">
                  {formatDateTime(booking.createdAt)}
                </div>
              </div>

              <div className="booking-drawer__field">
                <span className="booking-drawer__label">
                  Updated
                </span>

                <div className="booking-drawer__value">
                  {formatDateTime(booking.updatedAt)}
                </div>
              </div>
            </div>
          </section>

          {/* Timeline */}
          <section className="booking-drawer__section">
            <h3 className="booking-drawer__section-title">
              Timeline
            </h3>

            <Timeline
              items={timelineItems}
              emptyMessage="No booking activity yet."
            />
          </section>

          {/* Cancellation form */}
          {showCancelForm && !isCancelled && !isCompleted && (
            <section
              className="booking-drawer__cancel-panel"
              aria-labelledby="booking-cancel-title"
            >
              <h3
                id="booking-cancel-title"
                className="booking-drawer__cancel-title"
              >
                Cancel booking
              </h3>

              <p className="booking-drawer__cancel-description">
                This action will cancel booking {booking.id}.
                A cancellation reason is required.
              </p>

              <label
                htmlFor="booking-cancel-reason"
                className="booking-drawer__cancel-label"
              >
                Cancellation reason{" "}
                <span
                  className="booking-drawer__cancel-required"
                  aria-hidden="true"
                >
                  *
                </span>
              </label>

              <textarea
                id="booking-cancel-reason"
                className={[
                  "booking-drawer__cancel-textarea",
                  cancelError
                    ? "booking-drawer__cancel-textarea--error"
                    : "",
                ]
                  .filter(Boolean)
                  .join(" ")}
                value={cancelReason}
                onChange={(event) => {
                  setCancelReason(event.target.value);
                  setCancelError("");
                }}
                placeholder="Enter the reason for cancelling this booking"
                disabled={cancelling}
                aria-required="true"
                aria-invalid={Boolean(cancelError)}
              />

              {!cancelError && (
                <p className="booking-drawer__cancel-help">
                  The reason will be recorded with the cancellation
                  request.
                </p>
              )}

              {cancelError && (
                <p
                  className="booking-drawer__cancel-error"
                  role="alert"
                >
                  {cancelError}
                </p>
              )}

              <div className="booking-drawer__cancel-actions">
                <button
                  type="button"
                  className="booking-drawer__cancel-button booking-drawer__cancel-button--secondary"
                  onClick={handleCloseCancelForm}
                  disabled={cancelling}
                >
                  Keep booking
                </button>

                <button
                  type="button"
                  className="booking-drawer__cancel-button booking-drawer__cancel-button--danger"
                  onClick={handleCancelBooking}
                  disabled={
                    cancelling || !cancelReason.trim()
                  }
                >
                  {cancelling
                    ? "Cancelling..."
                    : "Confirm cancellation"}
                </button>
              </div>
            </section>
          )}
        </div>

        {/* Actions */}
        <footer className="booking-drawer__footer">
          {!isCancelled &&
            !isCompleted &&
            onAssignPartner && (
              <button
                type="button"
                className="booking-drawer__action booking-drawer__action--primary"
                onClick={() => onAssignPartner(booking)}
                disabled={cancelling}
              >
                {booking.partner
                  ? "Reassign Partner"
                  : "Assign Partner"}
              </button>
            )}

          {!isCancelled && onStatusOverride && (
            <button
              type="button"
              className="booking-drawer__action"
              onClick={() => onStatusOverride(booking)}
              disabled={cancelling}
            >
              Override Status
            </button>
          )}

          {!isCancelled && !isCompleted && (
            <button
              type="button"
              className="booking-drawer__action booking-drawer__action--danger"
              onClick={handleOpenCancelForm}
              disabled={cancelling || showCancelForm}
            >
              Cancel Booking
            </button>
          )}
        </footer>
      </aside>
    </>,
    document.body,
  );
};

export default BookingDrawer;