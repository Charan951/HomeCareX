import { useState } from "react";
import { Link } from "react-router-dom";
import {
  Banknote,
  ChevronDown,
  CreditCard,
  Filter,
  Landmark,
  FileText,
  Smartphone,
  Wallet,
} from "lucide-react";
import PageShell from "@/components/layout/PageShell";
import {
  EmptyState,
  ErrorState,
  LoadingState,
  OfflineState,
} from "@/components/customer";
import { FOCUS_RING } from "@/components/customer/focusRing";
import { ReceiptDialog, StatusPill } from "@/components/customer/payments";
import { formatMoney, methodLabel, usePayments } from "@/features/payments";
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

const fmtDate = (iso: string): string =>
  new Date(iso).toLocaleDateString("en-IN", {
    day: "numeric",
    month: "short",
    year: "numeric",
  });

const METHOD_ICON: Record<string, typeof CreditCard> = {
  card: CreditCard,
  upi: Smartphone,
  netbanking: Landmark,
  wallet: Wallet,
  cod: Banknote,
};

/** Method text with a small icon; unchanged label from methodLabel(). */
function MethodCell({ method }: { method: PaymentRow["method"] }) {
  const Icon = method ? METHOD_ICON[method] : undefined;
  if (!method) return <span className="text-muted">{methodLabel(method)}</span>;
  return (
    <span className="inline-flex min-w-0 items-center gap-2 text-ink">
      {Icon && (
        <Icon className="h-4 w-4 shrink-0 text-muted" aria-hidden="true" />
      )}
      <span className="min-w-0 break-words xl:whitespace-nowrap">
        {methodLabel(method)}
      </span>
    </span>
  );
}

/** Receipt link/button. Same behaviour as before; `touch` gives the larger mobile target. */
function ReceiptButton({
  row,
  onOpen,
  touch = false,
}: {
  row: PaymentRow;
  onOpen: (row: PaymentRow) => void;
  touch?: boolean;
}) {
  if (!row.receiptNo)
    return (
      <span className="text-xs text-muted">
        {row.method === "cod" ? "On service" : "—"}
      </span>
    );
  return (
    <button
      type="button"
      onClick={() => onOpen(row)}
      className={`inline-flex items-center justify-center gap-1.5 rounded-lg border border-line bg-white px-3 text-sm font-medium text-brand shadow-sm transition-colors hover:border-brand/40 hover:bg-brand-soft ${
        touch ? "min-h-[44px] w-full" : "h-9"
      } ${FOCUS_RING}`}
    >
      <FileText className="h-4 w-4" aria-hidden="true" />
      Receipt
      <span className="sr-only"> for {row.bookingRef}</span>
    </button>
  );
}

/**
 * Amount, left-aligned so every price starts on the same vertical line.
 * Same text as formatMoney(); paise are muted.
 */
function Amount({ value }: { value: number; stacked?: boolean }) {
  const raw = formatMoney(value);
  const m = raw.match(/^(\D*?)([\d,]+)(\.\d+)?$/);
  if (!m) return <span className="block text-left tabular-nums">{raw}</span>;
  const [, symbol, whole, dec] = m;
  return (
    <span
      className="block whitespace-nowrap text-left tabular-nums"
      style={{ fontVariantNumeric: "tabular-nums lining-nums" }}
    >
      <span className="font-semibold text-ink">
        {symbol}
        {whole}
      </span>
      {dec && <span className="font-medium text-muted">{dec}</span>}
    </span>
  );
}

const TH =
  "px-4 py-3 text-[11px] font-semibold uppercase tracking-wider text-muted";
const LABEL = "text-[11px] font-semibold uppercase tracking-wider text-muted";

/** Payments: route /customer/payments. Transaction, booking, date, amount, method, status, receipt. */
export default function Payments() {
  const online = useOnlineStatus();
  const [page, setPage] = useState(1);
  const [status, setStatus] = useState<"" | PaymentRecordStatus>("");
  const [receiptRow, setReceiptRow] = useState<PaymentRow | null>(null);
  const { data, isLoading, isError, error, refetch, isFetching } = usePayments(
    page,
    status || undefined,
  );

  const totalPages = data ? Math.max(1, Math.ceil(data.total / data.limit)) : 1;

  let content;
  if (isLoading) {
    content = <LoadingState label="Loading your payments…" />;
  } else if (isError || !data) {
    content = !online ? (
      <OfflineState onRetry={() => void refetch()} />
    ) : (
      <ErrorState
        title="Couldn't load your payments"
        message={error?.message}
        onRetry={() => void refetch()}
      />
    );
  } else if (data.items.length === 0) {
    content = (
      <EmptyState
        title={status ? "No payments match this filter" : "No payments yet"}
        description={
          status
            ? "Try a different status."
            : "Your payments and receipts will show up here after your first booking."
        }
        action={
          !status && (
            <Link
              to={customerPath("/services")}
              className={`inline-flex min-h-[44px] items-center rounded-lg bg-brand px-4 text-sm font-medium text-white hover:opacity-90 ${FOCUS_RING}`}
            >
              Browse services
            </Link>
          )
        }
      />
    );
  } else {
    content = (
      <>
        {/* Table: xl and up. */}
        <div className="hidden overflow-hidden rounded-xl border border-line bg-panel xl:block">
          <table className="w-full table-fixed text-left text-sm">
            <caption className="sr-only">Your payments</caption>
            <thead className="border-b border-line bg-canvas">
              <tr>
                <th scope="col" className={`w-[12%] ${TH}`}>
                  Transaction
                </th>
                <th scope="col" className={TH}>
                  Booking
                </th>
                <th scope="col" className={`w-[12%] ${TH}`}>
                  Date
                </th>
                <th scope="col" className={`w-[13%] ${TH}`}>
                  Amount
                </th>
                <th scope="col" className={`w-[17%] ${TH} pl-8`}>
                  Method
                </th>
                <th scope="col" className={`w-[11%] ${TH}`}>
                  Status
                </th>
                <th scope="col" className={`w-[12%] ${TH}`}>
                  Receipt
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-line">
              {data.items.map((p) => (
                <tr key={p.id} className="transition-colors hover:bg-canvas/70">
                  <td
                    className="truncate px-4 py-3.5 font-mono text-xs text-muted"
                    title={p.id}
                  >
                    {p.id.slice(-8).toUpperCase()}
                  </td>
                  <td className="px-4 py-3.5">
                    {/* Non-clickable Booking Info */}
                    <span className="block break-words font-medium text-ink">
                      {p.serviceName}
                    </span>
                    <span className="text-xs text-muted">{p.bookingRef}</span>
                  </td>
                  <td className="px-4 py-3.5 text-muted">
                    {fmtDate(p.paidAt ?? p.createdAt)}
                  </td>
                  <td className="py-3.5 pl-4 pr-4 text-sm">
                    <Amount value={p.amount} />
                  </td>
                  <td className="px-4 py-3.5">
                    <MethodCell method={p.method} />
                  </td>
                  <td className="px-4 py-3.5">
                    <StatusPill status={p.status} />
                  </td>
                  <td className="px-4 py-2.5">
                    <ReceiptButton row={p} onOpen={setReceiptRow} />
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* Cards: below xl (1 column on mobile, 2 on tablet). */}
        <ul className="grid grid-cols-1 gap-3 md:grid-cols-2 xl:hidden">
          {data.items.map((p) => (
            <li
              key={p.id}
              className="flex min-w-0 flex-col rounded-xl border border-line bg-panel p-4 shadow-sm"
            >
              {/* Non-clickable Booking Info */}
              <p className="block break-words text-base font-semibold leading-snug text-ink">
                {p.serviceName}
              </p>
              <p className="mt-0.5 break-all text-sm text-muted">
                {p.bookingRef}
              </p>

              <dl className="mt-3 grid grid-cols-2 gap-x-4 gap-y-3 border-t border-line pt-3 text-sm">
                <div className="col-span-2 min-w-0">
                  <dt className={LABEL}>Transaction</dt>
                  <dd
                    className="mt-0.5 break-all font-mono text-xs text-muted"
                    title={p.id}
                  >
                    {p.id.slice(-8).toUpperCase()}
                  </dd>
                </div>
                <div className="min-w-0">
                  <dt className={LABEL}>Date</dt>
                  <dd className="mt-0.5 text-ink">
                    {fmtDate(p.paidAt ?? p.createdAt)}
                  </dd>
                </div>
                <div className="min-w-0">
                  <dt className={LABEL}>Amount</dt>
                  <dd className="mt-0.5 text-base">
                    <Amount value={p.amount} stacked />
                  </dd>
                </div>
                <div className="min-w-0">
                  <dt className={LABEL}>Method</dt>
                  <dd className="mt-0.5">
                    <MethodCell method={p.method} />
                  </dd>
                </div>
                <div className="min-w-0 text-right">
                  <dt className={LABEL}>Status</dt>
                  <dd className="mt-0.5">
                    <StatusPill status={p.status} />
                  </dd>
                </div>
              </dl>

              {p.receiptNo ? (
                <div className="mt-4">
                  <ReceiptButton row={p} onOpen={setReceiptRow} touch />
                </div>
              ) : (
                <div className="mt-3 border-t border-line pt-3">
                  <p className={LABEL}>Receipt</p>
                  <ReceiptButton row={p} onOpen={setReceiptRow} />
                </div>
              )}
            </li>
          ))}
        </ul>

        <nav
          aria-label="Payments pages"
          className="mt-4 flex items-center justify-between gap-3"
        >
          <span className="text-sm text-muted" aria-live="polite">
            Page {page} of {totalPages}
          </span>
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => setPage((n) => Math.max(1, n - 1))}
              disabled={page <= 1 || isFetching}
              className={`min-h-[44px] rounded-lg border border-line bg-white px-4 text-sm font-medium text-ink shadow-sm hover:bg-canvas disabled:cursor-not-allowed disabled:opacity-50 sm:min-h-[36px] ${FOCUS_RING}`}
            >
              Previous
            </button>
            <button
              type="button"
              onClick={() => setPage((n) => Math.min(totalPages, n + 1))}
              disabled={page >= totalPages || isFetching}
              className={`min-h-[44px] rounded-lg border border-line bg-white px-4 text-sm font-medium text-ink shadow-sm hover:bg-canvas disabled:cursor-not-allowed disabled:opacity-50 sm:min-h-[36px] ${FOCUS_RING}`}
            >
              Next
            </button>
          </div>
        </nav>
      </>
    );
  }

  return (
    <PageShell
      title="Payments"
      description="Every payment for your bookings, with receipts."
    >
      {/* Toolbar: only the existing Status filter. */}
      <div className="mb-4 flex flex-col gap-1.5 sm:flex-row sm:items-center sm:gap-2">
        <label
          htmlFor="payments-status"
          className="inline-flex items-center gap-1.5 text-sm text-muted"
        >
          <Filter className="h-4 w-4" aria-hidden="true" />
          Status
        </label>
        <div className="relative w-full sm:w-44">
          <select
            id="payments-status"
            value={status}
            onChange={(e) => {
              setStatus(e.target.value as "" | PaymentRecordStatus);
              setPage(1);
            }}
            className={`min-h-[44px] w-full appearance-none rounded-lg border border-line bg-white py-0 pl-3 pr-9 text-sm font-medium text-ink shadow-sm hover:border-brand/40 sm:min-h-[40px] ${FOCUS_RING}`}
          >
            {FILTERS.map((f) => (
              <option key={f.value || "all"} value={f.value}>
                {f.label}
              </option>
            ))}
          </select>
          <ChevronDown
            className="pointer-events-none absolute right-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted"
            aria-hidden="true"
          />
        </div>
      </div>
      {content}
      {receiptRow && (
        <ReceiptDialog row={receiptRow} onClose={() => setReceiptRow(null)} />
      )}
    </PageShell>
  );
}