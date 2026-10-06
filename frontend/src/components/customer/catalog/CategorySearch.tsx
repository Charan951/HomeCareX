import { Search, X } from "lucide-react";
import clsx from "clsx";
import { FOCUS_RING } from "../focusRing";

interface Props {
  value: string;
  onChange: (value: string) => void;
  className?: string;
}

/** Instant, client-side filter over the (small) category list. Pill-shaped to match the topbar. */
export function CategorySearch({ value, onChange, className }: Props) {
  return (
    <div
      role="search"
      className={clsx(
        "relative flex h-12 items-center gap-2 rounded-full border border-line bg-panel pl-1.5 pr-1.5 shadow-[0_6px_18px_-12px_rgba(30,27,46,.25)] transition-[border-color,box-shadow] duration-200 md:h-[52px]",
        "focus-within:border-brand focus-within:shadow-[0_0_0_4px_rgba(67,56,202,.12)]",
        className,
      )}
    >
      <label htmlFor="categories-search" className="sr-only">
        Search categories
      </label>
      <span aria-hidden="true" className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-brand-soft text-brand">
        <Search className="h-4 w-4" />
      </span>
      <input
        id="categories-search"
        type="search"
        value={value}
        maxLength={60}
        autoComplete="off"
        onChange={(e) => onChange(e.target.value)}
        placeholder="Search categories, e.g. cleaning"
        className="h-full min-w-0 flex-1 bg-transparent text-sm text-ink outline-none focus:outline-none focus-visible:outline-none placeholder:text-muted [&::-webkit-search-cancel-button]:hidden"
      />
      {value && (
        <button
          type="button"
          onClick={() => onChange("")}
          aria-label="Clear search"
          className={clsx("flex h-9 w-9 shrink-0 items-center justify-center rounded-full text-muted hover:bg-canvas hover:text-ink", FOCUS_RING)}
        >
          <X className="h-4 w-4" aria-hidden="true" />
        </button>
      )}
    </div>
  );
}
