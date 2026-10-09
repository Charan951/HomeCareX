import { useRef, type KeyboardEvent, type ReactNode } from "react";
import clsx from "clsx";
import { FOCUS_RING } from "@/components/customer/focusRing";
import type { BookingTab } from "@/types/bookingList";
import { TABS } from "../bookingTabs";

interface Props {
  active: BookingTab;
  onChange: (tab: BookingTab) => void;
  /** id of the element these tabs control, so screen readers can link tab and panel. */
  panelId: string;
  /** Sits at the right end of the tab row (the filter button). */
  trailing?: ReactNode;
}

export const tabId = (tab: BookingTab): string => `booking-tab-${tab}`;

/**
 * Upcoming / Live / Completed / Cancelled, with an optional action at the right.
 * ARIA tabs pattern: one tab stop, arrows/Home/End move between tabs.
 */
export function BookingTabs({ active, onChange, panelId, trailing }: Props) {
  const refs = useRef<Partial<Record<BookingTab, HTMLButtonElement | null>>>(
    {},
  );

  const move = (e: KeyboardEvent<HTMLButtonElement>, index: number) => {
    let next = index;
    if (e.key === "ArrowRight") next = (index + 1) % TABS.length;
    else if (e.key === "ArrowLeft")
      next = (index - 1 + TABS.length) % TABS.length;
    else if (e.key === "Home") next = 0;
    else if (e.key === "End") next = TABS.length - 1;
    else return;

    e.preventDefault();
    const target = TABS[next].id;
    onChange(target);
    refs.current[target]?.focus();
  };

  return (
    <div className="flex items-center gap-2 border-b border-line">
      <div
        role="tablist"
        aria-label="Booking status"
        className="grid min-w-0 flex-1 grid-cols-4"
      >
        {TABS.map((tab, i) => {
          const selected = tab.id === active;
          return (
            <button
              key={tab.id}
              ref={(el) => {
                refs.current[tab.id] = el;
              }}
              id={tabId(tab.id)}
              type="button"
              role="tab"
              aria-selected={selected}
              aria-controls={panelId}
              tabIndex={selected ? 0 : -1}
              onClick={() => onChange(tab.id)}
              onKeyDown={(e) => move(e, i)}
              className={clsx(
                "-mb-px min-h-[44px] truncate border-b-2 px-0.5 text-[13px] font-medium transition-colors sm:px-1 sm:text-sm",
                selected
                  ? "border-brand text-brand"
                  : "border-transparent text-muted hover:text-ink",
                FOCUS_RING,
              )}
            >
              {tab.label}
            </button>
          );
        })}
      </div>
      {trailing && <div className="shrink-0 pb-1">{trailing}</div>}
    </div>
  );
}
