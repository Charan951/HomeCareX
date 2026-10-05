/** Saved-address contract (frontend mirror of backend/src/modules/addresses). */
export interface AddressView {
  id: string;
  label: string;
  contactName?: string;
  contactPhone?: string;
  line1: string;
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
  label?: string;
  line1: string;
  line2?: string;
  landmark?: string;
  city: string;
  state: string;
  pincode: string;
  isDefault?: boolean;
}

export interface ServiceabilityResult {
  serviceable: boolean;
  pincode: string;
  city?: string;
  state?: string;
}
