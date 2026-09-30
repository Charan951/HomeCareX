/** Areas HomeCareX currently serves. Matching is by pincode prefix (first 3 digits). */
export interface ServiceableArea {
  city: string;
  state: string;
  pincodePrefixes: string[];
  /** Used as the address location when the client can't geocode. */
  center: { lat: number; lng: number };
}

export const SERVICEABLE_AREAS: ServiceableArea[] = [
  { city: 'Hyderabad', state: 'Telangana', pincodePrefixes: ['500', '501'], center: { lat: 17.385, lng: 78.4867 } },
  { city: 'Warangal', state: 'Telangana', pincodePrefixes: ['506'], center: { lat: 17.9689, lng: 79.5941 } },
];

export const MAX_SAVED_ADDRESSES = 10;
