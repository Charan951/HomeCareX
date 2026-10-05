import { useEffect, useMemo, useRef, useState, type FormEvent, type KeyboardEvent } from "react";
import { useNavigate } from "react-router-dom";
import { Mic, Search } from "lucide-react";
import clsx from "clsx";
import { customerPath } from "@/routes/customerPath";
import { FOCUS_RING } from "@/components/customer/focusRing";
import { useVoiceSearch } from "@/hooks/useVoiceSearch";
import type { DashboardServiceDto } from "@/features/customer";
import CategoryIcon from "./CategoryIcon";

const MAX_SUGGESTIONS = 6;

/**
 * Live search box. Suggestions come from the services the dashboard already loaded;
 * pressing Enter (or choosing "See all results") opens Services with the full
 * server-side result list for the query.
 */
export default function SearchBar({ services }: { services: DashboardServiceDto[] }) {
  const navigate = useNavigate();
  const [query, setQuery] = useState("");
  const [open, setOpen] = useState(false);
  const [activeIndex, setActiveIndex] = useState(-1);
  const wrapperRef = useRef<HTMLDivElement>(null);
  const inputId = "dashboard-search";
  const listId = "dashboard-search-results";

  const q = query.trim();
  const results = useMemo(() => {
    const needle = q.toLowerCase();
    if (!needle) return [];
    return services.filter((s) => s.name.toLowerCase().includes(needle)).slice(0, MAX_SUGGESTIONS);
  }, [q, services]);
  // Last option is always "See all results" so a query with no local match still goes somewhere useful.
  const optionCount = results.length + 1;

  useEffect(() => {
    setActiveIndex(-1);
  }, [query]);

  useEffect(() => {
    if (!open) return;
    function onMouseDown(e: MouseEvent) {
      if (wrapperRef.current && !wrapperRef.current.contains(e.target as Node)) setOpen(false);
    }
    document.addEventListener("mousedown", onMouseDown);
    return () => document.removeEventListener("mousedown", onMouseDown);
  }, [open]);

  function goToService(service: DashboardServiceDto) {
    setOpen(false);
    setQuery("");
    navigate(customerPath(`/book/${service.slug}`));
  }

  function goToResults() {
    setOpen(false);
    navigate(q ? `${customerPath("/services")}?q=${encodeURIComponent(q)}` : customerPath("/services"));
  }

  // Voice: words appear in the box as you speak; when you stop, we open the full results for them.
  const voice = useVoiceSearch({
    onTranscript: (text) => setQuery(text),
    onFinal: (text) => {
      setQuery(text);
      setOpen(false);
      navigate(`${customerPath("/services")}?q=${encodeURIComponent(text)}`);
    },
  });

  function onSubmit(e: FormEvent) {
    e.preventDefault();
    goToResults();
  }

  function onKeyDown(e: KeyboardEvent<HTMLInputElement>) {
    if (!open || !q) return;
    if (e.key === "ArrowDown") {
      e.preventDefault();
      setActiveIndex((i) => (i + 1) % optionCount);
    } else if (e.key === "ArrowUp") {
      e.preventDefault();
      setActiveIndex((i) => (i <= 0 ? optionCount - 1 : i - 1));
    } else if (e.key === "Enter" && activeIndex >= 0) {
      e.preventDefault();
      if (activeIndex < results.length) goToService(results[activeIndex]);
      else goToResults();
    } else if (e.key === "Escape") {
      setOpen(false);
    }
  }

  return (
    <div ref={wrapperRef} className="relative mt-4">
      <form onSubmit={onSubmit} role="search" className="relative">
        <label htmlFor={inputId} className="sr-only">
          Search for a service
        </label>
        <Search className="pointer-events-none absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-muted" aria-hidden="true" />
        <input
          id={inputId}
          type="search"
          role="combobox"
          aria-expanded={open && q.length > 0}
          aria-controls={listId}
          aria-autocomplete="list"
          aria-activedescendant={activeIndex >= 0 ? `${listId}-${activeIndex}` : undefined}
          autoComplete="off"
          value={query}
          onChange={(e) => {
            setQuery(e.target.value);
            setOpen(true);
          }}
          onFocus={() => setOpen(true)}
          onKeyDown={onKeyDown}
          placeholder={voice.listening ? "Listening…" : (voice.error ?? "Search for a service, e.g. AC repair")}
          className={`w-full rounded-2xl border border-white/20 bg-white py-3.5 pl-11 text-sm text-ink shadow-[0_10px_28px_rgba(20,15,80,.25)] ${voice.error && !voice.listening ? "placeholder:text-danger" : "placeholder:text-muted"} ${voice.supported ? "pr-40" : "pr-24 sm:pr-28"} ${FOCUS_RING}`}
        />
        {voice.supported && (
          <button
            type="button"
            onClick={voice.toggle}
            aria-pressed={voice.listening}
            aria-label={voice.listening ? "Stop voice search" : "Search by voice"}
            className={clsx(
              "absolute right-[6.3rem] top-1/2 flex h-10 w-10 -translate-y-1/2 items-center justify-center rounded-full transition-colors",
              voice.listening ? "bg-danger text-white ring-4 ring-danger/25" : "bg-brand-soft text-brand hover:bg-brand/10",
              FOCUS_RING,
            )}
          >
            <Mic className={clsx("h-[18px] w-[18px]", voice.listening && "motion-safe:animate-pulse")} aria-hidden="true" />
          </button>
        )}
        <button
          type="submit"
          className="absolute right-1.5 top-1/2 min-h-[40px] -translate-y-1/2 rounded-xl bg-accent px-4 text-sm font-semibold text-ink transition-transform hover:scale-[1.03] focus-visible:outline focus-visible:outline-2 focus-visible:outline-white active:scale-95"
        >
          Search
        </button>
      </form>

      {open && q && (
        <ul
          id={listId}
          role="listbox"
          aria-label="Matching services"
          className="absolute z-20 mt-2 w-full overflow-hidden rounded-2xl border border-line bg-panel text-ink shadow-xl"
        >
          {results.map((s, i) => (
            <li key={s.id} id={`${listId}-${i}`} role="option" aria-selected={i === activeIndex}>
              <button
                type="button"
                onMouseDown={(e) => e.preventDefault()} // keep focus in the input until the click registers
                onClick={() => goToService(s)}
                onMouseEnter={() => setActiveIndex(i)}
                className={clsx(
                  "flex min-h-[44px] w-full items-center gap-3 px-4 py-2.5 text-left text-sm",
                  i === activeIndex ? "bg-brand-soft" : "hover:bg-canvas",
                )}
              >
                <CategoryIcon icon={s.icon} className="shrink-0 text-lg" />
                <span className="min-w-0 flex-1 truncate font-medium text-ink">{s.name}</span>
                <span className="shrink-0 font-medium text-ink">₹{s.price}</span>
              </button>
            </li>
          ))}
          <li id={`${listId}-${results.length}`} role="option" aria-selected={activeIndex === results.length}>
            <button
              type="button"
              onMouseDown={(e) => e.preventDefault()}
              onClick={goToResults}
              onMouseEnter={() => setActiveIndex(results.length)}
              className={clsx(
                "flex min-h-[44px] w-full items-center gap-2 px-4 py-2.5 text-left text-sm font-medium text-brand",
                activeIndex === results.length ? "bg-brand-soft" : "hover:bg-canvas",
              )}
            >
              <Search className="h-4 w-4 shrink-0" aria-hidden="true" />
              <span className="truncate">See all results for “{q}”</span>
            </button>
          </li>
        </ul>
      )}

      {/* Spoken status for screen readers only: nothing is added to the layout while listening. */}
      <p role="status" aria-live="polite" className="sr-only">
        {voice.listening ? "Listening, speak now" : (voice.error ?? "")}
      </p>
    </div>
  );
}
