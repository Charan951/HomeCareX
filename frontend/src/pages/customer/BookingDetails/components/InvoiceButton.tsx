import { useContext, useState } from "react";
import clsx from "clsx";
import { FileText, Loader2 } from "lucide-react";
import { AuthContext } from "@/context/AuthContext";
import { FOCUS_RING } from "@/components/customer/focusRing";
import { buildReceiptData } from "@/features/payments/receiptData";
import type { BookingDetailView } from "@/types/bookingDetail";
import type { PaymentRow } from "@/types/payment";

interface Props {
  booking: BookingDetailView;
  serviceName: string;
  bookingCode: string;
  /** What the customer owes in total, extra charges included. */
  total: number;
  /** The invoice only exists once the booking is paid. */
  enabled: boolean;
  className?: string;
}

/**
 * Downloads a PDF invoice for a paid booking.
 * Built from what this page already has, so it needs no extra request. The PDF library loads only when pressed.
 */
export default function InvoiceButton({
  booking,
  serviceName,
  bookingCode,
  total,
  enabled,
  className,
}: Props) {
  // Read the context directly: a missing provider should hide the name, not crash the page.
  const user = useContext(AuthContext)?.user ?? null;
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");

  async function download() {
    if (busy || !enabled) return;
    setBusy(true);
    setError("");
    try {
      const pay = booking.paymentDetails;
      const row: PaymentRow = {
        // The receipt shows the last 8 characters of this id as the transaction ID.
        id: pay?.transactionId ?? pay?.paymentId ?? booking._id,
        bookingId: booking._id,
        bookingRef: bookingCode,
        serviceName,
        bookingDate: booking.date,
        amount: total,
        currency: "INR",
        method: (pay?.method ?? null) as PaymentRow["method"],
        status: "PAID",
        paidAt: pay?.paidAt ?? null,
        createdAt: booking.createdAt,
        receiptNo: bookingCode,
      };
      const data = buildReceiptData(row, booking, {
        name: user?.name,
        email: user?.email,
      });
      const { buildReceiptPdf } =
        await import("@/features/payments/receiptPdf");
      (await buildReceiptPdf(data)).save();
    } catch {
      setError("We couldn't create the invoice. Please try again.");
    } finally {
      setBusy(false);
    }
  }

  return (
    <>
      <button
        type="button"
        onClick={() => void download()}
        disabled={busy || !enabled}
        title={enabled ? undefined : "Available once the payment is complete"}
        className={clsx(
          "inline-flex min-h-[44px] w-full items-center justify-center gap-2 rounded-xl bg-brand px-4 text-sm font-semibold text-white transition hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-50",
          busy && "disabled:cursor-wait disabled:opacity-70",
          FOCUS_RING,
          className,
        )}
      >
        {busy ? (
          <Loader2 className="h-4 w-4 animate-spin" aria-hidden="true" />
        ) : (
          <FileText className="h-4 w-4" aria-hidden="true" />
        )}
        {busy ? "Preparing invoice…" : "Download Invoice"}
      </button>
      {error && (
        <p role="alert" className="text-sm text-danger">
          {error}
        </p>
      )}
    </>
  );
}
