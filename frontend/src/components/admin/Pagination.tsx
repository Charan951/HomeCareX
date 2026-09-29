import React from 'react';
import { ChevronLeft, ChevronRight } from 'lucide-react';

interface PaginationProps {
  /** 1-based */
  page: number;
  pageSize: number;
  total: number;
  onPageChange: (page: number) => void;
  onPageSizeChange?: (size: number) => void;
  pageSizeOptions?: number[];
}

/** 1 … 4 5 [6] 7 8 … 20 */
function pageWindow(page: number, pages: number): (number | '…')[] {
  if (pages <= 7) return Array.from({ length: pages }, (_, i) => i + 1);
  const out: (number | '…')[] = [1];
  const start = Math.max(2, page - 1);
  const end = Math.min(pages - 1, page + 1);
  if (start > 2) out.push('…');
  for (let p = start; p <= end; p++) out.push(p);
  if (end < pages - 1) out.push('…');
  out.push(pages);
  return out;
}

export const Pagination: React.FC<PaginationProps> = ({
  page, pageSize, total, onPageChange, onPageSizeChange, pageSizeOptions = [10, 25, 50],
}) => {
  const pages = Math.max(1, Math.ceil(total / pageSize));
  const current = Math.min(page, pages);
  const from = total === 0 ? 0 : (current - 1) * pageSize + 1;
  const to = Math.min(total, current * pageSize);

  return (
    <div className="hcx-pagination">
      <p className="hcx-pagination__range" aria-live="polite">
        {from}–{to} of {total}
      </p>

      {onPageSizeChange && (
        <label className="hcx-pagination__size">
          Rows
          <select value={pageSize} onChange={(e) => onPageSizeChange(Number(e.target.value))}>
            {pageSizeOptions.map((n) => (
              <option key={n} value={n}>{n}</option>
            ))}
          </select>
        </label>
      )}

      <nav className="hcx-pagination__nav" aria-label="Pagination">
        <button type="button" className="hcx-page-btn" disabled={current <= 1} onClick={() => onPageChange(current - 1)} aria-label="Previous page">
          <ChevronLeft size={16} />
        </button>
        {pageWindow(current, pages).map((p, i) =>
          p === '…' ? (
            <span key={`gap-${i}`} className="hcx-page-gap">…</span>
          ) : (
            <button
              key={p}
              type="button"
              className={`hcx-page-btn hcx-page-num${p === current ? ' is-active' : ''}`}
              aria-current={p === current ? 'page' : undefined}
              onClick={() => onPageChange(p)}
            >
              {p}
            </button>
          ),
        )}
        <button type="button" className="hcx-page-btn" disabled={current >= pages} onClick={() => onPageChange(current + 1)} aria-label="Next page">
          <ChevronRight size={16} />
        </button>
      </nav>
    </div>
  );
};

export default Pagination;
