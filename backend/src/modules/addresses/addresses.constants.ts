/**
 * Whether a pincode is serviceable is decided by the `serviceability.pincodes` setting (Settings module).
 * These areas are only used to label a result (city/state) and to give an address a fallback map
 * location when the client cannot geocode. Matching is by pincode prefix (first 3 digits).
 */
export interface ServiceableArea {
  city: string;
  state: string;
  pincodePrefixes: string[];
  center: { lat: number; lng: number };
}

export const SERVICEABLE_AREAS: ServiceableArea[] = [
  { city: 'Hyderabad', state: 'Telangana', pincodePrefixes: ['500', '501'], center: { lat: 17.385, lng: 78.4867 } },
  { city: 'Warangal', state: 'Telangana', pincodePrefixes: ['506'], center: { lat: 17.9689, lng: 79.5941 } },
];

/** Fallback location for a serviceable pincode whose prefix is not listed above. */
export const DEFAULT_CENTER = SERVICEABLE_AREAS[0].center;

export const MAX_SAVED_ADDRESSES = 10;
