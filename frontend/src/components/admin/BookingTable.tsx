import React from "react";

import type {
  AdminBooking,
  BookingStatus,
  PaymentStatus,
} from "@/types/adminBooking";

interface BookingTableProps {
  bookings: AdminBooking[];
  onBookingSelect?: (booking: AdminBooking) => void;
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
      return "booking-table__status booking-table__status--completed";

    case "cancelled_by_customer":
    case "cancelled_by_partner":
    case "no_show":
      return "booking-table__status booking-table__status--cancelled";

    case "in_progress":
    case "en_route":
    case "arrived":
      return "booking-table__status booking-table__status--progress";

    case "assigned":
      return "booking-table__status booking-table__status--assigned";

    case "searching_for_partner":
      return "booking-table__status booking-table__status--confirmed";

    case "disputed":
      return "booking-table__status booking-table__status--cancelled";

    case "created":
    default:
      return "booking-table__status booking-table__status--pending";
  }
}

function getPaymentClass(status: PaymentStatus): string {
  switch (status) {
    case "Paid":
      return "booking-table__status booking-table__status--paid";

    case "Failed":
      return "booking-table__status booking-table__status--failed";

    case "Refunded":
      return "booking-table__status booking-table__status--refunded";

    case "Pending":
    default:
      return "booking-table__status booking-table__status--payment-pending";
  }
}

export const BookingTable: React.FC<BookingTableProps> = ({
  bookings,
  onBookingSelect,
}) => {
  if (bookings.length === 0) {
    return (
      <>
        <style>{`
          .booking-table__empty {
            padding: 40px 20px;
            text-align: center;
            border: 1px solid #e5e7eb;
            border-radius: 8px;
            background: #ffffff;
          }

          .booking-table__empty h3 {
            margin: 0 0 8px;
            font-size: 16px;
            color: #111827;
          }

          .booking-table__empty p {
            margin: 0;
            color: #6b7280;
            font-size: 14px;
          }
        `}</style>

        <div className="booking-table__empty">
          <h3>No bookings found</h3>

          <p>
            There are no bookings matching the current filters.
          </p>
        </div>
      </>
    );
  }

  return (
    <>
      <style>{`
        .booking-table__wrapper {
          width: 100%;
          overflow-x: auto;
          border: 1px solid #e5e7eb;
          border-radius: 8px;
          background: #ffffff;
        }

        .booking-table {
          width: 100%;
          min-width: 1100px;
          border-collapse: collapse;
        }

        .booking-table th,
        .booking-table td {
          padding: 12px 16px;
          text-align: left;
          border-bottom: 1px solid #e5e7eb;
        }

        .booking-table th {
          background: #f8fafc;
          color: #374151;
          font-size: 13px;
          font-weight: 600;
          white-space: nowrap;
        }

        .booking-table td {
          color: #111827;
          font-size: 14px;
          vertical-align: middle;
        }

        .booking-table tbody tr:last-child td {
          border-bottom: none;
        }

        .booking-table__row--clickable {
          cursor: pointer;
        }

        .booking-table__row--clickable:hover {
          background: #f8fafc;
        }

        .booking-table__booking-id {
          white-space: nowrap;
        }

        .booking-table__booking-button {
          padding: 0;
          border: 0;
          background: transparent;
          color: #2563eb;
          font: inherit;
          font-weight: 600;
          cursor: pointer;
          text-decoration: none;
        }

        .booking-table__booking-button:hover {
          text-decoration: underline;
        }

        .booking-table__booking-button:focus-visible {
          outline: 2px solid #2563eb;
          outline-offset: 3px;
          border-radius: 3px;
        }

        .booking-table__primary {
          font-weight: 500;
          color: #111827;
        }

        .booking-table__secondary {
          margin-top: 3px;
          color: #6b7280;
          font-size: 12px;
          line-height: 1.4;
        }

        .booking-table__amount {
          font-weight: 600;
          color: #111827;
          white-space: nowrap;
        }

        .booking-table__created {
          color: #4b5563;
          font-size: 13px;
          white-space: nowrap;
        }

        .booking-table__unassigned {
          color: #9ca3af;
          font-style: italic;
        }

        .booking-table__status {
          display: inline-flex;
          align-items: center;
          justify-content: center;
          padding: 4px 9px;
          border-radius: 999px;
          font-size: 12px;
          font-weight: 600;
          line-height: 1.2;
          white-space: nowrap;
        }

        .booking-table__status--completed {
          background: #dcfce7;
          color: #166534;
        }

        .booking-table__status--cancelled {
          background: #fee2e2;
          color: #991b1b;
        }

        .booking-table__status--progress {
          background: #dbeafe;
          color: #1d4ed8;
        }

        .booking-table__status--confirmed {
          background: #e0e7ff;
          color: #3730a3;
        }

        .booking-table__status--assigned {
          background: #fef3c7;
          color: #92400e;
        }

        .booking-table__status--pending {
          background: #f3f4f6;
          color: #374151;
        }

        .booking-table__status--paid {
          background: #dcfce7;
          color: #166534;
        }

        .booking-table__status--failed {
          background: #fee2e2;
          color: #991b1b;
        }

        .booking-table__status--refunded {
          background: #e0e7ff;
          color: #3730a3;
        }

        .booking-table__status--payment-pending {
          background: #f3f4f6;
          color: #374151;
        }

        .booking-table__empty {
          padding: 40px 20px;
          text-align: center;
          border: 1px solid #e5e7eb;
          border-radius: 8px;
          background: #ffffff;
        }

        .booking-table__empty h3 {
          margin: 0 0 8px;
          font-size: 16px;
          color: #111827;
        }

        .booking-table__empty p {
          margin: 0;
          color: #6b7280;
          font-size: 14px;
        }

        @media (max-width: 768px) {
          .booking-table__wrapper {
            width: 100%;
            overflow-x: auto;
            -webkit-overflow-scrolling: touch;
          }

          .booking-table {
            min-width: 1100px;
          }
        }

        @media (max-width: 360px) {
          .booking-table th,
          .booking-table td {
            padding: 10px 12px;
          }
        }
      `}</style>

      <div className="booking-table__wrapper">
        <table className="booking-table">
          <thead>
            <tr>
              <th scope="col">Booking ID</th>
              <th scope="col">Customer</th>
              <th scope="col">Service</th>
              <th scope="col">Partner</th>
              <th scope="col">City</th>
              <th scope="col">Scheduled</th>
              <th scope="col">Amount</th>
              <th scope="col">Status</th>
              <th scope="col">Payment</th>
              <th scope="col">Created</th>
            </tr>
          </thead>

          <tbody>
            {bookings.map((booking) => (
              <tr
                key={booking.id}
                className={
                  onBookingSelect
                    ? "booking-table__row booking-table__row--clickable"
                    : "booking-table__row"
                }
                onClick={() => onBookingSelect?.(booking)}
              >
                <td className="booking-table__booking-id">
                  {onBookingSelect ? (
                    <button
                      type="button"
                      className="booking-table__booking-button"
                      onClick={(event) => {
                        event.stopPropagation();
                        onBookingSelect(booking);
                      }}
                      aria-label={`Open booking ${booking.id}`}
                    >
                      {booking.id}
                    </button>
                  ) : (
                    booking.id
                  )}
                </td>

                <td>
                  <div className="booking-table__primary">
                    {booking.customer.name}
                  </div>

                  <div className="booking-table__secondary">
                    {booking.customer.phone || "-"}
                  </div>

                  <div className="booking-table__secondary">
                    {booking.customer.email || "-"}
                  </div>
                </td>

                <td>
                  <div className="booking-table__primary">
                    {booking.service.name}
                  </div>

                  <div className="booking-table__secondary">
                    {booking.service.category}
                  </div>

                  <div className="booking-table__secondary">
                    {booking.service.durationMinutes} min
                  </div>
                </td>

                <td>
                  {booking.partner ? (
                    <>
                      <div className="booking-table__primary">
                        {booking.partner.name}
                      </div>

                      <div className="booking-table__secondary">
                        {booking.partner.category}
                      </div>
                    </>
                  ) : (
                    <span className="booking-table__unassigned">
                      Unassigned
                    </span>
                  )}
                </td>

                <td>
                  <div className="booking-table__primary">
                    {booking.city || "-"}
                  </div>

                  <div className="booking-table__secondary">
                    {booking.address.area || "-"}
                  </div>
                </td>

                <td>
                  <div className="booking-table__primary">
                    {formatDate(booking.slot.date)}
                  </div>

                  <div className="booking-table__secondary">
                    {booking.slot.startTime} -{" "}
                    {booking.slot.endTime}
                  </div>
                </td>

                <td className="booking-table__amount">
                  {formatAmount(booking.pricing.totalAmount)}
                </td>

                <td>
                  <span
                    className={getStatusClass(booking.status)}
                  >
                    {getStatusLabel(booking.status)}
                  </span>
                </td>

                <td>
                  <span
                    className={getPaymentClass(
                      booking.payment.status,
                    )}
                  >
                    {booking.payment.status}
                  </span>
                </td>

                <td>
                  <span className="booking-table__created">
                    {formatDateTime(booking.createdAt)}
                  </span>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </>
  );
};

export default BookingTable;