import { useEffect, useState } from "react";
import { useParams, useNavigate, Link } from "react-router-dom";
import {
  ArrowLeft,
  CalendarDays,
  Clock,
  User,
  Phone,
  Mail,
  MapPin,
  CheckCircle2,
  Banknote,
  ShieldCheck,
} from "lucide-react";
import clsx from "clsx";
import BookingThumb from "@/pages/customer/Dashboard/sections/BookingThumb";
import { customerPath } from "@/routes/customerPath";
import { FOCUS_RING } from "@/components/customer/focusRing";

export interface BookingDetailData {
  id: string;
  code: string;
  serviceName: string;
  serviceImage?: string;
  status:
    | "confirmed"
    | "completed"
    | "in_progress"
    | "cancelled"
    | "pending_payment";
  date: string;
  slot: string;
  partner?: {
    name: string;
    phone: string;
    rating: number;
    avatar?: string;
  };
  customer: {
    name: string;
    phone: string;
    email: string;
    address: {
      flat: string;
      street: string;
      city: string;
      pincode: string;
    };
  };
  pricing: {
    itemTotal: number;
    taxes: number;
    discount?: number;
    total: number;
    paymentMode: "cash_on_delivery" | "cash_on_service" | "online" | string;
    paymentStatus:
      | "paid"
      | "pending"
      | "expired"
      | "due"
      | "captured"
      | "success"
      | string;
  };
}

const KB_FOCUS =
  "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#5247d2] focus-visible:ring-offset-2 focus-visible:ring-offset-white";

function formatBookingDate(dateInput?: string | number | Date): string {
  if (!dateInput) return "Not scheduled";

  const targetDate = new Date(dateInput);
  if (isNaN(targetDate.getTime())) return String(dateInput);

  const today = new Date();
  const isToday =
    targetDate.getDate() === today.getDate() &&
    targetDate.getMonth() === today.getMonth() &&
    targetDate.getFullYear() === today.getFullYear();

  const tomorrow = new Date();
  tomorrow.setDate(today.getDate() + 1);
  const isTomorrow =
    targetDate.getDate() === tomorrow.getDate() &&
    targetDate.getMonth() === tomorrow.getMonth() &&
    targetDate.getFullYear() === tomorrow.getFullYear();

  const formattedDate = targetDate.toLocaleDateString("en-IN", {
    day: "numeric",
    month: "short",
  });

  if (isToday) return `Today, ${formattedDate}`;
  if (isTomorrow) return `Tomorrow, ${formattedDate}`;

  const weekday = targetDate.toLocaleDateString("en-IN", { weekday: "short" });
  return `${weekday}, ${formattedDate}`;
}

export default function BookingDetails() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();

  const [booking, setBooking] = useState<BookingDetailData | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Replace with real API call: e.g. api.get(`/bookings/${id}`)
    const timer = setTimeout(() => {
      setBooking({
        id: id ?? "BK-1",
        code: "BK-42047",
        serviceName: "Terrace Waterproofing",
        serviceImage: "",
        // Set to "completed" to test completed state, or "confirmed" for active booking
        status: "confirmed",
        date: new Date().toISOString(),
        slot: "6:00 PM – 8:00 PM",
        partner: {
          name: "Ramesh Sharma",
          phone: "+91 98765 43210",
          rating: 4.8,
        },
        customer: {
          name: "Amit Patel",
          phone: "+91 91234 56789",
          email: "amit.patel@example.com",
          address: {
            flat: "Flat 402, Royal Palms",
            street: "MG Road, Sector 14",
            city: "Bengaluru",
            pincode: "560001",
          },
        },
        pricing: {
          itemTotal: 7499,
          taxes: 529,
          discount: 0,
          total: 8028,
          paymentMode: "cash_on_service",
          paymentStatus: "pending",
        },
      });
      setLoading(false);
    }, 200);

    return () => clearTimeout(timer);
  }, [id]);

  if (loading) {
    return (
      <main
        tabIndex={-1}
        className="flex min-h-[50vh] w-full items-center justify-center p-4 outline-none"
      >
        <div
          role="status"
          aria-label="Loading booking details"
          className="h-8 w-8 animate-spin rounded-full border-4 border-[#5247d2] border-t-transparent"
        />
      </main>
    );
  }

  if (!booking) {
    return (
      <main
        tabIndex={-1}
        className="mx-auto max-w-xl px-4 py-12 text-center outline-none sm:px-6"
      >
        <p className="text-sm text-slate-600 sm:text-base">
          Booking details not found.
        </p>
        <button
          type="button"
          onClick={() => navigate(customerPath("/bookings"))}
          className={clsx(
            "mt-4 inline-flex h-10 items-center justify-center rounded-xl bg-[#5247d2] px-5 text-sm font-semibold text-white shadow-sm transition hover:bg-[#4338ca]",
            KB_FOCUS,
            FOCUS_RING,
          )}
        >
          Return to Bookings
        </button>
      </main>
    );
  }

  // --- Normalization & Status Resolution ---
  const isCompleted = booking.status === "completed";
  const normalizedMode = (booking.pricing.paymentMode || "").toLowerCase();
  const normalizedStatus = (booking.pricing.paymentStatus || "").toLowerCase();

  const isExpired = normalizedStatus === "expired";

  const isCashOnService =
    normalizedMode === "cash_on_service" ||
    normalizedMode === "cash_on_delivery" ||
    normalizedMode === "cash" ||
    isExpired;

  const isStatusPaid =
    normalizedStatus === "paid" ||
    normalizedStatus === "success" ||
    normalizedStatus === "captured";

  // Cash on Service is resolved once service is completed OR explicitly marked paid
  const isPaid = isCashOnService ? isCompleted || isStatusPaid : isStatusPaid;

  // Final settlement flag: either paid online or service finished and cash collected
  const isSettled = isPaid || isCompleted;

  // Pay Now is ONLY visible for active, unpaid online payments that are NOT completed/cancelled
  const canPayOnline =
    !isSettled &&
    !isCashOnService &&
    !isExpired &&
    booking.status !== "cancelled";

  return (
    <main className="mx-auto w-full max-w-5xl overflow-hidden px-3.5 py-4 sm:px-6 sm:py-8">
      {/* Top Header */}
      <header className="mb-5 flex flex-col gap-3.5 sm:mb-6 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex min-w-0 items-start gap-3 sm:items-center">
          <button
            type="button"
            onClick={() => navigate(-1)}
            aria-label="Navigate back to bookings list"
            className={clsx(
              "flex h-9 w-9 shrink-0 items-center justify-center rounded-xl border border-slate-200 bg-white text-slate-700 shadow-sm transition hover:bg-slate-50",
              KB_FOCUS,
              FOCUS_RING,
            )}
          >
            <ArrowLeft className="h-4 w-4" aria-hidden="true" />
          </button>

          {booking.serviceImage ? (
            <img
              src={booking.serviceImage}
              alt=""
              aria-hidden="true"
              className="h-12 w-12 shrink-0 rounded-xl border border-slate-100 object-cover shadow-sm sm:h-14 sm:w-14 sm:rounded-2xl"
            />
          ) : (
            <BookingThumb
              serviceName={booking.serviceName}
              className="h-12 w-12 shrink-0 rounded-xl border border-slate-100 object-cover shadow-sm sm:h-14 sm:w-14 sm:rounded-2xl"
            />
          )}

          <div className="min-w-0 flex-1">
            <div className="flex flex-wrap items-center gap-1.5 sm:gap-2">
              <h1 className="break-words text-base font-bold leading-tight text-slate-900 sm:text-xl md:text-2xl">
                {booking.serviceName}
              </h1>
              <span
                className={clsx(
                  "shrink-0 rounded-md px-2 py-0.5 text-[11px] font-semibold sm:rounded-full sm:text-xs",
                  isCompleted
                    ? "bg-slate-100 text-slate-800"
                    : "bg-emerald-50 text-emerald-700",
                )}
              >
                {booking.status.toUpperCase()}
              </span>
            </div>
            <p className="mt-0.5 text-xs text-slate-500">
              Booking ID: {booking.code}
            </p>
          </div>
        </div>

        <div className="flex shrink-0 items-center gap-2 pl-12 sm:pl-0">
          <Link
            to={`${customerPath("/tracking")}?booking=${encodeURIComponent(booking.id)}`}
            className={clsx(
              "inline-flex h-9 items-center justify-center rounded-xl bg-[#eeebf9] px-4 text-xs font-semibold text-[#5247d2] transition hover:bg-[#e3dff7]",
              KB_FOCUS,
              FOCUS_RING,
            )}
          >
            Live Tracking
          </Link>
        </div>
      </header>

      {/* Main Grid */}
      <div className="grid grid-cols-1 gap-4 sm:gap-6 lg:grid-cols-3">
        {/* Left Column: Schedule & Customer Details */}
        <div className="flex min-w-0 flex-col gap-4 sm:gap-6 lg:col-span-2">
          {/* Schedule & Service */}
          <section
            aria-labelledby="heading-schedule"
            className="rounded-2xl border border-slate-100 bg-white p-4 shadow-sm sm:p-5"
          >
            <h2
              id="heading-schedule"
              className="mb-3.5 text-xs font-bold tracking-wider text-slate-900 uppercase sm:text-sm"
            >
              Schedule & Service
            </h2>
            <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
              <div className="flex min-w-0 items-start gap-2.5 rounded-xl bg-slate-50 p-3 sm:gap-3 sm:p-3.5">
                <CalendarDays
                  className="mt-0.5 h-4 w-4 shrink-0 text-[#5247d2]"
                  aria-hidden="true"
                />
                <div className="min-w-0">
                  <p className="text-xs text-slate-500">Date</p>
                  <p className="break-words text-sm font-semibold text-slate-900">
                    {formatBookingDate(booking.date)}
                  </p>
                </div>
              </div>
              <div className="flex min-w-0 items-start gap-2.5 rounded-xl bg-slate-50 p-3 sm:gap-3 sm:p-3.5">
                <Clock
                  className="mt-0.5 h-4 w-4 shrink-0 text-[#5247d2]"
                  aria-hidden="true"
                />
                <div className="min-w-0">
                  <p className="text-xs text-slate-500">Slot</p>
                  <p className="break-words text-sm font-semibold text-slate-900">
                    {booking.slot}
                  </p>
                </div>
              </div>
            </div>

            {/* Assigned Partner */}
            <div className="mt-4 border-t border-slate-100 pt-3.5">
              <h3 className="text-xs font-medium text-slate-500">
                Assigned Professional
              </h3>
              {booking.partner ? (
                <div className="mt-2 flex flex-wrap items-center justify-between gap-3 rounded-xl bg-[#f8f9fc] p-3 sm:flex-nowrap">
                  <div className="flex min-w-0 items-center gap-2.5 sm:gap-3">
                    <div
                      aria-hidden="true"
                      className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-[#5247d2]/10 font-bold text-[#5247d2]"
                    >
                      {booking.partner.name.charAt(0)}
                    </div>
                    <div className="min-w-0">
                      <p className="truncate text-sm font-semibold text-slate-900">
                        {booking.partner.name}
                      </p>
                      <p className="text-xs text-slate-500">
                        ★ {booking.partner.rating} Rating
                      </p>
                    </div>
                  </div>
                  <a
                    href={`tel:${booking.partner.phone}`}
                    className={clsx(
                      "inline-flex h-8 shrink-0 items-center gap-1.5 rounded-lg border border-slate-200 bg-white px-3 text-xs font-medium text-slate-700 shadow-sm transition hover:bg-slate-50",
                      KB_FOCUS,
                      FOCUS_RING,
                    )}
                  >
                    <Phone
                      className="h-3.5 w-3.5 text-slate-500"
                      aria-hidden="true"
                    />
                    <span>Call</span>
                  </a>
                </div>
              ) : (
                <p className="mt-1 text-xs italic text-slate-400">
                  Not assigned yet
                </p>
              )}
            </div>
          </section>

          {/* Customer Details */}
          <section
            aria-labelledby="heading-customer"
            className="rounded-2xl border border-slate-100 bg-white p-4 shadow-sm sm:p-5"
          >
            <h2
              id="heading-customer"
              className="mb-3.5 text-xs font-bold tracking-wider text-slate-900 uppercase sm:text-sm"
            >
              Customer Details
            </h2>
            <div className="space-y-3.5">
              <div className="flex min-w-0 items-start gap-2.5 sm:gap-3">
                <User
                  className="mt-0.5 h-4 w-4 shrink-0 text-slate-400"
                  aria-hidden="true"
                />
                <div className="min-w-0">
                  <p className="text-xs text-slate-500">Name</p>
                  <p className="break-words text-sm font-semibold text-slate-800">
                    {booking.customer.name}
                  </p>
                </div>
              </div>

              <div className="grid grid-cols-1 gap-3.5 sm:grid-cols-2">
                <div className="flex min-w-0 items-start gap-2.5 sm:gap-3">
                  <Phone
                    className="mt-0.5 h-4 w-4 shrink-0 text-slate-400"
                    aria-hidden="true"
                  />
                  <div className="min-w-0">
                    <p className="text-xs text-slate-500">Phone</p>
                    <p className="break-all text-sm font-semibold text-slate-800">
                      {booking.customer.phone}
                    </p>
                  </div>
                </div>

                <div className="flex min-w-0 items-start gap-2.5 sm:gap-3">
                  <Mail
                    className="mt-0.5 h-4 w-4 shrink-0 text-slate-400"
                    aria-hidden="true"
                  />
                  <div className="min-w-0">
                    <p className="text-xs text-slate-500">Email</p>
                    <p className="break-all text-sm font-semibold text-slate-800">
                      {booking.customer.email}
                    </p>
                  </div>
                </div>
              </div>

              <div className="flex min-w-0 items-start gap-2.5 border-t border-slate-100 pt-3 sm:gap-3">
                <MapPin
                  className="mt-0.5 h-4 w-4 shrink-0 text-slate-400"
                  aria-hidden="true"
                />
                <div className="min-w-0">
                  <p className="text-xs text-slate-500">Service Address</p>
                  <p className="break-words text-sm font-semibold text-slate-800">
                    {booking.customer.address.flat},{" "}
                    {booking.customer.address.street}
                  </p>
                  <p className="break-words text-xs text-slate-500">
                    {booking.customer.address.city} -{" "}
                    {booking.customer.address.pincode}
                  </p>
                </div>
              </div>
            </div>
          </section>
        </div>

        {/* Right Column: Payment Details */}
        <div className="flex min-w-0 flex-col gap-4 sm:gap-6">
          <section
            aria-labelledby="heading-payment"
            className="rounded-2xl border border-slate-100 bg-white p-4 shadow-sm sm:p-5"
          >
            <h2
              id="heading-payment"
              className="mb-3.5 text-xs font-bold tracking-wider text-slate-900 uppercase sm:text-sm"
            >
              Payment Summary
            </h2>

            <dl className="space-y-2.5 text-xs sm:text-sm text-slate-600">
              <div className="flex justify-between gap-2">
                <dt className="truncate">Item Total</dt>
                <dd className="shrink-0 font-medium text-slate-900">
                  ₹{booking.pricing.itemTotal}
                </dd>
              </div>
              <div className="flex justify-between gap-2">
                <dt className="truncate">Taxes & Fees</dt>
                <dd className="shrink-0 font-medium text-slate-900">
                  ₹{booking.pricing.taxes}
                </dd>
              </div>
              {booking.pricing.discount ? (
                <div className="flex justify-between gap-2 text-emerald-600">
                  <dt className="truncate">Discount</dt>
                  <dd className="shrink-0 font-medium">
                    -₹{booking.pricing.discount}
                  </dd>
                </div>
              ) : null}

              <div className="flex justify-between gap-2 border-t border-slate-100 pt-3 text-sm font-bold text-slate-900 sm:text-base">
                <dt>Total Amount</dt>
                <dd>₹{booking.pricing.total}</dd>
              </div>
            </dl>

            {/* Condition 1: Service is Completed OR Payment was marked Paid */}
            {isSettled ? (
              <div className="mt-4 flex items-center justify-between rounded-xl bg-emerald-50 p-3 text-xs text-emerald-800">
                <div className="flex min-w-0 items-center gap-1.5 font-medium">
                  <CheckCircle2
                    className="h-4 w-4 shrink-0 text-emerald-600"
                    aria-hidden="true"
                  />
                  <span className="truncate">
                    {isCompleted
                      ? isCashOnService
                        ? "Collected in Cash"
                        : "Service Completed"
                      : isCashOnService
                        ? "Collected in Cash"
                        : "Paid Online"}
                  </span>
                </div>
                <span className="shrink-0 rounded bg-emerald-200/70 px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider text-emerald-800">
                  {isCompleted ? "COMPLETED" : "PAID"}
                </span>
              </div>
            ) : isCashOnService ? (
              /* Condition 2: Cash on Service while service is STILL ongoing / confirmed */
              <div className="mt-4 flex flex-col gap-2 rounded-xl border border-amber-200/50 bg-amber-50/70 p-3 text-xs text-amber-900">
                <div className="flex items-center justify-between font-semibold">
                  <span className="flex items-center gap-1.5">
                    <Banknote
                      className="h-4 w-4 shrink-0 text-amber-600"
                      aria-hidden="true"
                    />
                    Cash on service
                  </span>
                  <span className="shrink-0 rounded bg-amber-200/80 px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider text-amber-900">
                    DUE ON SERVICE
                  </span>
                </div>
                <p className="text-[11px] leading-relaxed text-amber-700">
                  {isExpired ? (
                    <>
                      Online payment expired. Pay{" "}
                      <strong>₹{booking.pricing.total}</strong> in cash or UPI
                      directly to the professional once service is finished.
                    </>
                  ) : (
                    <>
                      Pay <strong>₹{booking.pricing.total}</strong> in cash or
                      UPI directly to the professional once service is finished.
                    </>
                  )}
                </p>
              </div>
            ) : (
              /* Condition 3: Active Online Payment Pending */
              <div className="mt-4 flex items-center justify-between rounded-xl border border-rose-200/50 bg-rose-50 p-3 text-xs text-rose-800">
                <span className="truncate font-medium">
                  Online Payment Pending
                </span>
                <span className="shrink-0 rounded bg-rose-200/70 px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider text-rose-900">
                  UNPAID
                </span>
              </div>
            )}

            {/* Pay Now Button (ONLY for active, uncompleted online orders) */}
            {canPayOnline && (
              <button
                type="button"
                className={clsx(
                  "mt-4 inline-flex h-11 w-full items-center justify-center rounded-xl bg-[#5247d2] px-4 text-sm font-semibold text-white shadow-sm transition hover:bg-[#4338ca]",
                  KB_FOCUS,
                  FOCUS_RING,
                )}
              >
                Pay Now ₹{booking.pricing.total}
              </button>
            )}
          </section>

          <div className="flex items-center gap-2 rounded-xl bg-slate-50 p-3 text-xs text-slate-500">
            <ShieldCheck
              className="h-4 w-4 shrink-0 text-slate-400"
              aria-hidden="true"
            />
            <span>100% verified service professionals & secure booking.</span>
          </div>
        </div>
      </div>
    </main>
  );
}
