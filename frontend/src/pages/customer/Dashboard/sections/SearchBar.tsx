import { useEffect, useMemo, useRef, useState, type CSSProperties, type FormEvent, type KeyboardEvent } from "react";
import { useNavigate } from "react-router-dom";
import { Mic, Search } from "lucide-react";
import clsx from "clsx";
import { customerPath } from "@/routes/customerPath";
import { FOCUS_RING } from "@/components/customer/focusRing";
import { useVoiceSearch } from "@/hooks/useVoiceSearch";
import type { DashboardServiceDto } from "@/features/customer";
import CategoryIcon from "./CategoryIcon";

const MAX_SUGGESTIONS = 6;
const DEFAULT_PLACEHOLDER = "Search for a service, e.g. AC repair";
const PHRASES = ["AC repair", "deep home cleaning", "a haircut at home", "a plumber near me", "pest control"];
/** The mic and Search buttons sit inside the box, leaving ~140-220px for text on phones and iPads, so use short text there. */
const COMPACT_PLACEHOLDER = "Search services";
const COMPACT_PHRASES = ["AC repair", "cleaning", "haircut", "plumber", "pest care"];
/** Below this input width the full-length placeholder would be clipped (needs ~480px). */
const COMPACT_BELOW_PX = 500;
/** Below this not even the short phrases fit, so show a plain static "Search". */
const MINI_BELOW_PX = 285;

/** Types example searches into the placeholder. Stays static when paused (focused / typing / listening) or for reduced motion. */
function useTypedPlaceholder(paused: boolean, compact: boolean, mini: boolean) {
  const fallback = mini ? "Search" : compact ? COMPACT_PLACEHOLDER : DEFAULT_PLACEHOLDER;
  const phrases = compact ? COMPACT_PHRASES : PHRASES;
  const prefix = compact ? "Search " : "Search for ";
  const [text, setText] = useState(fallback);
  useEffect(() => {
    if (paused || mini || window.matchMedia("(prefers-reduced-motion: reduce)").matches) {
      setText(fallback);
      return;
    }
    let i = 0;
    let c = 0;
    let grow = true;
    const id = window.setInterval(() => {
      const phrase = phrases[i];
      if (grow) {
        c += 1;
        if (c > phrase.length + 14) grow = false; // hold the full phrase briefly
      } else {
        c -= 2;
        if (c <= 0) {
          c = 0;
          grow = true;
          i = (i + 1) % phrases.length;
        }
      }
      setText(`${prefix}${phrase.slice(0, Math.min(Math.max(c, 0), phrase.length))}|`);
    }, 90);
    return () => window.clearInterval(id);
  }, [paused, mini, fallback, phrases, prefix]);
  return text;
}

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
  const inputRef = useRef<HTMLInputElement>(null);
  // Decided by the box's real width (not the screen's), so an iPad with the sidebar open gets short text too.
  const [inputWidth, setInputWidth] = useState(Infinity);
  useEffect(() => {
    const el = inputRef.current;
    if (!el) return;
    const ro = new ResizeObserver(() => setInputWidth(el.offsetWidth));
    ro.observe(el);
    return () => ro.disconnect();
  }, []);
  const typed = useTypedPlaceholder(open || query.length > 0, inputWidth < COMPACT_BELOW_PX, inputWidth < MINI_BELOW_PX);
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
    <div ref={wrapperRef} className="hero-rise relative mx-auto mt-6 max-w-2xl text-left" style={{ "--i": 3 } as CSSProperties}>
      <form onSubmit={onSubmit} role="search" className="relative">
        <label htmlFor={inputId} className="sr-only">
          Search for a service
        </label>
        <Search className="pointer-events-none absolute left-3.5 top-1/2 h-4 w-4 sm:left-5 -translate-y-1/2 text-muted" aria-hidden="true" />
        <input
          id={inputId}
          ref={inputRef}
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
          placeholder={voice.listening ? "Listening…" : (voice.error ?? typed)}
          className={`h-14 w-full text-ellipsis rounded-full border border-[#D9DCF7] bg-white pl-10 text-sm text-ink sm:pl-12 sm:text-[15px] shadow-[0_22px_40px_-22px_rgba(67,56,202,.5)] transition-[box-shadow,transform] duration-200 hover:-translate-y-0.5 focus:border-brand focus:shadow-[0_0_0_5px_rgba(67,56,202,.16),0_26px_44px_-22px_rgba(67,56,202,.55)] ${voice.error && !voice.listening ? "placeholder:text-danger" : "placeholder:text-muted"} ${voice.supported ? "pr-[6.25rem] sm:pr-44" : "pr-16 sm:pr-32"} ${FOCUS_RING}`}
        />
        {voice.supported && (
          <button
            type="button"
            onClick={voice.toggle}
            aria-pressed={voice.listening}
            aria-label={voice.listening ? "Stop voice search" : "Search by voice"}
            className={clsx(
              "hero-mic absolute right-[3.5rem] top-1/2 flex h-9 w-9 -translate-y-1/2 sm:right-[6.6rem] sm:h-10 sm:w-10 items-center justify-center rounded-full transition-colors",
              voice.listening ? "bg-danger text-white ring-4 ring-danger/25" : "bg-brand-soft text-brand hover:bg-brand/10",
              FOCUS_RING,
            )}
          >
            <Mic className={clsx("h-[18px] w-[18px]", voice.listening && "motion-safe:animate-pulse")} aria-hidden="true" />
          </button>
        )}
        <button
          type="submit"
          aria-label="Search"
          className="hero-shine absolute right-2 top-1/2 flex min-h-[44px] w-11 -translate-y-1/2 items-center justify-center rounded-full bg-accent text-sm font-semibold sm:w-auto sm:px-5 text-ink shadow-[0_12px_20px_-10px_rgba(255,138,61,.9)] transition-transform hover:scale-[1.03] focus-visible:outline focus-visible:outline-2 focus-visible:outline-brand active:scale-95"
        >
          <Search className="h-[18px] w-[18px] sm:hidden" aria-hidden="true" />
          <span className="hidden sm:inline">Search</span>
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
