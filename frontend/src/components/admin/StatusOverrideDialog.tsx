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
    value: "cancelled_by_admin",
    label: "Cancelled by Admin",
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

function getStatusLabel(status: BookingStatus): string {
  return (
    BOOKING_STATUS_OPTIONS.find(
      (option) => option.value === status,
    )?.label ?? status
  );
}

function formatBookingId(id: string): string {
  if (!id) {
    return "-";
  }

  if (id.length <= 16) {
    return id;
  }

  return `${id.slice(0, 8)}...${id.slice(-6)}`;
}

function getErrorMessage(err: unknown): string {
  if (
    typeof err === "object" &&
    err !== null &&
    "message" in err &&
    typeof err.message === "string"
  ) {
    return err.message;
  }

  return "Unable to update booking status. Please try again.";
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

  const [reason, setReason] =
    useState("");

  const [submitting, setSubmitting] =
    useState(false);

  const [error, setError] =
    useState("");

  useEffect(() => {
    if (!open || !booking) {
      setReason("");
      setSubmitting(false);
      setError("");
      return;
    }

    setStatus(booking.status);
    setReason("");
    setSubmitting(false);
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
        !submitting
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
    submitting,
  ]);

  if (!open || !booking) {
    return null;
  }

  const trimmedReason =
    reason.trim();

  const reasonError =
    reason.length > 0 &&
    trimmedReason.length === 0
      ? "Reason cannot be empty."
      : "";

  const sameStatus =
    status === booking.status;

  const canSubmit =
    !submitting &&
    trimmedReason.length > 0 &&
    !sameStatus;

  const handleStatusChange = (
    event: React.ChangeEvent<HTMLSelectElement>,
  ) => {
    setStatus(
      event.target.value as BookingStatus,
    );

    setError("");
  };

  const handleReasonChange = (
    event: React.ChangeEvent<HTMLTextAreaElement>,
  ) => {
    setReason(
      event.target.value,
    );

    setError("");
  };

  const handleSubmit = async () => {
    if (!booking) {
      return;
    }

    if (!trimmedReason) {
      setError(
        "A reason is required for a status override.",
      );
      return;
    }

    if (sameStatus) {
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

      onUpdated?.(
        updatedBooking,
      );

      onClose();
    } catch (err) {
      setError(
        getErrorMessage(err),
      );
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <>
      <style>{`
        /* =========================================================
           FULL SCREEN STATUS OVERRIDE
           ========================================================= */

        .status-override-dialog__backdrop {
          position: fixed;
          inset: 0;
          z-index: 9999;

          width: 100vw;
          height: 100vh;

          min-width: 100%;
          min-height: 100%;

          display: flex;
          align-items: stretch;
          justify-content: stretch;

          box-sizing: border-box;

          margin: 0;
          padding: 0;

          background: #f8fafc;
        }

        .status-override-dialog {
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

          box-sizing: border-box;

          margin: 0;
          padding: 0;

          border: 0;
          border-radius: 0;

          background: #ffffff;

          box-shadow: none;
        }

        /* =========================================================
           HEADER
           ========================================================= */

        .status-override-dialog__header {
          width: 100%;

          display: flex;
          align-items: center;
          justify-content: space-between;

          gap: 24px;

          flex-shrink: 0;

          box-sizing: border-box;

          padding: 24px 40px;

          border-bottom: 1px solid #e5e7eb;

          background: #ffffff;
        }

        .status-override-dialog__header-content {
          min-width: 0;
        }

        .status-override-dialog__title {
          margin: 0;

          color: #111827;

          font-size: 24px;
          line-height: 1.3;
          font-weight: 700;
        }

        .status-override-dialog__subtitle {
          display: flex;
          align-items: center;
          flex-wrap: wrap;

          gap: 6px;

          margin: 7px 0 0;

          color: #6b7280;

          font-size: 14px;
          line-height: 1.5;
        }

        .status-override-dialog__booking-id {
          color: #1f3b61;

          font-weight: 700;

          word-break: break-all;
        }

        .status-override-dialog__close {
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

        .status-override-dialog__close:hover:not(:disabled) {
          background: #f3f4f6;
          border-color: #9ca3af;
        }

        .status-override-dialog__close:disabled {
          cursor: not-allowed;
          opacity: 0.55;
        }

        /* =========================================================
           BODY
           ========================================================= */

        .status-override-dialog__body {
          width: 100%;

          flex: 1 1 auto;

          min-height: 0;

          overflow-y: auto;

          box-sizing: border-box;

          padding: 40px;

          background: #f8fafc;
        }

        .status-override-dialog__content {
          width: 100%;
          max-width: 1100px;

          margin: 0 auto;
        }

        .status-override-dialog__intro {
          margin-bottom: 28px;
        }

        .status-override-dialog__intro-title {
          margin: 0 0 6px;

          color: #111827;

          font-size: 20px;
          line-height: 1.4;
          font-weight: 700;
        }

        .status-override-dialog__intro-text {
          margin: 0;

          color: #6b7280;

          font-size: 14px;
          line-height: 1.5;
        }

        /* =========================================================
           FORM GRID
           ========================================================= */

        .status-override-dialog__form-grid {
          display: grid;

          grid-template-columns:
            minmax(0, 1fr)
            minmax(0, 1fr);

          gap: 24px;
        }

        .status-override-dialog__field {
          margin-bottom: 24px;
        }

        .status-override-dialog__field--full {
          grid-column: 1 / -1;
        }

        .status-override-dialog__label {
          display: block;

          margin-bottom: 8px;

          color: #374151;

          font-size: 14px;
          font-weight: 600;
        }

        .status-override-dialog__required {
          color: #dc2626;
        }

        /* =========================================================
           CURRENT STATUS
           ========================================================= */

        .status-override-dialog__current {
          display: flex;
          align-items: center;
          justify-content: space-between;

          gap: 16px;

          min-height: 52px;

          box-sizing: border-box;

          padding: 12px 16px;

          border: 1px solid #dbe3ec;
          border-radius: 10px;

          background: #ffffff;
        }

        .status-override-dialog__current-label {
          color: #6b7280;

          font-size: 13px;
          font-weight: 500;
        }

        .status-override-dialog__current-value {
          color: #1f3b61;

          font-size: 14px;
          font-weight: 700;

          text-align: right;
        }

        /* =========================================================
           INPUTS
           ========================================================= */

        .status-override-dialog__select,
        .status-override-dialog__textarea {
          display: block;

          width: 100%;

          box-sizing: border-box;

          border: 1px solid #cbd5e1;
          border-radius: 10px;

          outline: none;

          background: #ffffff;
          color: #111827;

          font-family: inherit;
          font-size: 14px;
        }

        .status-override-dialog__select {
          min-height: 52px;

          padding: 11px 14px;

          cursor: pointer;
        }

        .status-override-dialog__textarea {
          min-height: 180px;

          padding: 14px;

          resize: vertical;

          line-height: 1.6;
        }

        .status-override-dialog__select:hover,
        .status-override-dialog__textarea:hover {
          border-color: #94a3b8;
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
          margin: 7px 0 0;

          color: #6b7280;

          font-size: 13px;
          line-height: 1.5;
        }

        .status-override-dialog__field-error {
          margin: 7px 0 0;

          color: #dc2626;

          font-size: 13px;
          line-height: 1.5;
        }

        /* =========================================================
           WARNING / ERROR
           ========================================================= */

        .status-override-dialog__warning {
          display: flex;
          align-items: flex-start;

          gap: 10px;

          margin-top: 0;

          padding: 14px 16px;

          border: 1px solid #fed7aa;
          border-radius: 10px;

          background: #fff7ed;
          color: #9a3412;

          font-size: 14px;
          line-height: 1.5;
        }

        .status-override-dialog__warning-icon {
          flex: 0 0 auto;

          width: 20px;
          height: 20px;

          display: inline-flex;
          align-items: center;
          justify-content: center;

          border-radius: 50%;

          background: #f97316;
          color: #ffffff;

          font-size: 12px;
          font-weight: 700;
        }

        .status-override-dialog__error {
          margin-top: 20px;

          padding: 14px 16px;

          border: 1px solid #fecaca;
          border-radius: 10px;

          background: #fef2f2;
          color: #991b1b;

          font-size: 14px;
          line-height: 1.5;
        }

        /* =========================================================
           FOOTER
           ========================================================= */

        .status-override-dialog__footer {
          width: 100%;

          display: flex;
          align-items: center;
          justify-content: flex-end;

          gap: 12px;

          flex-shrink: 0;

          box-sizing: border-box;

          padding: 20px 40px;

          border-top: 1px solid #e5e7eb;

          background: #ffffff;
        }

        .status-override-dialog__button {
          min-height: 46px;

          min-width: 140px;

          padding: 10px 22px;

          border-radius: 9px;

          font-family: inherit;
          font-size: 14px;
          font-weight: 600;

          cursor: pointer;
        }

        .status-override-dialog__button--secondary {
          border: 1px solid #cbd5e1;

          background: #ffffff;
          color: #374151;
        }

        .status-override-dialog__button--secondary:hover:not(:disabled) {
          background: #f8fafc;
          border-color: #94a3b8;
        }

        .status-override-dialog__button--primary {
          border: 1px solid #2563eb;

          background: #2563eb;
          color: #ffffff;
        }

        .status-override-dialog__button--primary:hover:not(:disabled) {
          background: #1d4ed8;
          border-color: #1d4ed8;
        }

        .status-override-dialog__button:disabled {
          cursor: not-allowed;
          opacity: 0.55;
        }

        /* =========================================================
           TABLET
           ========================================================= */

        @media (max-width: 900px) {
          .status-override-dialog__header {
            padding: 22px 24px;
          }

          .status-override-dialog__body {
            padding: 28px 24px;
          }

          .status-override-dialog__footer {
            padding: 18px 24px;
          }

          .status-override-dialog__content {
            max-width: 100%;
          }

          .status-override-dialog__form-grid {
            grid-template-columns: 1fr;
            gap: 0;
          }

          .status-override-dialog__field--full {
            grid-column: auto;
          }
        }

        /* =========================================================
           MOBILE
           ========================================================= */

        @media (max-width: 600px) {
          .status-override-dialog__header {
            padding: 18px 16px;

            gap: 12px;
          }

          .status-override-dialog__title {
            font-size: 20px;
          }

          .status-override-dialog__subtitle {
            font-size: 13px;
          }

          .status-override-dialog__close {
            width: 38px;
            height: 38px;

            font-size: 22px;
          }

          .status-override-dialog__body {
            padding: 24px 16px;
          }

          .status-override-dialog__intro {
            margin-bottom: 22px;
          }

          .status-override-dialog__intro-title {
            font-size: 18px;
          }

          .status-override-dialog__form-grid {
            display: block;
          }

          .status-override-dialog__field {
            margin-bottom: 20px;
          }

          .status-override-dialog__textarea {
            min-height: 150px;
          }

          .status-override-dialog__footer {
            flex-direction: column-reverse;

            align-items: stretch;

            padding: 16px;
          }

          .status-override-dialog__button {
            width: 100%;
          }
        }

        /* =========================================================
           SMALL MOBILE
           ========================================================= */

        @media (max-width: 360px) {
          .status-override-dialog__header {
            padding: 16px 12px;
          }

          .status-override-dialog__body {
            padding: 20px 12px;
          }

          .status-override-dialog__footer {
            padding: 14px 12px;
          }

          .status-override-dialog__title {
            font-size: 18px;
          }

          .status-override-dialog__subtitle {
            font-size: 12px;
          }

          .status-override-dialog__label {
            font-size: 13px;
          }

          .status-override-dialog__select,
          .status-override-dialog__textarea {
            font-size: 13px;
          }
        }
      `}</style>

      <div
        className="status-override-dialog__backdrop"
        role="presentation"
      >
        <section
          className="status-override-dialog"
          role="dialog"
          aria-modal="true"
          aria-labelledby="status-override-dialog-title"
        >
          {/* =====================================================
              HEADER
              ===================================================== */}

          <header className="status-override-dialog__header">
            <div className="status-override-dialog__header-content">
              <h2
                id="status-override-dialog-title"
                className="status-override-dialog__title"
              >
                Override Booking Status
              </h2>

              <p className="status-override-dialog__subtitle">
                Booking ID:
                {" "}
                <strong className="status-override-dialog__booking-id">
                  {formatBookingId(
                    booking.id,
                  )}
                </strong>
              </p>
            </div>

            <button
              type="button"
              className="status-override-dialog__close"
              onClick={onClose}
              disabled={submitting}
              aria-label="Close status override"
            >
              ×
            </button>
          </header>

          {/* =====================================================
              BODY
              ===================================================== */}

          <main className="status-override-dialog__body">
            <div className="status-override-dialog__content">
              <div className="status-override-dialog__intro">
                <h3 className="status-override-dialog__intro-title">
                  Update booking status
                </h3>

                <p className="status-override-dialog__intro-text">
                  Administrators can override the booking
                  status when a manual correction is required.
                  A reason is required and will be recorded
                  for audit purposes.
                </p>
              </div>

              <div className="status-override-dialog__form-grid">
                {/* Current Status */}

                <div className="status-override-dialog__field">
                  <label className="status-override-dialog__label">
                    Current Status
                  </label>

                  <div
                    className="status-override-dialog__current"
                    aria-label={`Current status: ${getStatusLabel(
                      booking.status,
                    )}`}
                  >
                    <span className="status-override-dialog__current-label">
                      Current
                    </span>

                    <span className="status-override-dialog__current-value">
                      {getStatusLabel(
                        booking.status,
                      )}
                    </span>
                  </div>
                </div>

                {/* New Status */}

                <div className="status-override-dialog__field">
                  <label
                    htmlFor="booking-new-status"
                    className="status-override-dialog__label"
                  >
                    New Status{" "}
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
                    onChange={
                      handleStatusChange
                    }
                    disabled={submitting}
                  >
                    {BOOKING_STATUS_OPTIONS.map(
                      (option) => (
                        <option
                          key={option.value}
                          value={option.value}
                        >
                          {option.label}
                          {option.value ===
                          booking.status
                            ? " (current)"
                            : ""}
                        </option>
                      ),
                    )}
                  </select>
                </div>

                {/* Reason */}

                <div className="status-override-dialog__field status-override-dialog__field--full">
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
                    onChange={
                      handleReasonChange
                    }
                    placeholder="Enter the reason for overriding this booking status"
                    disabled={submitting}
                    aria-required="true"
                    aria-invalid={Boolean(
                      reasonError,
                    )}
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
                      A reason is required and
                      will be recorded with the
                      status override.
                    </p>
                  )}
                </div>

                {/* Same Status Warning */}

                {sameStatus && (
                  <div className="status-override-dialog__field status-override-dialog__field--full">
                    <div
                      className="status-override-dialog__warning"
                      role="status"
                    >
                      <span
                        className="status-override-dialog__warning-icon"
                        aria-hidden="true"
                      >
                        !
                      </span>

                      <span>
                        The selected status is
                        already the current status.
                        Select a different status
                        to continue.
                      </span>
                    </div>
                  </div>
                )}
              </div>

              {/* Error */}

              {error && (
                <div
                  className="status-override-dialog__error"
                  role="alert"
                >
                  {error}
                </div>
              )}
            </div>
          </main>

          {/* =====================================================
              FOOTER
              ===================================================== */}

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
              onClick={() =>
                void handleSubmit()
              }
              disabled={!canSubmit}
            >
              {submitting
                ? "Updating..."
                : "Override Status"}
            </button>
          </footer>
        </section>
      </div>
    </>
  );
};

export default StatusOverrideDialog;