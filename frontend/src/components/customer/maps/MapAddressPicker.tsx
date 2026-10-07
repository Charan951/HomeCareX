import { useCallback, useEffect, useRef, useState } from "react";
import L from "leaflet";
import "leaflet/dist/leaflet.css";
import { AlertCircle, Crosshair, Loader2, MapPin, Minus, Plus, Search, X } from "lucide-react";
import clsx from "clsx";
import { FOCUS_RING } from "@/components/customer/focusRing";
import { reverseGeocode, searchPlaces, type LatLngLiteral, type PickedLocation, type PlaceResult } from "./osm";

export type { PickedLocation } from "./osm";

/** Hyderabad, used only to open the map somewhere sensible before we know where the customer is. */
const DEFAULT_CENTER: LatLngLiteral = { lat: 17.385, lng: 78.4867 };

interface MapAddressPickerProps {
  /** Existing coordinates (editing an address). The map opens here and does not overwrite the form until the pin is moved. */
  value?: LatLngLiteral | null;
  /** Called after the customer moves the pin, picks a search result, or uses their current location. */
  onPick: (location: PickedLocation) => void;
  /** Ask the browser for the customer's location on first load (only when there is no `value`). */
  autoLocate?: boolean;
  className?: string;
}

type Status = "loading" | "ready" | "unavailable";

/**
 * Swiggy / Zomato style location picker built on free tech: Leaflet + OpenStreetMap tiles + Nominatim.
 * The pin stays fixed in the middle while the map moves underneath it. When the map settles,
 * the position under the pin is reverse-geocoded to a structured address.
 */
export default function MapAddressPicker({ value, onPick, autoLocate = false, className }: MapAddressPickerProps) {
  const mapEl = useRef<HTMLDivElement>(null);
  const mapRef = useRef<L.Map | null>(null);
  /** True when the next "moveend" came from a customer action (drag, search, locate) and should be geocoded. */
  const intent = useRef(false);
  const onPickRef = useRef(onPick);
  onPickRef.current = onPick;
  const requestId = useRef(0);
  const abortRef = useRef<AbortController | null>(null);
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const [status, setStatus] = useState<Status>("loading");
  const [dragging, setDragging] = useState(false);
  const [resolving, setResolving] = useState(false);
  const [picked, setPicked] = useState<PickedLocation | null>(null);
  const [notice, setNotice] = useState<string | null>(null);

  const [query, setQuery] = useState("");
  const [results, setResults] = useState<PlaceResult[]>([]);
  const [searching, setSearching] = useState(false);
  const [locating, setLocating] = useState(false);

  const moveTo = useCallback((position: LatLngLiteral, zoom = 17) => {
    const map = mapRef.current;
    if (!map) return;
    intent.current = true;
    map.setView([position.lat, position.lng], zoom, { animate: true });
  }, []);

  const resolveCenter = useCallback(async () => {
    const map = mapRef.current;
    if (!map) return;
    const c = map.getCenter();
    const position = { lat: c.lat, lng: c.lng };
    const id = ++requestId.current;
    abortRef.current?.abort();
    const controller = new AbortController();
    abortRef.current = controller;
    setResolving(true);
    setNotice(null);
    try {
      const parsed = await reverseGeocode(position, controller.signal);
      if (id !== requestId.current) return; // a newer move superseded this one
      if (!parsed) {
        setPicked(null);
        setNotice("We couldn't find an address for this spot. Try moving the pin slightly.");
        return;
      }
      setPicked(parsed);
      onPickRef.current(parsed);
    } catch (err) {
      if (id !== requestId.current || (err instanceof DOMException && err.name === "AbortError")) return;
      console.warn("[MapAddressPicker] Reverse geocoding failed:", err);
      setNotice("Couldn't look up this location. Check your connection and try again.");
    } finally {
      if (id === requestId.current) setResolving(false);
    }
  }, []);

  const locateMe = useCallback(() => {
    if (!navigator.geolocation) {
      setNotice("Your browser doesn't support location access.");
      return;
    }
    setLocating(true);
    setNotice(null);
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        setLocating(false);
        moveTo({ lat: pos.coords.latitude, lng: pos.coords.longitude });
      },
      () => {
        setLocating(false);
        setNotice("Location access is off. Search for your area or drag the map instead.");
      },
      { enableHighAccuracy: true, timeout: 10_000, maximumAge: 60_000 },
    );
  }, [moveTo]);

  // Create the map once.
  useEffect(() => {
    const el = mapEl.current;
    if (!el) return;

    let map: L.Map;
    try {
      map = L.map(el, {
        center: [(value ?? DEFAULT_CENTER).lat, (value ?? DEFAULT_CENTER).lng],
        zoom: value ? 17 : 14,
        zoomControl: false,
        attributionControl: false, // credited in our own footer strip below
        scrollWheelZoom: true,
        keyboard: true,
      });
      L.tileLayer("https://tile.openstreetmap.org/{z}/{x}/{y}.png", { maxZoom: 19 }).addTo(map);
    } catch (err) {
      console.warn("[MapAddressPicker] Map failed to start:", err);
      setStatus("unavailable");
      return;
    }
    mapRef.current = map;

    map.on("dragstart", () => setDragging(true));
    map.on("dragend", () => {
      intent.current = true;
      setDragging(false);
    });
    // Scroll / pinch / double-click zoom can shift the centre too.
    map.on("zoomstart", () => {
      intent.current = true;
    });
    map.on("moveend", () => {
      if (!intent.current) return;
      intent.current = false;
      if (debounceRef.current) clearTimeout(debounceRef.current);
      // Small pause keeps us well inside Nominatim's 1 request / second limit.
      debounceRef.current = setTimeout(() => void resolveCenter(), 400);
    });

    // The container may be laid out after mount (tabs, drawers, grid), so keep Leaflet's size in sync.
    const ro = typeof ResizeObserver !== "undefined" ? new ResizeObserver(() => map.invalidateSize()) : null;
    ro?.observe(el);
    setTimeout(() => map.invalidateSize(), 0);

    setStatus("ready");
    if (!value && autoLocate) locateMe();

    return () => {
      ro?.disconnect();
      if (debounceRef.current) clearTimeout(debounceRef.current);
      abortRef.current?.abort();
      map.remove();
      mapRef.current = null;
    };
    // The map is created once; later changes to `value` are intentionally not applied.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const submitSearch = async () => {
    const text = query.trim();
    if (text.length < 3) return;
    setSearching(true);
    setNotice(null);
    try {
      const list = await searchPlaces(text);
      setResults(list);
      if (list.length === 0) setNotice("We couldn't find that place. Try a nearby landmark or area name.");
    } catch {
      setResults([]);
      setNotice("Search isn't available right now. Drag the map to set your location.");
    } finally {
      setSearching(false);
    }
  };

  const choose = (place: PlaceResult) => {
    setResults([]);
    setQuery(place.title);
    moveTo(place.position);
  };

  const zoomBy = (delta: number) => mapRef.current?.setZoom((mapRef.current?.getZoom() ?? 14) + delta);

  if (status === "unavailable") {
    return (
      <div className={clsx("flex min-h-[160px] items-center gap-3 rounded-3xl border border-dashed border-line bg-canvas p-5", className)} role="status">
        <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full bg-brand-soft text-brand">
          <MapPin className="h-5 w-5" aria-hidden="true" />
        </span>
        <div>
          <p className="text-sm font-semibold text-ink">The map isn't available right now</p>
          <p className="text-xs text-muted">You can still enter your address in the fields below.</p>
        </div>
      </div>
    );
  }

  const cardOpen = Boolean(picked || notice);

  return (
    <div className={clsx("relative isolate overflow-hidden rounded-3xl border border-line bg-[#ECEEF7]", className)}>
      {/* z-0 keeps Leaflet's internal panes (z-index up to 1000) underneath our overlays */}
      <div ref={mapEl} className="absolute inset-0 z-0" aria-label="Map. Drag to move the pin to your exact location." role="application" />

      {status === "loading" && (
        <div className="absolute inset-0 z-10 flex items-center justify-center bg-canvas/80" role="status">
          <Loader2 className="h-6 w-6 animate-spin text-brand" aria-hidden="true" />
          <span className="sr-only">Loading map…</span>
        </div>
      )}

      {/* Fixed centre pin */}
      {status === "ready" && (
        <div className="pointer-events-none absolute left-1/2 top-1/2 z-10 -translate-x-1/2 -translate-y-full">
          <div className="mb-2 whitespace-nowrap rounded-full bg-ink px-3 py-1.5 text-[11px] font-semibold text-white shadow-lg">
            {dragging ? "Release to set location" : resolving ? "Finding address…" : "Service will happen here"}
          </div>
          <div className={clsx("mx-auto w-fit transition-transform duration-200 motion-reduce:transition-none", dragging && "-translate-y-2")}>
            <svg width="40" height="52" viewBox="0 0 40 52" aria-hidden="true">
              <path d="M20 51C20 51 3 31 3 19.5a17 17 0 1 1 34 0C37 31 20 51 20 51Z" fill="#4338CA" stroke="#fff" strokeWidth="3" />
              <circle cx="20" cy="19.5" r="6.5" fill="#fff" />
            </svg>
          </div>
          <div className={clsx("mx-auto h-1.5 w-4 rounded-full bg-ink/25 blur-[1px] transition-all", dragging ? "scale-75 opacity-60" : "scale-100")} />
        </div>
      )}

      {/* Search (runs on Enter, to respect Nominatim's no-autocomplete policy) */}
      {status === "ready" && (
        <div className="absolute inset-x-3 top-3 z-20">
          <form
            onSubmit={(e) => {
              e.preventDefault();
              void submitSearch();
            }}
            role="search"
            className="flex items-center gap-2 rounded-full border border-line bg-white px-4 shadow-[0_10px_30px_-12px_rgba(30,27,46,.45)]"
          >
            <button type="submit" aria-label="Search" className={clsx("shrink-0 rounded-full p-1 text-muted hover:text-ink", FOCUS_RING)}>
              <Search className="h-4 w-4" aria-hidden="true" />
            </button>
            <input
              type="text"
              value={query}
              onChange={(e) => {
                setQuery(e.target.value);
                if (results.length) setResults([]);
              }}
              placeholder="Search for area, street or landmark, then press Enter"
              aria-label="Search for a location"
              autoComplete="off"
              className="h-11 min-w-0 flex-1 bg-transparent text-sm text-ink outline-none placeholder:text-muted/70"
            />
            {searching && <Loader2 className="h-4 w-4 shrink-0 animate-spin text-muted" aria-hidden="true" />}
            {query && !searching && (
              <button
                type="button"
                onClick={() => {
                  setQuery("");
                  setResults([]);
                }}
                aria-label="Clear search"
                className={clsx("rounded-full p-1 text-muted hover:text-ink", FOCUS_RING)}
              >
                <X className="h-4 w-4" aria-hidden="true" />
              </button>
            )}
          </form>
          {results.length > 0 && (
            <ul role="listbox" aria-label="Search results" className="mt-2 overflow-hidden rounded-2xl border border-line bg-white shadow-[0_18px_40px_-16px_rgba(30,27,46,.5)]">
              {results.map((r) => (
                <li key={r.id} role="option" aria-selected="false">
                  <button
                    type="button"
                    onClick={() => choose(r)}
                    className={clsx("flex w-full items-start gap-3 px-4 py-3 text-left hover:bg-brand-soft/60", FOCUS_RING)}
                  >
                    <MapPin className="mt-0.5 h-4 w-4 shrink-0 text-muted" aria-hidden="true" />
                    <span className="min-w-0">
                      <span className="block truncate text-sm font-semibold text-ink">{r.title}</span>
                      {r.subtitle && <span className="block truncate text-xs text-muted">{r.subtitle}</span>}
                    </span>
                  </button>
                </li>
              ))}
            </ul>
          )}
        </div>
      )}

      {/* Zoom + current location */}
      {status === "ready" && (
        <div className={clsx("absolute right-3 z-20 flex flex-col items-end gap-2", cardOpen ? "bottom-[6.75rem]" : "bottom-9")}>
          <div className="flex flex-col overflow-hidden rounded-full border border-line bg-white shadow-[0_10px_30px_-12px_rgba(30,27,46,.45)]">
            <button type="button" onClick={() => zoomBy(1)} aria-label="Zoom in" className={clsx("flex h-9 w-9 items-center justify-center text-ink hover:bg-brand-soft", FOCUS_RING)}>
              <Plus className="h-4 w-4" aria-hidden="true" />
            </button>
            <button type="button" onClick={() => zoomBy(-1)} aria-label="Zoom out" className={clsx("flex h-9 w-9 items-center justify-center border-t border-line text-ink hover:bg-brand-soft", FOCUS_RING)}>
              <Minus className="h-4 w-4" aria-hidden="true" />
            </button>
          </div>
          <button
            type="button"
            onClick={locateMe}
            disabled={locating}
            className={clsx(
              "inline-flex h-11 items-center gap-2 rounded-full border border-line bg-white px-4 text-xs font-bold text-brand shadow-[0_10px_30px_-12px_rgba(30,27,46,.45)] transition-colors hover:bg-brand-soft disabled:opacity-70",
              FOCUS_RING,
            )}
          >
            {locating ? <Loader2 className="h-4 w-4 animate-spin" aria-hidden="true" /> : <Crosshair className="h-4 w-4" aria-hidden="true" />}
            Use current location
          </button>
        </div>
      )}

      {/* Resolved address */}
      {status === "ready" && cardOpen && (
        <div className="absolute inset-x-3 bottom-9 z-20" aria-live="polite">
          <div className="flex items-start gap-3 rounded-2xl border border-line bg-white/95 px-4 py-3 shadow-[0_10px_30px_-12px_rgba(30,27,46,.45)] backdrop-blur">
            {notice ? (
              <>
                <AlertCircle className="mt-0.5 h-5 w-5 shrink-0 text-amber-600" aria-hidden="true" />
                <p className="text-sm text-ink">{notice}</p>
              </>
            ) : (
              picked && (
                <>
                  <MapPin className="mt-0.5 h-5 w-5 shrink-0 text-brand" aria-hidden="true" />
                  <div className="min-w-0">
                    <p className="truncate text-sm font-bold text-ink">{picked.area || picked.line1 || picked.city}</p>
                    <p className="line-clamp-2 text-xs text-muted">{picked.formatted}</p>
                  </div>
                </>
              )
            )}
          </div>
        </div>
      )}

      {/* Required OpenStreetMap credit */}
      <div className="absolute inset-x-0 bottom-0 z-20 bg-white/85 px-3 py-1 text-[10px] text-muted">
        ©{" "}
        <a href="https://www.openstreetmap.org/copyright" target="_blank" rel="noreferrer" className="underline">
          OpenStreetMap
        </a>{" "}
        contributors
      </div>
    </div>
  );
}
