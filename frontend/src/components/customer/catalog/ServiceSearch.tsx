import { useEffect, useRef, useState } from "react";
import { Search, X } from "lucide-react";
import clsx from "clsx";
import { useDebouncedCallback } from "@/hooks/useDebouncedCallback";
import { FOCUS_RING } from "../focusRing";

interface Props {
  /** The committed query (from the URL). */
  value: string;
  onSearch: (q: string) => void;
}

/** Types freely, commits to the URL after a short pause (or immediately on Enter / clear). */
export function ServiceSearch({ value, onSearch }: Props) {
  const [text, setText] = useState(value);
  /** Last query this box sent up. Lets us tell "the URL caught up with what I typed" from "something else changed the URL". */
  const sent = useRef(value);
  const send = (q: string) => {
    sent.current = q.trim();
    onSearch(q.trim());
  };
  const commit = useDebouncedCallback(send, 350);

  // Follow outside changes (reset filters, back button, dashboard link) but never overwrite text the user is still typing.
  useEffect(() => {
    if (value === sent.current) return;
    sent.current = value;
    setText(value);
  }, [value]);

  return (
    <form
      role="search"
      className="relative flex-1"
      onSubmit={(e) => {
        e.preventDefault();
        send(text);
      }}
    >
      <label htmlFor="services-search" className="sr-only">
        Search services
      </label>
      <Search className="pointer-events-none absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-muted" aria-hidden="true" />
      <input
        id="services-search"
        type="search"
        value={text}
        maxLength={60}
        autoComplete="off"
        onChange={(e) => {
          setText(e.target.value);
          commit(e.target.value);
        }}
        placeholder="Search for a service, e.g. AC repair"
        className={clsx(
          "h-12 w-full rounded-2xl border border-line bg-panel pl-11 pr-11 text-sm text-ink shadow-[0_4px_14px_-8px_rgba(30,27,46,.18)] placeholder:text-muted [&::-webkit-search-cancel-button]:hidden",
          FOCUS_RING,
        )}
      />
      {text && (
        <button
          type="button"
          aria-label="Clear search"
          onClick={() => {
            setText("");
            send("");
          }}
          className={clsx("absolute right-2 top-1/2 flex h-8 w-8 -translate-y-1/2 items-center justify-center rounded-full text-muted hover:bg-canvas", FOCUS_RING)}
        >
          <X className="h-4 w-4" aria-hidden="true" />
        </button>
      )}
    </form>
  );
}
