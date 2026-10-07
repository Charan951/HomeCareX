import { useId, type ReactNode } from "react";
import { X } from "lucide-react";
import clsx from "clsx";
import { useOverlay } from "@/hooks/useOverlay";
import { FOCUS_RING } from "../focusRing";

interface Props {
  open: boolean;
  onClose: () => void;
  /** Label for the primary button, e.g. "Show 12 services". */
  doneLabel: string;
  /** e.g. "2 applied". */
  subtitle?: string;
  /** When set, a "Clear all" button appears next to the primary button. */
  onClear?: () => void;
  children: ReactNode;
}

/** Filters panel: bottom sheet on mobile / tablet, right-hand side panel on desktop. Escape closes, focus is trapped inside and restored on close, page scroll is locked. */
export function FilterDrawer({ open, onClose, doneLabel, subtitle, onClear, children }: Props) {
  const titleId = useId();
  const panelRef = useOverlay<HTMLDivElement>(open, onClose);
  if (!open) return null;
  return (
    <div className="fixed inset-0 z-50">
      <div className="absolute inset-0 bg-black/40" onClick={onClose} aria-hidden="true" />
      <div
        ref={panelRef}
        role="dialog"
        aria-modal="true"
        aria-labelledby={titleId}
        tabIndex={-1}
        className="absolute inset-x-0 bottom-0 mx-auto flex max-h-[85vh] max-w-lg flex-col rounded-t-3xl bg-panel shadow-2xl outline-none lg:inset-x-auto lg:inset-y-0 lg:right-0 lg:mx-0 lg:max-h-none lg:w-[400px] lg:max-w-[92vw] lg:rounded-none lg:rounded-l-3xl"
      >
        <div className="flex items-center justify-between border-b border-line px-4 py-3">
          <div>
            <h2 id={titleId} className="text-base font-semibold text-ink">
              Filters
            </h2>
            {subtitle && <p className="text-xs text-muted">{subtitle}</p>}
          </div>
          <button
            type="button"
            onClick={onClose}
            aria-label="Close filters"
            className={clsx("flex h-10 w-10 items-center justify-center rounded-full text-ink hover:bg-canvas", FOCUS_RING)}
          >
            <X className="h-5 w-5" aria-hidden="true" />
          </button>
        </div>
        <div className="flex-1 overflow-y-auto overscroll-contain px-4 py-4">{children}</div>
        <div className="flex items-center gap-3 border-t border-line p-4">
          {onClear && (
            <button type="button" onClick={onClear} className={clsx("px-1 py-2 text-sm font-semibold text-brand", FOCUS_RING)}>
              Clear all
            </button>
          )}
          <button
            type="button"
            onClick={onClose}
            className={clsx("min-h-[48px] flex-1 rounded-full bg-brand text-sm font-semibold text-white hover:opacity-90", FOCUS_RING)}
          >
            {doneLabel}
          </button>
        </div>
      </div>
    </div>
  );
}
