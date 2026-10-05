import { ChevronLeft, ChevronRight } from "lucide-react";
import clsx from "clsx";
import { FOCUS_RING } from "../focusRing";

interface Props {
  page: number;
  totalPages: number;
  onPageChange: (page: number) => void;
  disabled?: boolean;
}

/** 1 … 4 5 6 … 20, always at most 7 slots. */
function pageWindow(page: number, total: number): (number | "gap")[] {
  if (total <= 7) return Array.from({ length: total }, (_, i) => i + 1);
  const out: (number | "gap")[] = [1];
  const start = Math.max(2, Math.min(page - 1, total - 4));
  const end = Math.min(total - 1, Math.max(page + 1, 5));
  if (start > 2) out.push("gap");
  for (let p = start; p <= end; p++) out.push(p);
  if (end < total - 1) out.push("gap");
  out.push(total);
  return out;
}

const BTN = "flex h-11 min-w-[44px] items-center justify-center rounded-full border text-sm font-medium transition-colors";

/** Numbered on tablet and up; a compact "Page 2 of 5" on phones so it never scrolls sideways. */
export function Pagination({ page, totalPages, onPageChange, disabled = false }: Props) {
  if (totalPages <= 1) return null;
  const go = (p: number) => !disabled && p >= 1 && p <= totalPages && p !== page && onPageChange(p);
  return (
    <nav aria-label="Pagination" className="flex items-center justify-center gap-1.5 pt-2">
      <button
        type="button"
        onClick={() => go(page - 1)}
        disabled={disabled || page <= 1}
        aria-label="Previous page"
        className={clsx(BTN, "border-line bg-panel px-3 text-ink hover:border-brand/40 disabled:cursor-not-allowed disabled:opacity-40", FOCUS_RING)}
      >
        <ChevronLeft className="h-4 w-4" aria-hidden="true" />
      </button>

      <p className="px-3 text-sm text-ink sm:hidden" aria-live="polite">
        Page {page} of {totalPages}
      </p>

      <ul className="hidden items-center gap-1.5 sm:flex">
        {pageWindow(page, totalPages).map((p, i) =>
          p === "gap" ? (
            <li key={`gap-${i}`} aria-hidden="true" className="px-1 text-muted">
              …
            </li>
          ) : (
            <li key={p}>
              <button
                type="button"
                onClick={() => go(p)}
                disabled={disabled}
                aria-label={`Page ${p}`}
                aria-current={p === page ? "page" : undefined}
                className={clsx(BTN, p === page ? "border-brand bg-brand text-white" : "border-line bg-panel text-ink hover:border-brand/40", FOCUS_RING)}
              >
                {p}
              </button>
            </li>
          ),
        )}
      </ul>

      <button
        type="button"
        onClick={() => go(page + 1)}
        disabled={disabled || page >= totalPages}
        aria-label="Next page"
        className={clsx(BTN, "border-line bg-panel px-3 text-ink hover:border-brand/40 disabled:cursor-not-allowed disabled:opacity-40", FOCUS_RING)}
      >
        <ChevronRight className="h-4 w-4" aria-hidden="true" />
      </button>
    </nav>
  );
}
