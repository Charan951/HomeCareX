import { useRef, useState } from "react";
import { Check, ChevronDown, X } from "lucide-react";
import clsx from "clsx";
import { useClickOutside } from "@/hooks/useClickOutside";
import { FOCUS_RING } from "../focusRing";
import type { FilterGroup } from "./ServiceFilters";

function FilterPill({ group }: { group: FilterGroup }) {
  const [open, setOpen] = useState(false);
  const buttonRef = useRef<HTMLButtonElement>(null);
  const wrapRef = useClickOutside<HTMLDivElement>(open, () => setOpen(false));
  const current = group.options.find((o) => o.id === group.value) ?? group.options[0];
  const active = group.value !== group.options[0].id;
  const listId = `filter-pop-${group.key}`;

  return (
    <div ref={wrapRef} className="relative">
      <div
        className={clsx(
          "inline-flex h-10 items-center rounded-full border text-sm transition-colors",
          active ? "border-brand bg-brand-soft text-brand" : "border-line bg-panel text-ink hover:bg-canvas",
          open && !active && "border-ink/30",
        )}
      >
        <button
          ref={buttonRef}
          type="button"
          aria-haspopup="listbox"
          aria-expanded={open}
          aria-controls={open ? listId : undefined}
          onClick={() => setOpen((o) => !o)}
          className={clsx("inline-flex h-full items-center gap-1.5 rounded-full pl-3.5 font-medium", active ? "pr-1.5" : "pr-3", FOCUS_RING)}
        >
          <span className="max-w-[190px] truncate">{active ? `${group.label}: ${current.short ?? current.label}` : group.label}</span>
          <ChevronDown className={clsx("h-4 w-4 transition-transform", open && "rotate-180", !active && "text-muted")} aria-hidden="true" />
        </button>
        {active && (
          <button
            type="button"
            onClick={() => group.onPick(group.options[0].id)}
            aria-label={`Clear ${group.label.toLowerCase()} filter`}
            className={clsx("mr-1 flex h-7 w-7 items-center justify-center rounded-full hover:bg-brand/10", FOCUS_RING)}
          >
            <X className="h-3.5 w-3.5" aria-hidden="true" />
          </button>
        )}
      </div>

      {open && (
        <div
          id={listId}
          role="listbox"
          aria-label={group.label}
          className="absolute left-0 top-full z-30 mt-2 max-h-80 w-64 overflow-y-auto overscroll-contain rounded-2xl border border-line bg-panel p-1.5 shadow-xl"
        >
          {group.options.map((o) => {
            const selected = o.id === group.value;
            return (
              <button
                key={o.id}
                type="button"
                role="option"
                aria-selected={selected}
                onClick={() => {
                  group.onPick(o.id);
                  setOpen(false);
                  buttonRef.current?.focus();
                }}
                className={clsx(
                  "flex min-h-[40px] w-full items-center justify-between gap-3 rounded-xl px-3 py-2 text-left text-sm hover:bg-canvas",
                  selected ? "font-medium text-brand" : "text-ink",
                  FOCUS_RING,
                )}
              >
                <span className="min-w-0 break-words">{o.label}</span>
                {selected && <Check className="h-4 w-4 shrink-0" aria-hidden="true" />}
              </button>
            );
          })}
        </div>
      )}
    </div>
  );
}

interface Props {
  groups: FilterGroup[];
  activeCount: number;
  onClear: () => void;
}

/** Desktop filter row: one compact dropdown pill per filter, sitting right under the search bar. */
export function FilterBar({ groups, activeCount, onClear }: Props) {
  return (
    <div role="group" aria-label="Filter services" className="flex flex-wrap items-center gap-2">
      {groups.map((g) => (
        <FilterPill key={g.key} group={g} />
      ))}
      {activeCount > 0 && (
        <button type="button" onClick={onClear} className={clsx("h-10 rounded-full px-3 text-sm font-semibold text-brand hover:bg-brand-soft", FOCUS_RING)}>
          Clear all
        </button>
      )}
    </div>
  );
}
