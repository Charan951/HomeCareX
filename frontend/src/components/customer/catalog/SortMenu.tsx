import { useRef, useState } from "react";
import { ArrowUpDown, Check, ChevronDown } from "lucide-react";
import clsx from "clsx";
import { useClickOutside } from "@/hooks/useClickOutside";
import type { ServiceSort as Sort } from "@/types/catalog";
import { SORT_OPTIONS } from "@/pages/customer/Services/serviceParams";
import { FOCUS_RING } from "../focusRing";

interface Props {
  /** Undefined means "the default for this view" (Popular, or Best match while searching). */
  value: Sort | undefined;
  hasQuery: boolean;
  onChange: (sort: Sort) => void;
  className?: string;
}

/** "Sort: Popular" dropdown that sits next to the Filters button. */
export function SortMenu({ value, hasQuery, onChange, className }: Props) {
  const [open, setOpen] = useState(false);
  const buttonRef = useRef<HTMLButtonElement>(null);
  const wrapRef = useClickOutside<HTMLDivElement>(open, () => setOpen(false));
  const current = value ?? (hasQuery ? "relevance" : "popular");
  const options = SORT_OPTIONS.filter((o) => o.id !== "relevance" || hasQuery);
  const currentLabel = options.find((o) => o.id === current)?.label ?? "Popular";

  return (
    <div ref={wrapRef} className={clsx("relative", className)}>
      <button
        ref={buttonRef}
        type="button"
        aria-haspopup="listbox"
        aria-expanded={open}
        onClick={() => setOpen((o) => !o)}
        className={clsx(
          "inline-flex h-12 w-full items-center justify-center gap-2 whitespace-nowrap rounded-full border border-line bg-panel px-4 text-sm font-semibold text-ink transition-colors hover:border-brand",
          FOCUS_RING,
        )}
      >
        <ArrowUpDown className="h-4 w-4 text-muted" aria-hidden="true" />
        <span>
          Sort: <span className="font-medium">{currentLabel}</span>
        </span>
        <ChevronDown className={clsx("h-4 w-4 text-muted transition-transform", open && "rotate-180")} aria-hidden="true" />
      </button>

      {open && (
        <div
          role="listbox"
          aria-label="Sort services"
          className="absolute right-0 top-full z-30 mt-2 w-56 rounded-2xl border border-line bg-panel p-1.5 shadow-xl"
        >
          {options.map((o) => {
            const selected = o.id === current;
            return (
              <button
                key={o.id}
                type="button"
                role="option"
                aria-selected={selected}
                onClick={() => {
                  onChange(o.id);
                  setOpen(false);
                  buttonRef.current?.focus();
                }}
                className={clsx(
                  "flex min-h-[40px] w-full items-center justify-between gap-3 rounded-xl px-3 py-2 text-left text-sm hover:bg-canvas",
                  selected ? "bg-brand-soft font-semibold text-brand" : "font-medium text-ink",
                  FOCUS_RING,
                )}
              >
                {o.label}
                {selected && <Check className="h-4 w-4 shrink-0" aria-hidden="true" />}
              </button>
            );
          })}
        </div>
      )}
    </div>
  );
}
