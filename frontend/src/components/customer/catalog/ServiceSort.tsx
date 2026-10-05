import { ArrowUpDown } from "lucide-react";
import clsx from "clsx";
import type { ServiceSort as Sort } from "@/types/catalog";
import { SORT_OPTIONS } from "@/pages/customer/Services/serviceParams";
import { FOCUS_RING } from "../focusRing";

interface Props {
  /** Undefined means "the default for this view". */
  value: Sort | undefined;
  hasQuery: boolean;
  onChange: (sort: Sort) => void;
  className?: string;
}

export function ServiceSort({ value, hasQuery, onChange, className }: Props) {
  const current = value ?? (hasQuery ? "relevance" : "popular");
  const options = SORT_OPTIONS.filter((o) => o.id !== "relevance" || hasQuery);
  return (
    <div className={clsx("relative", className)}>
      <label htmlFor="services-sort" className="sr-only">
        Sort services
      </label>
      <ArrowUpDown className="pointer-events-none absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-muted" aria-hidden="true" />
      <select
        id="services-sort"
        value={current}
        onChange={(e) => onChange(e.target.value as Sort)}
        className={clsx("h-12 w-full appearance-none rounded-2xl border border-line bg-panel pl-10 pr-4 text-sm font-medium text-ink", FOCUS_RING)}
      >
        {options.map((o) => (
          <option key={o.id} value={o.id}>
            {o.label}
          </option>
        ))}
      </select>
    </div>
  );
}
