/**
 * Free map helpers: OpenStreetMap data via Nominatim (search + reverse geocoding).
 * No API key and no billing needed.
 *
 * Nominatim usage policy (https://operations.osmfoundation.org/policies/nominatim/):
 *  - max ~1 request per second, no autocomplete-as-you-type, no bulk use
 *  - the browser's Referer identifies the app. For production traffic, host your own
 *    Nominatim or use a provider such as LocationIQ / Geoapify (both have free tiers).
 */

export interface LatLngLiteral {
  lat: number;
  lng: number;
}

/** Structured address parsed from a Nominatim result. */
export interface PickedLocation {
  lat: number;
  lng: number;
  /** Full one-line address, for display. */
  formatted: string;
  /** House / street part, best effort. Customers can refine it. */
  line1: string;
  /** Locality / neighbourhood. */
  area: string;
  city: string;
  state: string;
  pincode: string;
}

export interface PlaceResult {
  id: string;
  title: string;
  subtitle: string;
  position: LatLngLiteral;
}

interface NominatimAddress {
  house_number?: string;
  building?: string;
  road?: string;
  neighbourhood?: string;
  suburb?: string;
  quarter?: string;
  city_district?: string;
  residential?: string;
  city?: string;
  town?: string;
  village?: string;
  municipality?: string;
  county?: string;
  state_district?: string;
  state?: string;
  postcode?: string;
}

interface NominatimItem {
  place_id: number;
  lat: string;
  lon: string;
  name?: string;
  display_name: string;
  address?: NominatimAddress;
  error?: string;
}

const BASE = "https://nominatim.openstreetmap.org";

async function getJson<T>(path: string, params: Record<string, string>, signal?: AbortSignal): Promise<T> {
  const qs = new URLSearchParams({ format: "jsonv2", addressdetails: "1", "accept-language": "en", ...params });
  const res = await fetch(`${BASE}${path}?${qs.toString()}`, { signal, headers: { Accept: "application/json" } });
  if (!res.ok) throw new Error(`NOMINATIM_${res.status}`);
  return (await res.json()) as T;
}

const first = (...values: Array<string | undefined>): string => values.find((v) => v && v.trim())?.trim() ?? "";

/** Turns a reverse-geocode result into the fields the address form needs. Returns null if nothing was found. */
export function parseNominatim(item: NominatimItem | null | undefined, position: LatLngLiteral): PickedLocation | null {
  if (!item || item.error || !item.display_name) return null;
  const a = item.address ?? {};

  const street = [first(a.house_number, a.building), a.road].filter(Boolean).join(", ");
  const line1 = street || first(item.name) || item.display_name.split(",")[0]?.trim() || "";

  return {
    lat: position.lat,
    lng: position.lng,
    formatted: item.display_name,
    line1,
    area: first(a.neighbourhood, a.suburb, a.quarter, a.city_district, a.residential),
    city: first(a.city, a.town, a.village, a.municipality, a.county, a.state_district),
    state: first(a.state),
    pincode: (a.postcode ?? "").replace(/\s/g, ""),
  };
}

/** Coordinates -> address. */
export async function reverseGeocode(position: LatLngLiteral, signal?: AbortSignal): Promise<PickedLocation | null> {
  const item = await getJson<NominatimItem>(
    "/reverse",
    { lat: String(position.lat), lon: String(position.lng), zoom: "18" },
    signal,
  );
  return parseNominatim(item, position);
}

/** Text -> up to 5 places in India. Call on submit (Enter), not on every keystroke. */
export async function searchPlaces(query: string, signal?: AbortSignal): Promise<PlaceResult[]> {
  const items = await getJson<NominatimItem[]>(
    "/search",
    { q: query, limit: "5", countrycodes: "in" },
    signal,
  );
  return items.map((item) => {
    const [title, ...rest] = item.display_name.split(",");
    return {
      id: String(item.place_id),
      title: first(item.name, title),
      subtitle: rest.join(",").trim(),
      position: { lat: Number(item.lat), lng: Number(item.lon) },
    };
  });
}
