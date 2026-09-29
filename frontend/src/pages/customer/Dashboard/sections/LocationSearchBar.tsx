import { useEffect, useMemo, useRef, useState, type FormEvent, type KeyboardEvent } from "react";
import { useNavigate } from "react-router-dom";
import { MapPin, Search } from "lucide-react";
import clsx from "clsx";
import { customerPath } from "@/routes/customerPath";
import { FOCUS_RING } from "@/components/customer/focusRing";
import { CATEGORIES, SERVICES, type Address, type Service } from "@/mocks/customerMockData";

interface LocationSearchBarProps {
  address: Address | undefined;
}

const MAX_SUGGESTIONS = 6;

function matchingServices(query: string): Service[] {
  const q = query.trim().toLowerCase();
  if (!q) return [];
  return SERVICES.filter((s) => {
    const category = CATEGORIES.find((c) => c.id === s.categoryId);
    return s.name.toLowerCase().includes(q) || category?.name.toLowerCase().includes(q);
  }).slice(0, MAX_SUGGESTIONS);
}

/**
 * Delivery location + a live search box: matching services appear in a
 * dropdown on every keystroke (no submit needed), the same way the Services
 * page filters. Picking one goes straight to Book now for that service;
 * pressing Enter with the list open goes to Services with the full results.
 */
export default function LocationSearchBar({ address }: LocationSearchBarProps) {
  const navigate = useNavigate();
  const [query, setQuery] = useState("");
  const [open, setOpen] = useState(false);
  const [activeIndex, setActiveIndex] = useState(-1);
  const wrapperRef = useRef<HTMLDivElement>(null);
  const inputId = "dashboard-search";
  const listId = "dashboard-search-results";

  const results = useMemo(() => matchingServices(query), [query]);

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

  function goToService(service: Service) {
    setOpen(false);
    setQuery("");
    navigate(customerPath(`/book/${service.slug}`));
  }

  function onSubmit(e: FormEvent) {
    e.preventDefault();
    const q = query.trim();
    setOpen(false);
    navigate(q ? `${customerPath("/services")}?q=${encodeURIComponent(q)}` : customerPath("/services"));
  }

  function onKeyDown(e: KeyboardEvent<HTMLInputElement>) {
    if (!open || results.length === 0) return;
    if (e.key === "ArrowDown") {
      e.preventDefault();
      setActiveIndex((i) => (i + 1) % results.length);
    } else if (e.key === "ArrowUp") {
      e.preventDefault();
      setActiveIndex((i) => (i <= 0 ? results.length - 1 : i - 1));
    } else if (e.key === "Enter" && activeIndex >= 0) {
      e.preventDefault();
      goToService(results[activeIndex]);
    } else if (e.key === "Escape") {
      setOpen(false);
    }
  }

  return (
    <div className="space-y-3">
      <div className="flex items-center gap-1.5 text-sm text-muted">
        <MapPin className="h-4 w-4 shrink-0 text-brand" aria-hidden="true" />
        <span className="truncate">
          Delivering to: <span className="font-medium text-ink">{address ? address.label : "No address added"}</span>
        </span>
      </div>

      <div ref={wrapperRef} className="relative">
        <form onSubmit={onSubmit} role="search">
          <label htmlFor={inputId} className="sr-only">
            Search for a service
          </label>
          <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted" aria-hidden="true" />
          <input
            id={inputId}
            type="search"
            role="combobox"
            aria-expanded={open}
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
            placeholder="Search for a service, e.g. AC repair"
            className={`w-full rounded border border-line bg-panel py-2.5 pl-9 pr-3 text-sm text-ink placeholder:text-muted ${FOCUS_RING}`}
          />
        </form>

        {open && query.trim() && (
          <ul
            id={listId}
            role="listbox"
            aria-label="Matching services"
            className="absolute z-20 mt-1 w-full overflow-hidden rounded border border-line bg-panel shadow-lg"
          >
            {results.length === 0 ? (
              <li className="px-4 py-3 text-sm text-muted">No services match "{query}".</li>
            ) : (
              results.map((s, i) => {
                const category = CATEGORIES.find((c) => c.id === s.categoryId);
                return (
                  <li key={s.id} id={`${listId}-${i}`} role="option" aria-selected={i === activeIndex}>
                    <button
                      type="button"
                      onMouseDown={(e) => e.preventDefault()} // keep focus in the input until click registers
                      onClick={() => goToService(s)}
                      onMouseEnter={() => setActiveIndex(i)}
                      className={clsx(
                        "flex w-full items-center gap-3 px-4 py-2.5 text-left text-sm",
                        i === activeIndex ? "bg-brand-soft" : "hover:bg-canvas",
                      )}
                    >
                      <span className="text-lg shrink-0">{category?.icon}</span>
                      <span className="min-w-0 flex-1">
                        <span className="block truncate font-medium text-ink">{s.name}</span>
                        <span className="block truncate text-xs text-muted">{category?.name}</span>
                      </span>
                      <span className="shrink-0 font-medium text-ink">₹{s.price}</span>
                    </button>
                  </li>
                );
              })
            )}
            {results.length > 0 && (
              <li className="border-t border-line">
                <button
                  type="button"
                  onMouseDown={(e) => e.preventDefault()}
                  onClick={() => onSubmit({ preventDefault: () => {} } as FormEvent)}
                  className="w-full px-4 py-2.5 text-left text-sm font-medium text-brand hover:bg-canvas"
                >
                  See all results for "{query}"
                </button>
              </li>
            )}
          </ul>
        )}
      </div>
    </div>
  );
}
