import { useEffect, useRef, useState } from "react";
import { Search, X } from "lucide-react";
import clsx from "clsx";
import { useDebouncedCallback } from "@/hooks/useDebouncedCallback";
import { FOCUS_RING } from "@/components/customer/focusRing";

interface Props {
  /** The committed query (from the URL). */
  value: string;
  onSearch: (q: string) => void;
}

/** Types freely, commits after a short pause (or at once on Enter / clear). Matches service name or booking ID. */
export function BookingSearch({ value, onSearch }: Props) {
  const [text, setText] = useState(value);
  /** Last query this box sent up, so we can tell "the URL caught up" from "something else changed it". */
  const sent = useRef(value);
  /** What is in the box right now. A pause-timer that fires for older text must not win over a clear or Enter. */
  const latest = useRef(value);
  const send = (q: string) => {
    const trimmed = q.trim();
    if (trimmed === sent.current) return;
    sent.current = trimmed;
    onSearch(trimmed);
  };
  const commit = useDebouncedCallback((q: string) => {
    if (q === latest.current) send(q);
  }, 350);

  // Follow outside changes (clear filters, back button) but never overwrite text still being typed.
  useEffect(() => {
    if (value === sent.current) return;
    sent.current = value;
    latest.current = value;
    setText(value);
  }, [value]);

  return (
    <form
      role="search"
      className="relative"
      onSubmit={(e) => {
        e.preventDefault();
        send(text);
      }}
    >
      <label htmlFor="booking-search" className="sr-only">
        Search bookings by service or booking ID
      </label>
      <Search
        className="pointer-events-none absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-muted"
        aria-hidden="true"
      />
      <input
        id="booking-search"
        type="search"
        value={text}
        maxLength={60}
        autoComplete="off"
        onChange={(e) => {
          latest.current = e.target.value;
          setText(e.target.value);
          commit(e.target.value);
        }}
        placeholder="Search by service or booking ID, e.g. BK-1A2B3"
        className={clsx(
          "h-12 w-full rounded-2xl border border-line bg-panel pl-11 pr-11 text-sm text-ink placeholder:text-muted [&::-webkit-search-cancel-button]:hidden",
          FOCUS_RING,
        )}
      />
      {text && (
        <button
          type="button"
          aria-label="Clear search"
          onClick={() => {
            latest.current = "";
            setText("");
            send("");
          }}
          className={clsx(
            "absolute right-2 top-1/2 flex h-8 w-8 -translate-y-1/2 items-center justify-center rounded-full text-muted hover:bg-canvas",
            FOCUS_RING,
          )}
        >
          <X className="h-4 w-4" aria-hidden="true" />
        </button>
      )}
    </form>
  );
}
