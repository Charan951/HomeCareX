import React, { useEffect, useState } from "react";

import { adminBookingApi } from "@/services/adminBookingApi";
import type {
  AdminBooking,
  BookingStatus,
} from "@/types/adminBooking";

interface StatusOverrideDialogProps {
  booking: AdminBooking | null;
  open: boolean;
  onClose: () => void;
  onUpdated?: (booking: AdminBooking) => void;
}

const BOOKING_STATUS_OPTIONS: Array<{
  value: BookingStatus;
  label: string;
}> = [
  { value: "created", label: "Pending" },
  {
    value: "searching_for_partner",
    label: "Searching for Partner",
  },
  { value: "assigned", label: "Assigned" },
  { value: "en_route", label: "En Route" },
  { value: "arrived", label: "Arrived" },
  { value: "in_progress", label: "In Progress" },
  { value: "completed", label: "Completed" },
  { value: "rated", label: "Rated" },
  {
    value: "cancelled_by_customer",
    label: "Cancelled by Customer",
  },
  {
    value: "cancelled_by_partner",
    label: "Cancelled by Partner",
  },
  { value: "no_show", label: "No Show" },
  { value: "disputed", label: "Disputed" },
];

function getStatusLabel(status: BookingStatus): string {
  return (
    BOOKING_STATUS_OPTIONS.find(
      (option) => option.value === status,
    )?.label ?? status
  );
}

export const StatusOverrideDialog: React.FC<
  StatusOverrideDialogProps
> = ({
  booking,
  open,
  onClose,
  onUpdated,
}) => {
  const [status, setStatus] =
    useState<BookingStatus>("created");
  const [reason, setReason] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    if (!open || !booking) {
      setReason("");
      setSubmitting(false);
      setError("");
      return;
    }

    setStatus(booking.status);
    setReason("");
    setError("");
  }, [open, booking]);

  useEffect(() => {
    if (!open) {
      return;
    }

    const handleEscape = (event: KeyboardEvent) => {
      if (event.key === "Escape" && !submitting) {
        onClose();
      }
    };

    document.addEventListener("keydown", handleEscape);

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
  }, [open, onClose, submitting]);

  if (!open || !booking) {
    return null;
  }

  const trimmedReason = reason.trim();

  const reasonError =
    reason.length > 0 &&
    trimmedReason.length === 0
      ? "Reason cannot be empty."
      : "";

  const canSubmit =
    !submitting &&
    trimmedReason.length > 0 &&
    status !== booking.status;

  const handleSubmit = async () => {
    if (!trimmedReason) {
      setError(
        "A reason is required for a status override.",
      );
      return;
    }

    if (status === booking.status) {
      setError(
        "Please select a different status before submitting.",
      );
      return;
    }

    setSubmitting(true);
    setError("");

    try {
      const updatedBooking =
        await adminBookingApi.overrideStatus(
          booking.id,
          {
            status,
            reason: trimmedReason,
          },
        );

      onUpdated?.(updatedBooking);
      onClose();
    } catch (err) {
      const message =
        typeof err === "object" &&
        err !== null &&
        "message" in err &&
        typeof err.message === "string"
          ? err.message
          : "Unable to update booking status. Please try again.";

      setError(message);
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <>
      <style>{`
        .status-override-dialog__backdrop {
          position: fixed;
          inset: 0;
          z-index: 1200;
          display: flex;
          align-items: center;
          justify-content: center;
          padding: 20px;
          background: rgba(15, 23, 42, 0.55);
        }

        .status-override-dialog {
          width: min(520px, 100%);
          max-height: calc(100vh - 40px);
          overflow-y: auto;
          background: #ffffff;
          border-radius: 12px;
          box-shadow: 0 24px 70px rgba(15, 23, 42, 0.25);
        }

        .status-override-dialog__header {
          display: flex;
          align-items: flex-start;
          justify-content: space-between;
          gap: 16px;
          padding: 20px 22px;
          border-bottom: 1px solid #e5e7eb;
        }

        .status-override-dialog__title {
          margin: 0;
          color: #111827;
          font-size: 18px;
          font-weight: 700;
        }

        .status-override-dialog__subtitle {
          margin: 5px 0 0;
          color: #6b7280;
          font-size: 13px;
        }

        .status-override-dialog__close {
          width: 36px;
          height: 36px;
          flex: 0 0 auto;
          border: 1px solid #e5e7eb;
          border-radius: 8px;
          background: #ffffff;
          color: #374151;
          font-size: 20px;
          line-height: 1;
          cursor: pointer;
        }

        .status-override-dialog__close:hover {
          background: #f9fafb;
        }

        .status-override-dialog__body {
          padding: 22px;
        }

        .status-override-dialog__field {
          margin-bottom: 18px;
        }

        .status-override-dialog__label {
          display: block;
          margin-bottom: 7px;
          color: #374151;
          font-size: 13px;
          font-weight: 600;
        }

        .status-override-dialog__required {
          color: #dc2626;
        }

        .status-override-dialog__current {
          display: inline-flex;
          align-items: center;
          min-height: 38px;
          padding: 8px 12px;
          border: 1px solid #e5e7eb;
          border-radius: 8px;
          background: #f8fafc;
          color: #374151;
          font-size: 14px;
          font-weight: 600;
        }

        .status-override-dialog__select,
        .status-override-dialog__textarea {
          width: 100%;
          box-sizing: border-box;
          border: 1px solid #d1d5db;
          border-radius: 8px;
          background: #ffffff;
          color: #111827;
          font: inherit;
          font-size: 14px;
        }

        .status-override-dialog__select {
          min-height: 42px;
          padding: 9px 12px;
        }

        .status-override-dialog__textarea {
          min-height: 110px;
          padding: 10px 12px;
          resize: vertical;
          line-height: 1.5;
        }

        .status-override-dialog__select:focus-visible,
        .status-override-dialog__textarea:focus-visible,
        .status-override-dialog__close:focus-visible,
        .status-override-dialog__button:focus-visible {
          outline: 2px solid #2563eb;
          outline-offset: 2px;
        }

        .status-override-dialog__textarea--error {
          border-color: #dc2626;
        }

        .status-override-dialog__help {
          margin: 6px 0 0;
          color: #6b7280;
          font-size: 12px;
          line-height: 1.4;
        }

        .status-override-dialog__field-error {
          margin: 6px 0 0;
          color: #dc2626;
          font-size: 12px;
        }

        .status-override-dialog__warning {
          margin-top: 4px;
          padding: 11px 12px;
          border-radius: 8px;
          background: #fff7ed;
          color: #9a3412;
          font-size: 13px;
          line-height: 1.45;
        }

        .status-override-dialog__error {
          margin-top: 16px;
          padding: 10px 12px;
          border: 1px solid #fecaca;
          border-radius: 8px;
          background: #fef2f2;
          color: #991b1b;
          font-size: 13px;
          line-height: 1.4;
        }

        .status-override-dialog__footer {
          display: flex;
          justify-content: flex-end;
          gap: 10px;
          padding: 16px 22px;
          border-top: 1px solid #e5e7eb;
        }

        .status-override-dialog__button {
          min-height: 40px;
          padding: 9px 16px;
          border-radius: 8px;
          font: inherit;
          font-size: 14px;
          font-weight: 600;
          cursor: pointer;
        }

        .status-override-dialog__button--secondary {
          border: 1px solid #d1d5db;
          background: #ffffff;
          color: #374151;
        }

        .status-override-dialog__button--primary {
          border: 1px solid #2563eb;
          background: #2563eb;
          color: #ffffff;
        }

        .status-override-dialog__button--primary:hover:not(:disabled) {
          background: #1d4ed8;
        }

        .status-override-dialog__button:disabled {
          cursor: not-allowed;
          opacity: 0.55;
        }

        @media (max-width: 600px) {
          .status-override-dialog__backdrop {
            align-items: flex-end;
            padding: 0;
          }

          .status-override-dialog {
            width: 100%;
            max-height: 92vh;
            border-radius: 12px 12px 0 0;
          }

          .status-override-dialog__header,
          .status-override-dialog__body,
          .status-override-dialog__footer {
            padding-left: 16px;
            padding-right: 16px;
          }

          .status-override-dialog__footer {
            flex-direction: column-reverse;
          }

          .status-override-dialog__button {
            width: 100%;
          }
        }
      `}</style>

      <div
        className="status-override-dialog__backdrop"
        role="presentation"
        onMouseDown={(event) => {
          if (
            event.target === event.currentTarget &&
            !submitting
          ) {
            onClose();
          }
        }}
      >
        <section
          className="status-override-dialog"
          role="dialog"
          aria-modal="true"
          aria-labelledby="status-override-dialog-title"
        >
          <header className="status-override-dialog__header">
            <div>
              <h2
                id="status-override-dialog-title"
                className="status-override-dialog__title"
              >
                Override booking status
              </h2>

              <p className="status-override-dialog__subtitle">
                Booking {booking.id}
              </p>
            </div>

            <button
              type="button"
              className="status-override-dialog__close"
              onClick={onClose}
              disabled={submitting}
              aria-label="Close status override dialog"
            >
              ×
            </button>
          </header>

          <div className="status-override-dialog__body">
            <div className="status-override-dialog__field">
              <label className="status-override-dialog__label">
                Current status
              </label>

              <div
                className="status-override-dialog__current"
                aria-label={`Current status: ${getStatusLabel(
                  booking.status,
                )}`}
              >
                {getStatusLabel(booking.status)}
              </div>
            </div>

            <div className="status-override-dialog__field">
              <label
                htmlFor="booking-new-status"
                className="status-override-dialog__label"
              >
                New status{" "}
                <span
                  className="status-override-dialog__required"
                  aria-hidden="true"
                >
                  *
                </span>
              </label>

              <select
                id="booking-new-status"
                className="status-override-dialog__select"
                value={status}
                onChange={(event) =>
                  setStatus(
                    event.target.value as BookingStatus,
                  )
                }
                disabled={submitting}
              >
                {BOOKING_STATUS_OPTIONS.map((option) => (
                  <option
                    key={option.value}
                    value={option.value}
                  >
                    {option.label}
                    {option.value === booking.status
                      ? " (current)"
                      : ""}
                  </option>
                ))}
              </select>
            </div>

            <div className="status-override-dialog__field">
              <label
                htmlFor="booking-status-reason"
                className="status-override-dialog__label"
              >
                Reason{" "}
                <span
                  className="status-override-dialog__required"
                  aria-hidden="true"
                >
                  *
                </span>
              </label>

              <textarea
                id="booking-status-reason"
                className={[
                  "status-override-dialog__textarea",
                  reasonError
                    ? "status-override-dialog__textarea--error"
                    : "",
                ]
                  .filter(Boolean)
                  .join(" ")}
                value={reason}
                onChange={(event) => {
                  setReason(event.target.value);
                  setError("");
                }}
                placeholder="Enter the reason for overriding this booking status"
                disabled={submitting}
                aria-required="true"
                aria-invalid={Boolean(reasonError)}
                aria-describedby="booking-status-reason-help"
              />

              {reasonError ? (
                <p className="status-override-dialog__field-error">
                  {reasonError}
                </p>
              ) : (
                <p
                  id="booking-status-reason-help"
                  className="status-override-dialog__help"
                >
                  A reason is required and will be sent with
                  the status override request.
                </p>
              )}
            </div>

            {status === booking.status && (
              <div className="status-override-dialog__warning">
                The selected status is already the current
                status. Select a different status to continue.
              </div>
            )}

            {error && (
              <div
                className="status-override-dialog__error"
                role="alert"
              >
                {error}
              </div>
            )}
          </div>

          <footer className="status-override-dialog__footer">
            <button
              type="button"
              className="status-override-dialog__button status-override-dialog__button--secondary"
              onClick={onClose}
              disabled={submitting}
            >
              Cancel
            </button>

            <button
              type="button"
              className="status-override-dialog__button status-override-dialog__button--primary"
              onClick={handleSubmit}
              disabled={!canSubmit}
            >
              {submitting
                ? "Updating..."
                : "Override status"}
            </button>
          </footer>
        </section>
      </div>
    </>
  );
};

export default StatusOverrideDialog;