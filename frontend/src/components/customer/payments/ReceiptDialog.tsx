import { useEffect, useRef, useState } from "react";
import { createPortal } from "react-dom";
import { useQuery } from "@tanstack/react-query";
import { Download, Loader2, X } from "lucide-react";
import logoImg from "@/assets/image.png";
import { FOCUS_RING } from "@/components/customer/focusRing";
import { useAuth } from "@/hooks/useAuth";
import { bookingApi, type NormalizedApiError } from "@/services/bookingApi";
import {
  STATUS_LABEL,
  buildReceiptData,
  fmtLine,
  fmtReceiptDate,
  formatMoney,
  type ReceiptData,
} from "@/features/payments";
import type { BookingView } from "@/types/booking";
import type { PaymentRecordStatus, PaymentRow } from "@/types/payment";

const BADGE: Record<PaymentRecordStatus, string> = {
  PAID: "bg-green-50 text-green-700 ring-green-600/20",
  PENDING: "bg-accent-soft text-ink ring-orange-400/30",
  FAILED: "bg-danger-soft text-danger ring-red-500/20",
  REFUNDED: "bg-brand-soft text-brand ring-brand/20",
};

/** Print and responsive scaling styles to guarantee everything fits without scrolling */
const STYLES = `
@page { size: A4; margin: 12mm; }
@media print {
  html, body { background: #fff !important; height: auto !important; overflow: visible !important; }
  body > *:not(#receipt-print-root) { display: none !important; }
  #receipt-print-root { position: static !important; inset: auto !important; overflow: visible !important; background: #fff !important; padding: 0 !important; display: block !important; height: auto !important; }
  .receipt-no-print { display: none !important; }
  .receipt-doc-container { box-shadow: none !important; border: 0 !important; margin: 0 !important; max-width: none !important; padding: 0 !important; break-inside: avoid; gap: 1.5rem !important; display: block !important; }
  .receipt-doc-container * { -webkit-print-color-adjust: exact; print-color-adjust: exact; }
  .rcpt-subtitle { font-size: 12px !important; }
  .rcpt-heading { font-size: 16px !important; }
  .rcpt-label { font-size: 11px !important; margin-bottom: 2px !important; }
  .rcpt-value { font-size: 14px !important; }
  .rcpt-section-title { font-size: 12px !important; padding-bottom: 6px !important; margin-bottom: 12px !important; }
  .rcpt-space-y > * + * { margin-top: 12px !important; }
  .rcpt-table th, .rcpt-table td { padding: 8px 12px !important; font-size: 14px !important; }
  .rcpt-table-footer th, .rcpt-table-footer td { padding: 12px !important; }
  .rcpt-total { font-size: 18px !important; }
}

@media screen {
  .receipt-dialog-wrapper {
    --rcpt-p: clamp(0.6rem, 2vh, 2rem);
    --rcpt-gap: clamp(0.4rem, 1.25vh, 1.25rem);
    --rcpt-text-base: clamp(10px, 1.35vh, 13px);
    --rcpt-text-sm: clamp(9.5px, 1.25vh, 12px);
    --rcpt-text-xs: clamp(9px, 1.1vh, 11px);
    --rcpt-text-lg: clamp(13px, 1.9vh, 16px);
    --rcpt-heading: clamp(12px, 1.8vh, 15px);

    height: 100vh;
    height: 100dvh;
    width: 100vw;
    padding: clamp(0.4rem, 1.5vh, 1.5rem);
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: flex-start;
    overflow-y: auto;
    background-color: #f3f4f6;
  }
  .receipt-doc-container {
    padding: var(--rcpt-p);
    display: flex;
    flex-direction: column;
    gap: var(--rcpt-gap);
    width: 100%;
    max-width: 680px;
    background: #fff;
    border-radius: 0.375rem;
    box-shadow: 0 2px 12px rgba(30,27,46,0.08);
    border: 1px solid #e2e8f0;
    flex-shrink: 0;
    box-sizing: border-box;
  }
  .rcpt-subtitle { font-size: var(--rcpt-text-xs); line-height: 1.3; }
  .rcpt-heading { font-size: var(--rcpt-heading); line-height: 1.2; }
  .rcpt-label { font-size: var(--rcpt-text-xs); line-height: 1.2; margin-bottom: clamp(1px, 0.3vh, 3px); }
  .rcpt-value { font-size: var(--rcpt-text-base); line-height: 1.2; }
  .rcpt-section-title { font-size: var(--rcpt-text-xs); padding-bottom: clamp(2px, 0.4vh, 4px); margin-bottom: clamp(3px, 0.8vh, 8px); }
  .rcpt-space-y > * + * { margin-top: clamp(3px, 0.8vh, 8px); }
  .rcpt-table th, .rcpt-table td { padding: clamp(3px, 0.7vh, 8px) clamp(4px, 1vw, 12px); font-size: var(--rcpt-text-sm); line-height: 1.2; }
  .rcpt-table-footer th, .rcpt-table-footer td { padding: clamp(4px, 1vh, 10px) clamp(4px, 1vw, 12px); }
  .rcpt-total { font-size: var(--rcpt-text-lg); }
}

button:focus-visible, a:focus-visible {
  outline: 2px solid #6366f1 !important;
  outline-offset: 2px !important;
}
`;

function Field({ label, value }: { label: string; value?: string }) {
  if (!value) return null;
  return (
    <div className="min-w-0 flex flex-col justify-start">
      <dt className="rcpt-label font-semibold uppercase tracking-wider text-muted">
        {label}
      </dt>
      <dd className="rcpt-value break-words text-ink">{value}</dd>
    </div>
  );
}

function Section({
  title,
  children,
}: {
  title: string;
  children: React.ReactNode;
}) {
  return (
    <section className="min-w-0 flex flex-col">
      <h3 className="rcpt-section-title border-b border-line font-bold uppercase tracking-wider text-brand">
        {title}
      </h3>
      <dl className="rcpt-space-y flex flex-col">{children}</dl>
    </section>
  );
}

function ReceiptDocument({ data }: { data: ReceiptData }) {
  return (
    <article
      className="receipt-doc-container"
      aria-label={`Receipt ${data.receiptNo}`}
    >
      {/* Header with Enlarged, Crisp Brand Logo */}
      <header className="flex flex-row items-start justify-between border-b-2 border-ink pb-[clamp(0.4rem,1.2vh,1rem)] shrink-0 gap-3">
        <div className="flex flex-col items-start shrink-0">
          <div className="h-[clamp(38px,5.2vh,56px)] w-auto max-w-[200px] sm:max-w-[280px] flex items-center">
            <img
              src={typeof logoImg === "string" ? logoImg : (logoImg as any)?.src || logoImg}
              alt="HomeCareX"
              loading="eager"
              decoding="sync"
              className="h-full w-auto max-w-full object-contain object-left block"
            />
          </div>
          <p className="rcpt-subtitle text-muted mt-1 font-medium pl-0.5">
            Home Services &amp; Care
          </p>
        </div>

        <div className="text-right flex flex-col items-end">
          <h2 className="rcpt-heading font-semibold text-ink">
            Payment Receipt
          </h2>
          <p className="rcpt-subtitle break-all text-muted mt-[clamp(1px,0.3vh,3px)]">
            Receipt No: {data.receiptNo}
          </p>
          <p className="rcpt-subtitle text-muted mt-[clamp(1px,0.2vh,2px)]">
            Date: {fmtReceiptDate(data.paymentDate)}
          </p>
          <span
            className={`mt-[clamp(2px,0.6vh,6px)] inline-flex items-center rounded-md px-1.5 py-0.5 rcpt-subtitle font-bold tracking-wide ring-1 ring-inset ${BADGE[data.status]}`}
          >
            {STATUS_LABEL[data.status]}
          </span>
        </div>
      </header>

      {/* Customer + booking */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-[clamp(0.4rem,1.25vh,1.5rem)] shrink-0">
        <Section title="Customer">
          <Field label="Name" value={data.customer.name} />
          <Field label="Email" value={data.customer.email} />
          <Field label="Phone" value={data.customer.phone} />
        </Section>
        <Section title="Booking">
          <Field label="Service" value={data.booking.service} />
          <Field label="Booking ID" value={data.booking.bookingRef} />
          <Field label="Service date" value={data.booking.serviceDate} />
          <Field label="Time" value={data.booking.serviceTime} />
        </Section>
      </div>

      {data.booking.address && (
        <dl className="shrink-0 mt-[clamp(1px,0.4vh,4px)]">
          <Field label="Service address" value={data.booking.address} />
        </dl>
      )}

      {/* Payment information */}
      <section className="shrink-0 flex flex-col">
        <h3 className="rcpt-section-title border-b border-line font-bold uppercase tracking-wider text-brand">
          Payment information
        </h3>
        <dl className="grid grid-cols-2 sm:grid-cols-4 gap-x-2 gap-y-[clamp(3px,0.8vh,8px)] sm:gap-x-6">
          <Field label="Payment method" value={data.payment.method} />
          <Field label="Transaction ID" value={data.payment.transactionId} />
          <Field
            label="Payment date"
            value={fmtReceiptDate(data.paymentDate)}
          />
          <Field label="Payment status" value={STATUS_LABEL[data.status]} />
        </dl>
      </section>

      {/* Price table */}
      <div className="shrink-0 flex flex-col min-h-0 mt-[clamp(1px,0.4vh,4px)]">
        <table className="rcpt-table w-full text-left">
          <caption className="sr-only">Price breakdown</caption>
          <thead>
            <tr className="bg-canvas uppercase tracking-wider text-muted">
              <th scope="col" className="font-semibold">
                Description
              </th>
              <th scope="col" className="text-right font-semibold">
                Amount
              </th>
            </tr>
          </thead>
          <tbody>
            {data.lines.map((l) => (
              <tr
                key={l.label}
                className={`border-b border-line ${l.emphasis ? "font-semibold text-ink" : "text-muted"}`}
              >
                <th
                  scope="row"
                  className="font-normal"
                  style={l.emphasis ? { fontWeight: 600 } : undefined}
                >
                  {l.label}
                </th>
                <td className="whitespace-nowrap text-right font-semibold tabular-nums text-ink">
                  {fmtLine(l)}
                </td>
              </tr>
            ))}
          </tbody>
          <tfoot className="rcpt-table-footer">
            <tr className="border-y-2 border-ink bg-brand-soft">
              <th
                scope="row"
                className="rcpt-value font-bold uppercase text-ink"
              >
                Total paid
              </th>
              <td className="rcpt-total whitespace-nowrap text-right font-bold tabular-nums text-brand">
                {formatMoney(data.total)}
              </td>
            </tr>
          </tfoot>
        </table>
      </div>

      <footer className="shrink-0 mt-[clamp(2px,0.5vh,6px)]">
        <p className="rcpt-value font-semibold text-ink">
          Thank you for choosing HomeCareX.
        </p>
        <p className="mt-[clamp(1px,0.3vh,3px)] rcpt-subtitle font-bold text-ink">
          HomeCareX
        </p>
        <p className="rcpt-subtitle text-muted">Professional Home Services</p>
      </footer>
    </article>
  );
}

export default function ReceiptDialog({
  row,
  onClose,
}: {
  row: PaymentRow;
  onClose: () => void;
}) {
  const { user } = useAuth();
  const rootRef = useRef<HTMLDivElement>(null);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const { data: booking, isLoading } = useQuery<
    BookingView,
    NormalizedApiError
  >({
    queryKey: ["booking", row.bookingId],
    queryFn: () => bookingApi.getBooking(row.bookingId),
    enabled: Boolean(row.bookingId),
  });

  const data = buildReceiptData(row, booking, user);

  useEffect(() => {
    const prev = document.activeElement as HTMLElement | null;
    const prevOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    rootRef.current?.focus();

    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
      if (e.key !== "Tab" || !rootRef.current) return;
      const f = rootRef.current.querySelectorAll<HTMLElement>(
        "button:not([disabled]), a[href]",
      );
      if (f.length === 0) return;
      const first = f[0];
      const last = f[f.length - 1];
      if (e.shiftKey && document.activeElement === first) {
        e.preventDefault();
        last.focus();
      } else if (!e.shiftKey && document.activeElement === last) {
        e.preventDefault();
        first.focus();
      }
    };
    document.addEventListener("keydown", onKey);
    return () => {
      document.removeEventListener("keydown", onKey);
      document.body.style.overflow = prevOverflow;
      prev?.focus();
    };
  }, [onClose]);

  const download = async () => {
    if (busy) return;
    setBusy(true);
    setError(null);
    try {
      const pdf = await (
        await import("@/features/payments/receiptPdf")
      ).buildReceiptPdf(data);
      pdf.save();
    } catch {
      setError("Unable to download the receipt. Please try again.");
    } finally {
      setBusy(false);
    }
  };

  return createPortal(
    <div
      id="receipt-print-root"
      ref={rootRef}
      role="dialog"
      aria-modal="true"
      aria-label="Payment receipt"
      tabIndex={-1}
      className="receipt-dialog-wrapper fixed inset-0 z-50 outline-none"
    >
      <style>{STYLES}</style>

      {/* Close Header */}
      <div className="receipt-no-print w-full max-w-[680px] shrink-0 mb-[clamp(2px,0.5vh,10px)] flex justify-end">
        <button
          type="button"
          onClick={onClose}
          className={`inline-flex items-center gap-1.5 rounded-lg px-2 py-[clamp(2px,0.5vh,6px)] rcpt-value font-medium text-ink hover:bg-white focus:outline-none focus-visible:ring-2 focus-visible:ring-brand ${FOCUS_RING}`}
        >
          <X
            className="h-[clamp(14px,1.8vh,18px)] w-[clamp(14px,1.8vh,18px)]"
            aria-hidden="true"
          />
          Close
        </button>
      </div>

      {isLoading ? (
        <p
          role="status"
          className="receipt-no-print py-16 text-center text-sm text-muted"
        >
          Loading receipt…
        </p>
      ) : (
        <ReceiptDocument data={data} />
      )}

      {/* Download Action Footer */}
      <div className="receipt-no-print w-full max-w-[680px] shrink-0 mt-[clamp(6px,1.5vh,18px)] flex flex-col items-center">
        {error && (
          <p
            role="alert"
            className="mb-[clamp(4px,0.8vh,8px)] w-full rounded-lg bg-danger-soft px-3 py-2 rcpt-value text-danger"
          >
            {error}
          </p>
        )}
        <button
          type="button"
          onClick={() => void download()}
          disabled={busy || isLoading}
          aria-busy={busy}
          aria-label={
            busy ? "Generating receipt" : `Download receipt ${data.receiptNo}`
          }
          className={`inline-flex min-h-[clamp(38px,5vh,46px)] w-full items-center justify-center gap-2 rounded-lg bg-brand px-6 rcpt-value font-semibold text-white shadow-sm transition-opacity hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-70 sm:w-auto focus:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 ${FOCUS_RING}`}
        >
          {busy ? (
            <>
              <Loader2
                className="h-[clamp(14px,2vh,18px)] w-[clamp(14px,2vh,18px)] animate-spin"
                aria-hidden="true"
              />
              Generating Receipt…
            </>
          ) : (
            <>
              <Download
                className="h-[clamp(14px,2vh,18px)] w-[clamp(14px,2vh,18px)]"
                aria-hidden="true"
              />
              Download Receipt
            </>
          )}
        </button>
      </div>
    </div>,
    document.body,
  );
}