import { useState } from "react";
import { Link } from "react-router-dom";
import { Receipt } from "lucide-react";
import PageShell from "@/components/layout/PageShell";
import { EmptyState, ErrorState, LoadingState, OfflineState } from "@/components/customer";
import { FOCUS_RING } from "@/components/customer/focusRing";
import { StatusPill } from "@/components/customer/payments";
import { formatMoney, methodLabel, openReceipt, usePayments } from "@/features/payments";
import { useOnlineStatus } from "@/hooks/useOnlineStatus";
import { customerPath } from "@/routes/customerPath";
import type { PaymentRecordStatus, PaymentRow } from "@/types/payment";

const FILTERS: { value: "" | PaymentRecordStatus; label: string }[] = [
  { value: "", label: "All" },
  { value: "PAID", label: "Paid" },
  { value: "PENDING", label: "Pending" },
  { value: "FAILED", label: "Failed" },
  { value: "REFUNDED", label: "Refunded" },
];

const fmtDate = (iso: string): string => new Date(iso).toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "numeric" });

function ReceiptButton({ row }: { row: PaymentRow }) {
  if (!row.receiptNo) return <span className="text-xs text-muted">{row.method === "cod" ? "On service" : "—"}</span>;
  return (
    <button
      type="button"
      onClick={() => openReceipt(row)}
      className={`inline-flex min-h-[44px] items-center gap-1.5 rounded px-2 text-sm font-medium text-brand underline-offset-4 hover:underline ${FOCUS_RING}`}
    >
      <Receipt className="h-4 w-4" aria-hidden="true" />
      Receipt
      <span className="sr-only"> for {row.bookingRef}</span>
    </button>
  );
}

/** Payments: route /customer/payments. Transaction, booking, date, amount, method, status, receipt. */
export default function Payments() {
  const online = useOnlineStatus();
  const [page, setPage] = useState(1);
  const [status, setStatus] = useState<"" | PaymentRecordStatus>("");
  const { data, isLoading, isError, error, refetch, isFetching } = usePayments(page, status || undefined);

  const totalPages = data ? Math.max(1, Math.ceil(data.total / data.limit)) : 1;

  let content;
  if (isLoading) {
    content = <LoadingState label="Loading your payments…" />;
  } else if (isError || !data) {
    content = !online ? (
      <OfflineState onRetry={() => void refetch()} />
    ) : (
      <ErrorState title="Couldn't load your payments" message={error?.message} onRetry={() => void refetch()} />
    );
  } else if (data.items.length === 0) {
    content = (
      <EmptyState
        title={status ? "No payments match this filter" : "No payments yet"}
        description={status ? "Try a different status." : "Your payments and receipts will show up here after your first booking."}
        action={
          !status && (
            <Link to={customerPath("/services")} className={`inline-flex min-h-[44px] items-center rounded bg-brand px-4 text-sm font-medium text-white hover:opacity-90 ${FOCUS_RING}`}>
              Browse services
            </Link>
          )
        }
      />
    );
  } else {
    content = (
      <>
        <div className="hidden md:block">
          <table className="w-full table-fixed text-left text-sm">
            <caption className="sr-only">Your payments</caption>
            <thead className="border-b border-line text-xs uppercase tracking-wide text-muted">
              <tr>
                <th scope="col" className="w-[13%] py-2 pr-3 font-semibold">Transaction</th>
                <th scope="col" className="py-2 pr-3 font-semibold">Booking</th>
                <th scope="col" className="w-[13%] py-2 pr-3 font-semibold">Date</th>
                <th scope="col" className="w-[13%] py-2 pr-3 text-right font-semibold">Amount</th>
                <th scope="col" className="w-[14%] py-2 pr-3 font-semibold">Method</th>
                <th scope="col" className="w-[11%] py-2 pr-3 font-semibold">Status</th>
                <th scope="col" className="w-[13%] py-2 font-semibold">Receipt</th>
              </tr>
            </thead>
            <tbody>
              {data.items.map((p) => (
                <tr key={p.id} className="border-b border-line last:border-0">
                  <td className="truncate py-2.5 pr-3 font-mono text-xs text-muted" title={p.id}>{p.id.slice(-8).toUpperCase()}</td>
                  <td className="py-2.5 pr-3">
                    <Link to={customerPath(`/bookings/${p.bookingId}`)} className={`block break-words text-ink hover:underline ${FOCUS_RING}`}>
                      {p.serviceName}
                    </Link>
                    <span className="text-xs text-muted">{p.bookingRef}</span>
                  </td>
                  <td className="py-2.5 pr-3 text-muted">{fmtDate(p.paidAt ?? p.createdAt)}</td>
                  <td className="py-2.5 pr-3 text-right font-medium tabular-nums text-ink">{formatMoney(p.amount)}</td>
                  <td className="py-2.5 pr-3 text-ink">{methodLabel(p.method)}</td>
                  <td className="py-2.5 pr-3"><StatusPill status={p.status} /></td>
                  <td className="py-1"><ReceiptButton row={p} /></td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        <ul className="space-y-2 md:hidden">
          {data.items.map((p) => (
            <li key={p.id} className="rounded border border-line bg-panel px-3 py-2.5">
              <div className="flex items-start justify-between gap-3">
                <div className="min-w-0">
                  <Link to={customerPath(`/bookings/${p.bookingId}`)} className={`block break-words text-sm font-medium text-ink ${FOCUS_RING}`}>
                    {p.serviceName}
                  </Link>
                  <p className="text-xs text-muted">{p.bookingRef} · {fmtDate(p.paidAt ?? p.createdAt)}</p>
                </div>
                <p className="shrink-0 text-sm font-semibold tabular-nums text-ink">{formatMoney(p.amount)}</p>
              </div>
              <div className="mt-2 flex flex-wrap items-center justify-between gap-2">
                <div className="flex items-center gap-2">
                  <StatusPill status={p.status} />
                  <span className="text-xs text-muted">{methodLabel(p.method)}</span>
                </div>
                <ReceiptButton row={p} />
              </div>
            </li>
          ))}
        </ul>

        <nav aria-label="Payments pages" className="mt-4 flex items-center justify-between gap-3">
          <button
            type="button"
            onClick={() => setPage((n) => Math.max(1, n - 1))}
            disabled={page <= 1 || isFetching}
            className={`min-h-[44px] rounded border border-line bg-white px-4 text-sm font-medium text-ink hover:bg-canvas disabled:opacity-50 ${FOCUS_RING}`}
          >
            Previous
          </button>
          <span className="text-sm text-muted" aria-live="polite">Page {page} of {totalPages}</span>
          <button
            type="button"
            onClick={() => setPage((n) => Math.min(totalPages, n + 1))}
            disabled={page >= totalPages || isFetching}
            className={`min-h-[44px] rounded border border-line bg-white px-4 text-sm font-medium text-ink hover:bg-canvas disabled:opacity-50 ${FOCUS_RING}`}
          >
            Next
          </button>
        </nav>
      </>
    );
  }

  return (
    <PageShell title="Payments" description="Every payment for your bookings, with receipts.">
      <div className="mb-4 flex items-center gap-2">
        <label htmlFor="payments-status" className="text-sm text-muted">Status</label>
        <select
          id="payments-status"
          value={status}
          onChange={(e) => {
            setStatus(e.target.value as "" | PaymentRecordStatus);
            setPage(1);
          }}
          className={`min-h-[44px] rounded border border-line bg-white px-3 text-sm text-ink ${FOCUS_RING}`}
        >
          {FILTERS.map((f) => (
            <option key={f.value || "all"} value={f.value}>{f.label}</option>
          ))}
        </select>
      </div>
      {content}
    </PageShell>
  );
}
