/** Saved-address contract (frontend mirror of backend/src/modules/addresses). */

/** The only labels the API accepts. */
export const ADDRESS_LABELS = ["Home", "Work", "Other"] as const;
export type AddressLabel = (typeof ADDRESS_LABELS)[number];

export interface AddressView {
  id: string;
  label: string;
  contactName?: string;
  contactPhone?: string;
  /** What the customer typed. Older addresses only have line1 / line2. */
  house?: string;
  street?: string;
  area?: string;
  /** Derived by the server: house + street. */
  line1: string;
  /** Derived by the server: area. */
  line2?: string;
  landmark?: string;
  city: string;
  state: string;
  pincode: string;
  location?: { lat: number; lng: number };
  isDefault: boolean;
  /** Computed by the server from the pincode; never stored. */
  serviceable: boolean;
}

export interface CreateAddressRequest {
  label?: AddressLabel;
  /** Send house + street (the server derives line1), or line1 on its own for the older single-line form. */
  house?: string;
  street?: string;
  area?: string;
  line1?: string;
  line2?: string;
  landmark?: string;
  city: string;
  state: string;
  pincode: string;
  /** Coordinates picked on the map. Optional: manual entry still works. */
  location?: { lat: number; lng: number };
  isDefault?: boolean;
}

export interface ServiceabilityResult {
  serviceable: boolean;
  pincode: string;
  city?: string;
  state?: string;
}