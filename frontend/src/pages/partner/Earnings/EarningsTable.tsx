import { ChevronLeft, ChevronRight } from "lucide-react";
import type { LedgerRow, Pagination } from "@/types/earnings";
import { dateFromInstant, inr } from "./earningsFormat";

interface Props {
  rows: LedgerRow[];
  pagination: Pagination;
  onPage: (page: number) => void;
  busy: boolean;
}

export default function EarningsTable({ rows, pagination, onPage, busy }: Props) {
  const { page, pages, total, limit } = pagination;
  const firstRow = total === 0 ? 0 : (page - 1) * limit + 1;
  const lastRow = Math.min(page * limit, total);

  return (
    <div className="earn-table-card" aria-busy={busy}>
      <div className="earn-table-wrap" tabIndex={0} role="region" aria-label="Earnings list">
        <table className="earn-table">
          <thead>
            <tr>
              <th scope="col">Date</th>
              <th scope="col">Service</th>
              <th scope="col" className="earn-num">Gross</th>
              <th scope="col" className="earn-num">Commission</th>
              <th scope="col" className="earn-num">You earned</th>
              <th scope="col">Status</th>
            </tr>
          </thead>
          <tbody>
            {rows.map((r) => (
              <tr key={r.id}>
                <td className="earn-c-date">{dateFromInstant(r.earnedAt)}</td>
                <td className="earn-service earn-c-service">{r.serviceName ?? "Service unavailable"}</td>
                <td className="earn-num earn-c-gross" data-label="Gross">{inr(r.gross)}</td>
                <td className="earn-num earn-muted-cell earn-c-comm" data-label="Commission">
                  {inr(r.commission)} <span>({Math.round(r.commissionRate * 10_000) / 100}%)</span>
                </td>
                <td className="earn-num earn-net earn-c-net">{inr(r.net)}</td>
                <td className="earn-c-status">
                  <span className={`earn-status earn-status--${r.status}`}>
                    {r.status === "settled" ? "Paid out" : "Pending"}
                  </span>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <nav className="earn-pager" aria-label="Earnings pages">
        <p aria-live="polite">{total === 0 ? "No rows" : `${firstRow}-${lastRow} of ${total}`}</p>
        <div>
          <button type="button" onClick={() => onPage(page - 1)} disabled={page <= 1 || busy} aria-label="Previous page">
            <ChevronLeft size={16} aria-hidden /> Prev
          </button>
          <span>
            Page {page} of {pages}
          </span>
          <button type="button" onClick={() => onPage(page + 1)} disabled={page >= pages || busy} aria-label="Next page">
            Next <ChevronRight size={16} aria-hidden />
          </button>
        </div>
      </nav>
    </div>
  );
}