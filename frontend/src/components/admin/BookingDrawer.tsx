import React, { useEffect, useState } from "react";

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
  if (!value) {
    return "-";
  }

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
  if (!value) {
    return "-";
  }

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
      return "booking-details__status booking-details__status--completed";

    case "cancelled_by_customer":
    case "cancelled_by_partner":
    case "no_show":
      return "booking-details__status booking-details__status--cancelled";

    case "in_progress":
    case "en_route":
    case "arrived":
      return "booking-details__status booking-details__status--progress";

    case "assigned":
      return "booking-details__status booking-details__status--assigned";

    case "searching_for_partner":
      return "booking-details__status booking-details__status--confirmed";

    case "disputed":
      return "booking-details__status booking-details__status--cancelled";

    case "created":
    default:
      return "booking-details__status booking-details__status--pending";
  }
}

function getPaymentClass(status: string): string {
  switch (status) {
    case "Paid":
      return "booking-details__status booking-details__status--paid";

    case "Failed":
      return "booking-details__status booking-details__status--failed";

    case "Refunded":
      return "booking-details__status booking-details__status--refunded";

    case "Pending":
    default:
      return "booking-details__status booking-details__status--payment-pending";
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
          <span className="booking-details__timeline-location">
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

  return (
    <>
      <style>{`
        .booking-details {
          position: fixed;
          inset: 0;
          z-index: 1000;
          width: 100%;
          height: 100vh;
          min-height: 100vh;
          overflow-y: auto;
          overflow-x: hidden;
          background: #f8fafc;
          color: #0f172a;
          box-sizing: border-box;
        }

        .booking-details *,
        .booking-details *::before,
        .booking-details *::after {
          box-sizing: border-box;
        }

        /* ---------------------------------------------------------
           Header
        --------------------------------------------------------- */

        .booking-details__header {
          position: sticky;
          top: 0;
          z-index: 20;
          width: 100%;
          border-bottom: 1px solid #e2e8f0;
          background: rgba(255, 255, 255, 0.96);
          backdrop-filter: blur(10px);
        }

        .booking-details__header-inner {
          width: 100%;
          max-width: 1600px;
          margin: 0 auto;
          padding: 18px 32px;
        }

        .booking-details__top-row {
          display: flex;
          align-items: center;
          justify-content: space-between;
          gap: 20px;
        }

        .booking-details__back-button {
          display: inline-flex;
          align-items: center;
          gap: 8px;
          min-height: 40px;
          padding: 8px 14px;
          border: 1px solid #dbe2ea;
          border-radius: 8px;
          background: #ffffff;
          color: #334155;
          font: inherit;
          font-size: 13px;
          font-weight: 600;
          cursor: pointer;
          transition:
            background-color 150ms ease,
            border-color 150ms ease,
            color 150ms ease;
        }

        .booking-details__back-button:hover {
          background: #f8fafc;
          border-color: #cbd5e1;
          color: #0f172a;
        }

        .booking-details__back-icon {
          font-size: 18px;
          line-height: 1;
        }

        .booking-details__header-actions {
          display: flex;
          align-items: center;
          gap: 10px;
        }

        .booking-details__header-close {
          display: inline-flex;
          align-items: center;
          justify-content: center;
          width: 40px;
          height: 40px;
          border: 1px solid #dbe2ea;
          border-radius: 8px;
          background: #ffffff;
          color: #475569;
          font-size: 22px;
          line-height: 1;
          cursor: pointer;
          transition:
            background-color 150ms ease,
            border-color 150ms ease;
        }

        .booking-details__header-close:hover {
          background: #f8fafc;
          border-color: #cbd5e1;
        }

        .booking-details__header-close:disabled {
          cursor: not-allowed;
          opacity: 0.55;
        }

        .booking-details__heading-row {
          display: flex;
          align-items: flex-end;
          justify-content: space-between;
          gap: 24px;
          margin-top: 22px;
        }

        .booking-details__eyebrow {
          margin: 0 0 6px;
          color: #64748b;
          font-size: 12px;
          font-weight: 700;
          line-height: 1.3;
          letter-spacing: 0.08em;
          text-transform: uppercase;
        }

        .booking-details__title {
          margin: 0;
          color: #0f172a;
          font-size: 28px;
          font-weight: 750;
          line-height: 1.2;
          word-break: break-word;
        }

        .booking-details__subtitle {
          margin: 7px 0 0;
          color: #64748b;
          font-size: 14px;
          line-height: 1.5;
        }

        .booking-details__heading-statuses {
          display: flex;
          align-items: center;
          flex-wrap: wrap;
          justify-content: flex-end;
          gap: 8px;
        }

        /* ---------------------------------------------------------
           Status
        --------------------------------------------------------- */

        .booking-details__status {
          display: inline-flex;
          align-items: center;
          justify-content: center;
          min-height: 28px;
          padding: 5px 11px;
          border-radius: 999px;
          font-size: 12px;
          font-weight: 700;
          line-height: 1.2;
          white-space: nowrap;
        }

        .booking-details__status--completed {
          background: #dcfce7;
          color: #166534;
        }

        .booking-details__status--cancelled {
          background: #fee2e2;
          color: #991b1b;
        }

        .booking-details__status--progress {
          background: #dbeafe;
          color: #1d4ed8;
        }

        .booking-details__status--confirmed {
          background: #e0e7ff;
          color: #3730a3;
        }

        .booking-details__status--assigned {
          background: #fef3c7;
          color: #92400e;
        }

        .booking-details__status--pending {
          background: #f1f5f9;
          color: #475569;
        }

        .booking-details__status--paid {
          background: #dcfce7;
          color: #166534;
        }

        .booking-details__status--failed {
          background: #fee2e2;
          color: #991b1b;
        }

        .booking-details__status--refunded {
          background: #e0e7ff;
          color: #3730a3;
        }

        .booking-details__status--payment-pending {
          background: #f1f5f9;
          color: #475569;
        }

        /* ---------------------------------------------------------
           Main
        --------------------------------------------------------- */

        .booking-details__main {
          width: 100%;
          max-width: 1600px;
          margin: 0 auto;
          padding: 28px 32px 120px;
        }

        /* ---------------------------------------------------------
           Summary
        --------------------------------------------------------- */

        .booking-details__summary {
          display: grid;
          grid-template-columns:
            minmax(0, 1.2fr)
            minmax(0, 1fr)
            minmax(0, 1fr)
            minmax(0, 0.9fr);
          gap: 16px;
          margin-bottom: 24px;
        }

        .booking-details__summary-card {
          min-width: 0;
          padding: 20px;
          border: 1px solid #e2e8f0;
          border-radius: 12px;
          background: #ffffff;
          box-shadow: 0 1px 2px rgba(15, 23, 42, 0.04);
        }

        .booking-details__summary-label {
          display: block;
          margin-bottom: 8px;
          color: #64748b;
          font-size: 11px;
          font-weight: 700;
          letter-spacing: 0.06em;
          text-transform: uppercase;
        }

        .booking-details__summary-value {
          color: #0f172a;
          font-size: 17px;
          font-weight: 700;
          line-height: 1.35;
          word-break: break-word;
        }

        .booking-details__summary-value--amount {
          font-size: 22px;
        }

        .booking-details__summary-description {
          margin-top: 5px;
          color: #64748b;
          font-size: 13px;
          line-height: 1.45;
        }

        /* ---------------------------------------------------------
           Content layout
        --------------------------------------------------------- */

        .booking-details__content {
          display: grid;
          grid-template-columns: minmax(0, 1.65fr) minmax(320px, 0.85fr);
          align-items: start;
          gap: 24px;
        }

        .booking-details__primary,
        .booking-details__secondary {
          min-width: 0;
        }

        .booking-details__section {
          margin-bottom: 20px;
          padding: 22px;
          border: 1px solid #e2e8f0;
          border-radius: 12px;
          background: #ffffff;
          box-shadow: 0 1px 2px rgba(15, 23, 42, 0.04);
        }

        .booking-details__section:last-child {
          margin-bottom: 0;
        }

        .booking-details__section-header {
          display: flex;
          align-items: center;
          justify-content: space-between;
          gap: 16px;
          margin-bottom: 18px;
        }

        .booking-details__section-title {
          margin: 0;
          color: #0f172a;
          font-size: 16px;
          font-weight: 700;
          line-height: 1.35;
        }

        .booking-details__section-subtitle {
          margin: 4px 0 0;
          color: #64748b;
          font-size: 12px;
          line-height: 1.4;
        }

        /* ---------------------------------------------------------
           Information grid
        --------------------------------------------------------- */

        .booking-details__grid {
          display: grid;
          grid-template-columns: repeat(2, minmax(0, 1fr));
          gap: 12px;
        }

        .booking-details__field {
          min-width: 0;
          padding: 14px;
          border: 1px solid #e2e8f0;
          border-radius: 9px;
          background: #f8fafc;
        }

        .booking-details__field--full {
          grid-column: 1 / -1;
        }

        .booking-details__label {
          display: block;
          margin-bottom: 6px;
          color: #64748b;
          font-size: 10px;
          font-weight: 700;
          line-height: 1.3;
          letter-spacing: 0.06em;
          text-transform: uppercase;
        }

        .booking-details__value {
          color: #1e293b;
          font-size: 14px;
          line-height: 1.5;
          word-break: break-word;
        }

        .booking-details__value--strong {
          color: #0f172a;
          font-weight: 700;
        }

        .booking-details__muted {
          color: #64748b;
        }

        /* ---------------------------------------------------------
           Partner
        --------------------------------------------------------- */

        .booking-details__partner-card {
          display: flex;
          align-items: center;
          gap: 14px;
          margin-bottom: 16px;
          padding: 16px;
          border: 1px solid #dbeafe;
          border-radius: 10px;
          background: #eff6ff;
        }

        .booking-details__partner-avatar {
          display: flex;
          align-items: center;
          justify-content: center;
          width: 46px;
          height: 46px;
          flex-shrink: 0;
          border-radius: 50%;
          background: #dbeafe;
          color: #1d4ed8;
          font-size: 17px;
          font-weight: 800;
        }

        .booking-details__partner-content {
          min-width: 0;
        }

        .booking-details__partner-name {
          margin: 0;
          color: #1e3a8a;
          font-size: 15px;
          font-weight: 700;
        }

        .booking-details__partner-meta {
          margin: 3px 0 0;
          color: #475569;
          font-size: 12px;
        }

        .booking-details__empty {
          display: flex;
          align-items: center;
          gap: 12px;
          padding: 16px;
          border: 1px dashed #cbd5e1;
          border-radius: 10px;
          background: #f8fafc;
          color: #64748b;
          font-size: 14px;
        }

        .booking-details__empty-icon {
          display: flex;
          align-items: center;
          justify-content: center;
          width: 34px;
          height: 34px;
          flex-shrink: 0;
          border-radius: 8px;
          background: #e2e8f0;
          color: #64748b;
          font-size: 16px;
        }

        /* ---------------------------------------------------------
           Pricing
        --------------------------------------------------------- */

        .booking-details__price-list {
          display: flex;
          flex-direction: column;
          gap: 11px;
        }

        .booking-details__price-row {
          display: flex;
          align-items: center;
          justify-content: space-between;
          gap: 20px;
          color: #475569;
          font-size: 14px;
        }

        .booking-details__price-row--discount {
          color: #15803d;
        }

        .booking-details__price-row--total {
          margin-top: 6px;
          padding-top: 14px;
          border-top: 1px solid #e2e8f0;
          color: #0f172a;
          font-size: 18px;
          font-weight: 800;
        }

        /* ---------------------------------------------------------
           Schedule card
        --------------------------------------------------------- */

        .booking-details__schedule {
          display: grid;
          grid-template-columns: 1fr 1fr;
          gap: 12px;
        }

        .booking-details__schedule-item {
          padding: 15px;
          border: 1px solid #e2e8f0;
          border-radius: 9px;
          background: #f8fafc;
        }

        .booking-details__schedule-icon {
          margin-bottom: 10px;
          font-size: 20px;
        }

        .booking-details__schedule-label {
          margin-bottom: 4px;
          color: #64748b;
          font-size: 10px;
          font-weight: 700;
          letter-spacing: 0.06em;
          text-transform: uppercase;
        }

        .booking-details__schedule-value {
          color: #0f172a;
          font-size: 14px;
          font-weight: 700;
          line-height: 1.4;
        }

        /* ---------------------------------------------------------
           Timeline
        --------------------------------------------------------- */

        .booking-details__timeline-location {
          color: #64748b;
        }

        /* ---------------------------------------------------------
           Cancellation
        --------------------------------------------------------- */

        .booking-details__cancel-panel {
          margin-bottom: 20px;
          padding: 20px;
          border: 1px solid #fecaca;
          border-radius: 12px;
          background: #fff7f7;
        }

        .booking-details__cancel-title {
          margin: 0 0 6px;
          color: #991b1b;
          font-size: 17px;
          font-weight: 750;
        }

        .booking-details__cancel-description {
          margin: 0 0 18px;
          color: #7f1d1d;
          font-size: 13px;
          line-height: 1.5;
        }

        .booking-details__cancel-label {
          display: block;
          margin-bottom: 7px;
          color: #334155;
          font-size: 13px;
          font-weight: 700;
        }

        .booking-details__cancel-required {
          color: #dc2626;
        }

        .booking-details__cancel-textarea {
          width: 100%;
          min-height: 110px;
          padding: 12px 14px;
          border: 1px solid #cbd5e1;
          border-radius: 9px;
          background: #ffffff;
          color: #0f172a;
          font: inherit;
          font-size: 14px;
          line-height: 1.5;
          resize: vertical;
        }

        .booking-details__cancel-textarea:hover {
          border-color: #94a3b8;
        }

        .booking-details__cancel-textarea:focus {
          border-color: #2563eb;
          outline: none;
          box-shadow: 0 0 0 3px rgba(37, 99, 235, 0.1);
        }

        .booking-details__cancel-textarea--error {
          border-color: #dc2626;
        }

        .booking-details__cancel-help {
          margin: 7px 0 0;
          color: #64748b;
          font-size: 12px;
        }

        .booking-details__cancel-error {
          margin: 7px 0 0;
          color: #b91c1c;
          font-size: 12px;
          line-height: 1.4;
        }

        .booking-details__cancel-actions {
          display: flex;
          justify-content: flex-end;
          gap: 10px;
          margin-top: 16px;
        }

        .booking-details__cancel-button {
          min-height: 40px;
          padding: 9px 16px;
          border-radius: 8px;
          font: inherit;
          font-size: 13px;
          font-weight: 700;
          cursor: pointer;
        }

        .booking-details__cancel-button--secondary {
          border: 1px solid #cbd5e1;
          background: #ffffff;
          color: #334155;
        }

        .booking-details__cancel-button--secondary:hover:not(:disabled) {
          background: #f8fafc;
        }

        .booking-details__cancel-button--danger {
          border: 1px solid #dc2626;
          background: #dc2626;
          color: #ffffff;
        }

        .booking-details__cancel-button--danger:hover:not(:disabled) {
          background: #b91c1c;
        }

        .booking-details__cancel-button:disabled {
          cursor: not-allowed;
          opacity: 0.55;
        }

        /* ---------------------------------------------------------
           Bottom actions
        --------------------------------------------------------- */

        .booking-details__footer {
          position: fixed;
          right: 0;
          bottom: 0;
          left: 0;
          z-index: 30;
          width: 100%;
          border-top: 1px solid #e2e8f0;
          background: rgba(255, 255, 255, 0.97);
          backdrop-filter: blur(10px);
          box-shadow: 0 -4px 16px rgba(15, 23, 42, 0.06);
        }

        .booking-details__footer-inner {
          display: flex;
          align-items: center;
          justify-content: flex-end;
          gap: 10px;
          width: 100%;
          max-width: 1600px;
          min-height: 72px;
          margin: 0 auto;
          padding: 12px 32px;
        }

        .booking-details__action {
          min-height: 42px;
          padding: 9px 16px;
          border: 1px solid #cbd5e1;
          border-radius: 8px;
          background: #ffffff;
          color: #334155;
          font: inherit;
          font-size: 13px;
          font-weight: 700;
          cursor: pointer;
          transition:
            background-color 150ms ease,
            border-color 150ms ease,
            color 150ms ease;
        }

        .booking-details__action:hover:not(:disabled) {
          background: #f8fafc;
          border-color: #94a3b8;
        }

        .booking-details__action--primary {
          border-color: #2563eb;
          background: #2563eb;
          color: #ffffff;
        }

        .booking-details__action--primary:hover:not(:disabled) {
          border-color: #1d4ed8;
          background: #1d4ed8;
        }

        .booking-details__action--danger {
          border-color: #fecaca;
          background: #ffffff;
          color: #b91c1c;
        }

        .booking-details__action--danger:hover:not(:disabled) {
          border-color: #fca5a5;
          background: #fef2f2;
        }

        .booking-details__action:disabled {
          cursor: not-allowed;
          opacity: 0.55;
        }

        /* ---------------------------------------------------------
           Focus
        --------------------------------------------------------- */

        .booking-details__back-button:focus-visible,
        .booking-details__header-close:focus-visible,
        .booking-details__action:focus-visible,
        .booking-details__cancel-button:focus-visible,
        .booking-details__cancel-textarea:focus-visible {
          outline: 2px solid #2563eb;
          outline-offset: 2px;
        }

        /* ---------------------------------------------------------
           Responsive - Tablet
        --------------------------------------------------------- */

        @media (max-width: 1100px) {
          .booking-details__header-inner,
          .booking-details__main {
            padding-left: 22px;
            padding-right: 22px;
          }

          .booking-details__summary {
            grid-template-columns: repeat(2, minmax(0, 1fr));
          }

          .booking-details__content {
            grid-template-columns: 1fr;
          }

          .booking-details__secondary {
            display: grid;
            grid-template-columns: repeat(2, minmax(0, 1fr));
            align-items: start;
            gap: 20px;
          }

          .booking-details__secondary .booking-details__section {
            margin-bottom: 0;
          }

          .booking-details__footer-inner {
            padding-left: 22px;
            padding-right: 22px;
          }
        }

        /* ---------------------------------------------------------
           Responsive - Mobile
        --------------------------------------------------------- */

        @media (max-width: 768px) {
          .booking-details__header-inner {
            padding: 14px 16px;
          }

          .booking-details__top-row {
            align-items: flex-start;
          }

          .booking-details__heading-row {
            align-items: flex-start;
            flex-direction: column;
            gap: 14px;
            margin-top: 18px;
          }

          .booking-details__heading-statuses {
            justify-content: flex-start;
          }

          .booking-details__title {
            font-size: 23px;
          }

          .booking-details__main {
            padding: 18px 16px 150px;
          }

          .booking-details__summary {
            grid-template-columns: 1fr;
            gap: 12px;
          }

          .booking-details__summary-card {
            padding: 16px;
          }

          .booking-details__section {
            padding: 18px;
          }

          .booking-details__secondary {
            display: block;
          }

          .booking-details__secondary .booking-details__section {
            margin-bottom: 20px;
          }

          .booking-details__grid {
            grid-template-columns: 1fr;
          }

          .booking-details__field--full {
            grid-column: auto;
          }

          .booking-details__schedule {
            grid-template-columns: 1fr;
          }

          .booking-details__footer-inner {
            align-items: stretch;
            justify-content: stretch;
            flex-wrap: wrap;
            min-height: auto;
            padding: 10px 16px;
          }

          .booking-details__action {
            flex: 1 1 100%;
          }
        }

        /* ---------------------------------------------------------
           Responsive - Small mobile
        --------------------------------------------------------- */

        @media (max-width: 480px) {
          .booking-details__header-inner {
            padding: 12px;
          }

          .booking-details__main {
            padding: 14px 12px 170px;
          }

          .booking-details__back-button {
            min-height: 38px;
            padding: 8px 11px;
          }

          .booking-details__header-close {
            width: 38px;
            height: 38px;
          }

          .booking-details__title {
            font-size: 21px;
          }

          .booking-details__subtitle {
            font-size: 12px;
          }

          .booking-details__section {
            padding: 15px;
            border-radius: 10px;
          }

          .booking-details__section-title {
            font-size: 15px;
          }

          .booking-details__field {
            padding: 12px;
          }

          .booking-details__cancel-actions {
            flex-direction: column;
          }

          .booking-details__cancel-button {
            width: 100%;
          }
        }

        /* ---------------------------------------------------------
           Reduced motion
        --------------------------------------------------------- */

        @media (prefers-reduced-motion: reduce) {
          .booking-details *,
          .booking-details *::before,
          .booking-details *::after {
            scroll-behavior: auto !important;
            transition: none !important;
          }
        }
      `}</style>

      <main
        className="booking-details"
        aria-labelledby="booking-details-title"
      >
        {/* =========================================================
            HEADER
        ========================================================= */}

        <header className="booking-details__header">
          <div className="booking-details__header-inner">
            <div className="booking-details__top-row">
              <button
                type="button"
                className="booking-details__back-button"
                onClick={onClose}
                disabled={cancelling}
                aria-label="Back to bookings"
              >
                <span
                  className="booking-details__back-icon"
                  aria-hidden="true"
                >
                  ←
                </span>

                <span>Back to Bookings</span>
              </button>

              <div className="booking-details__header-actions">
                <button
                  type="button"
                  className="booking-details__header-close"
                  onClick={onClose}
                  disabled={cancelling}
                  aria-label="Close booking details"
                >
                  ×
                </button>
              </div>
            </div>

            <div className="booking-details__heading-row">
              <div>
                <p className="booking-details__eyebrow">
                  Booking Details
                </p>

                <h1
                  id="booking-details-title"
                  className="booking-details__title"
                >
                  {booking.id}
                </h1>

                <p className="booking-details__subtitle">
                  {booking.service.name}
                  {" • "}
                  {booking.city}
                  {" • "}
                  Created {formatDateTime(booking.createdAt)}
                </p>
              </div>

              <div className="booking-details__heading-statuses">
                <span className={getStatusClass(booking.status)}>
                  {getStatusLabel(booking.status)}
                </span>

                <span
                  className={getPaymentClass(
                    booking.payment.status,
                  )}
                >
                  Payment {booking.payment.status}
                </span>
              </div>
            </div>
          </div>
        </header>

        {/* =========================================================
            MAIN CONTENT
        ========================================================= */}

        <div className="booking-details__main">
          {/* Summary cards */}

          <section
            className="booking-details__summary"
            aria-label="Booking summary"
          >
            <div className="booking-details__summary-card">
              <span className="booking-details__summary-label">
                Customer
              </span>

              <div className="booking-details__summary-value">
                {booking.customer.name}
              </div>

              <div className="booking-details__summary-description">
                {booking.customer.phone}
              </div>
            </div>

            <div className="booking-details__summary-card">
              <span className="booking-details__summary-label">
                Service
              </span>

              <div className="booking-details__summary-value">
                {booking.service.name}
              </div>

              <div className="booking-details__summary-description">
                {booking.service.category}
                {" • "}
                {booking.service.durationMinutes} minutes
              </div>
            </div>

            <div className="booking-details__summary-card">
              <span className="booking-details__summary-label">
                Scheduled
              </span>

              <div className="booking-details__summary-value">
                {formatDate(booking.slot.date)}
              </div>

              <div className="booking-details__summary-description">
                {booking.slot.startTime}
                {" - "}
                {booking.slot.endTime}
              </div>
            </div>

            <div className="booking-details__summary-card">
              <span className="booking-details__summary-label">
                Total Amount
              </span>

              <div className="booking-details__summary-value booking-details__summary-value--amount">
                {formatAmount(booking.pricing.totalAmount)}
              </div>

              <div className="booking-details__summary-description">
                {booking.payment.status}
              </div>
            </div>
          </section>

          <div className="booking-details__content">
            {/* =====================================================
                PRIMARY COLUMN
            ===================================================== */}

            <div className="booking-details__primary">
              {/* Customer */}

              <section className="booking-details__section">
                <div className="booking-details__section-header">
                  <div>
                    <h2 className="booking-details__section-title">
                      Customer
                    </h2>

                    <p className="booking-details__section-subtitle">
                      Customer information
                    </p>
                  </div>
                </div>

                <div className="booking-details__grid">
                  <div className="booking-details__field">
                    <span className="booking-details__label">
                      Name
                    </span>

                    <div className="booking-details__value booking-details__value--strong">
                      {booking.customer.name}
                    </div>
                  </div>

                  <div className="booking-details__field">
                    <span className="booking-details__label">
                      Phone
                    </span>

                    <div className="booking-details__value">
                      {booking.customer.phone}
                    </div>
                  </div>

                  <div className="booking-details__field booking-details__field--full">
                    <span className="booking-details__label">
                      Email
                    </span>

                    <div className="booking-details__value">
                      {booking.customer.email}
                    </div>
                  </div>
                </div>
              </section>

              {/* Partner */}

              <section className="booking-details__section">
                <div className="booking-details__section-header">
                  <div>
                    <h2 className="booking-details__section-title">
                      Partner
                    </h2>

                    <p className="booking-details__section-subtitle">
                      Assigned service partner
                    </p>
                  </div>
                </div>

                {booking.partner ? (
                  <>
                    <div className="booking-details__partner-card">
                      <div className="booking-details__partner-avatar">
                        {booking.partner.name
                          .charAt(0)
                          .toUpperCase()}
                      </div>

                      <div className="booking-details__partner-content">
                        <p className="booking-details__partner-name">
                          {booking.partner.name}
                        </p>

                        <p className="booking-details__partner-meta">
                          {booking.partner.category}
                          {" • "}
                          {booking.partner.city}
                        </p>
                      </div>
                    </div>

                    <div className="booking-details__grid">
                      <div className="booking-details__field">
                        <span className="booking-details__label">
                          Name
                        </span>

                        <div className="booking-details__value booking-details__value--strong">
                          {booking.partner.name}
                        </div>
                      </div>

                      <div className="booking-details__field">
                        <span className="booking-details__label">
                          Category
                        </span>

                        <div className="booking-details__value">
                          {booking.partner.category}
                        </div>
                      </div>

                      <div className="booking-details__field">
                        <span className="booking-details__label">
                          Phone
                        </span>

                        <div className="booking-details__value">
                          {booking.partner.phone}
                        </div>
                      </div>

                      <div className="booking-details__field">
                        <span className="booking-details__label">
                          City
                        </span>

                        <div className="booking-details__value">
                          {booking.partner.city}
                        </div>
                      </div>

                      <div className="booking-details__field booking-details__field--full">
                        <span className="booking-details__label">
                          Email
                        </span>

                        <div className="booking-details__value">
                          {booking.partner.email}
                        </div>
                      </div>
                    </div>
                  </>
                ) : (
                  <div className="booking-details__empty">
                    <div
                      className="booking-details__empty-icon"
                      aria-hidden="true"
                    >
                      !
                    </div>

                    <span>
                      No partner is currently assigned to
                      this booking.
                    </span>
                  </div>
                )}
              </section>

              {/* Service */}

              <section className="booking-details__section">
                <div className="booking-details__section-header">
                  <div>
                    <h2 className="booking-details__section-title">
                      Service
                    </h2>

                    <p className="booking-details__section-subtitle">
                      Requested service information
                    </p>
                  </div>
                </div>

                <div className="booking-details__grid">
                  <div className="booking-details__field">
                    <span className="booking-details__label">
                      Service
                    </span>

                    <div className="booking-details__value booking-details__value--strong">
                      {booking.service.name}
                    </div>
                  </div>

                  <div className="booking-details__field">
                    <span className="booking-details__label">
                      Category
                    </span>

                    <div className="booking-details__value">
                      {booking.service.category}
                    </div>
                  </div>

                  <div className="booking-details__field">
                    <span className="booking-details__label">
                      Duration
                    </span>

                    <div className="booking-details__value">
                      {booking.service.durationMinutes} minutes
                    </div>
                  </div>
                </div>
              </section>

              {/* Address */}

              <section className="booking-details__section">
                <div className="booking-details__section-header">
                  <div>
                    <h2 className="booking-details__section-title">
                      Service Address
                    </h2>

                    <p className="booking-details__section-subtitle">
                      Location where the service will be
                      performed
                    </p>
                  </div>
                </div>

                <div className="booking-details__grid">
                  <div className="booking-details__field booking-details__field--full">
                    <span className="booking-details__label">
                      Address
                    </span>

                    <div className="booking-details__value">
                      {booking.address.line1}

                      {booking.address.line2 && (
                        <>
                          <br />
                          {booking.address.line2}
                        </>
                      )}
                    </div>
                  </div>

                  <div className="booking-details__field">
                    <span className="booking-details__label">
                      Area
                    </span>

                    <div className="booking-details__value">
                      {booking.address.area}
                    </div>
                  </div>

                  <div className="booking-details__field">
                    <span className="booking-details__label">
                      City
                    </span>

                    <div className="booking-details__value">
                      {booking.address.city}
                    </div>
                  </div>

                  <div className="booking-details__field">
                    <span className="booking-details__label">
                      State
                    </span>

                    <div className="booking-details__value">
                      {booking.address.state}
                    </div>
                  </div>

                  <div className="booking-details__field">
                    <span className="booking-details__label">
                      Pincode
                    </span>

                    <div className="booking-details__value">
                      {booking.address.pincode}
                    </div>
                  </div>
                </div>
              </section>

              {/* Timeline */}

              <section className="booking-details__section">
                <div className="booking-details__section-header">
                  <div>
                    <h2 className="booking-details__section-title">
                      Booking Timeline
                    </h2>

                    <p className="booking-details__section-subtitle">
                      Complete activity history for this booking
                    </p>
                  </div>
                </div>

                <Timeline
                  items={timelineItems}
                  emptyMessage="No booking activity yet."
                />
              </section>

              {/* Cancellation */}

              {showCancelForm &&
                !isCancelled &&
                !isCompleted && (
                  <section
                    className="booking-details__cancel-panel"
                    aria-labelledby="booking-cancel-title"
                  >
                    <h2
                      id="booking-cancel-title"
                      className="booking-details__cancel-title"
                    >
                      Cancel Booking
                    </h2>

                    <p className="booking-details__cancel-description">
                      This action will cancel booking{" "}
                      {booking.id}. A cancellation reason is
                      required and will be recorded.
                    </p>

                    <label
                      htmlFor="booking-cancel-reason"
                      className="booking-details__cancel-label"
                    >
                      Cancellation reason{" "}
                      <span
                        className="booking-details__cancel-required"
                        aria-hidden="true"
                      >
                        *
                      </span>
                    </label>

                    <textarea
                      id="booking-cancel-reason"
                      className={[
                        "booking-details__cancel-textarea",
                        cancelError
                          ? "booking-details__cancel-textarea--error"
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
                      <p className="booking-details__cancel-help">
                        The reason will be recorded with the
                        cancellation request.
                      </p>
                    )}

                    {cancelError && (
                      <p
                        className="booking-details__cancel-error"
                        role="alert"
                      >
                        {cancelError}
                      </p>
                    )}

                    <div className="booking-details__cancel-actions">
                      <button
                        type="button"
                        className="booking-details__cancel-button booking-details__cancel-button--secondary"
                        onClick={handleCloseCancelForm}
                        disabled={cancelling}
                      >
                        Keep Booking
                      </button>

                      <button
                        type="button"
                        className="booking-details__cancel-button booking-details__cancel-button--danger"
                        onClick={handleCancelBooking}
                        disabled={
                          cancelling ||
                          !cancelReason.trim()
                        }
                      >
                        {cancelling
                          ? "Cancelling..."
                          : "Confirm Cancellation"}
                      </button>
                    </div>
                  </section>
                )}
            </div>

            {/* =====================================================
                SECONDARY COLUMN
            ===================================================== */}

            <aside className="booking-details__secondary">
              {/* Schedule */}

              <section className="booking-details__section">
                <div className="booking-details__section-header">
                  <div>
                    <h2 className="booking-details__section-title">
                      Schedule
                    </h2>

                    <p className="booking-details__section-subtitle">
                      Service appointment
                    </p>
                  </div>
                </div>

                <div className="booking-details__schedule">
                  <div className="booking-details__schedule-item">
                    <div
                      className="booking-details__schedule-icon"
                      aria-hidden="true"
                    >
                      📅
                    </div>

                    <div className="booking-details__schedule-label">
                      Date
                    </div>

                    <div className="booking-details__schedule-value">
                      {formatDate(booking.slot.date)}
                    </div>
                  </div>

                  <div className="booking-details__schedule-item">
                    <div
                      className="booking-details__schedule-icon"
                      aria-hidden="true"
                    >
                      🕐
                    </div>

                    <div className="booking-details__schedule-label">
                      Time
                    </div>

                    <div className="booking-details__schedule-value">
                      {booking.slot.startTime}
                      {" - "}
                      {booking.slot.endTime}
                    </div>
                  </div>
                </div>
              </section>

              {/* Pricing */}

              <section className="booking-details__section">
                <div className="booking-details__section-header">
                  <div>
                    <h2 className="booking-details__section-title">
                      Pricing
                    </h2>

                    <p className="booking-details__section-subtitle">
                      Booking amount breakdown
                    </p>
                  </div>
                </div>

                <div className="booking-details__price-list">
                  <div className="booking-details__price-row">
                    <span>Base amount</span>

                    <span>
                      {formatAmount(
                        booking.pricing.baseAmount,
                      )}
                    </span>
                  </div>

                  <div className="booking-details__price-row">
                    <span>Tax</span>

                    <span>
                      {formatAmount(booking.pricing.tax)}
                    </span>
                  </div>

                  <div className="booking-details__price-row booking-details__price-row--discount">
                    <span>Discount</span>

                    <span>
                      -{formatAmount(
                        booking.pricing.discount,
                      )}
                    </span>
                  </div>

                  <div className="booking-details__price-row booking-details__price-row--total">
                    <span>Total</span>

                    <span>
                      {formatAmount(
                        booking.pricing.totalAmount,
                      )}
                    </span>
                  </div>
                </div>
              </section>

              {/* Payment */}

              <section className="booking-details__section">
                <div className="booking-details__section-header">
                  <div>
                    <h2 className="booking-details__section-title">
                      Payment
                    </h2>

                    <p className="booking-details__section-subtitle">
                      Payment information
                    </p>
                  </div>

                  <span
                    className={getPaymentClass(
                      booking.payment.status,
                    )}
                  >
                    {booking.payment.status}
                  </span>
                </div>

                <div className="booking-details__grid">
                  <div className="booking-details__field booking-details__field--full">
                    <span className="booking-details__label">
                      Payment ID
                    </span>

                    <div className="booking-details__value">
                      {booking.payment.paymentId || "-"}
                    </div>
                  </div>

                  <div className="booking-details__field">
                    <span className="booking-details__label">
                      Method
                    </span>

                    <div className="booking-details__value">
                      {booking.payment.method || "-"}
                    </div>
                  </div>

                  <div className="booking-details__field">
                    <span className="booking-details__label">
                      Amount
                    </span>

                    <div className="booking-details__value booking-details__value--strong">
                      {formatAmount(
                        booking.payment.amount,
                      )}
                    </div>
                  </div>

                  {booking.payment.paidAt && (
                    <div className="booking-details__field booking-details__field--full">
                      <span className="booking-details__label">
                        Paid At
                      </span>

                      <div className="booking-details__value">
                        {formatDateTime(
                          booking.payment.paidAt,
                        )}
                      </div>
                    </div>
                  )}
                </div>
              </section>

              {/* Booking Information */}

              <section className="booking-details__section">
                <div className="booking-details__section-header">
                  <div>
                    <h2 className="booking-details__section-title">
                      Booking Information
                    </h2>

                    <p className="booking-details__section-subtitle">
                      System information
                    </p>
                  </div>
                </div>

                <div className="booking-details__grid">
                  <div className="booking-details__field booking-details__field--full">
                    <span className="booking-details__label">
                      Booking ID
                    </span>

                    <div className="booking-details__value booking-details__value--strong">
                      {booking.id}
                    </div>
                  </div>

                  <div className="booking-details__field">
                    <span className="booking-details__label">
                      City
                    </span>

                    <div className="booking-details__value">
                      {booking.city}
                    </div>
                  </div>

                  <div className="booking-details__field">
                    <span className="booking-details__label">
                      Status
                    </span>

                    <div className="booking-details__value">
                      <span
                        className={getStatusClass(
                          booking.status,
                        )}
                      >
                        {getStatusLabel(booking.status)}
                      </span>
                    </div>
                  </div>

                  <div className="booking-details__field">
                    <span className="booking-details__label">
                      Created
                    </span>

                    <div className="booking-details__value">
                      {formatDateTime(booking.createdAt)}
                    </div>
                  </div>

                  <div className="booking-details__field">
                    <span className="booking-details__label">
                      Updated
                    </span>

                    <div className="booking-details__value">
                      {formatDateTime(booking.updatedAt)}
                    </div>
                  </div>
                </div>
              </section>
            </aside>
          </div>
        </div>

        {/* =========================================================
            ACTION FOOTER
        ========================================================= */}

        <footer className="booking-details__footer">
          <div className="booking-details__footer-inner">
            {!isCancelled &&
              !isCompleted &&
              onAssignPartner && (
                <button
                  type="button"
                  className="booking-details__action booking-details__action--primary"
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
                className="booking-details__action"
                onClick={() => onStatusOverride(booking)}
                disabled={cancelling}
              >
                Override Status
              </button>
            )}

            {!isCancelled && !isCompleted && (
              <button
                type="button"
                className="booking-details__action booking-details__action--danger"
                onClick={handleOpenCancelForm}
                disabled={
                  cancelling || showCancelForm
                }
              >
                Cancel Booking
              </button>
            )}
          </div>
        </footer>
      </main>
    </>
  );
};

export default BookingDrawer;