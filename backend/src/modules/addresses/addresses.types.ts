export interface CreateAddressInput {
  label?: string;
  contactName?: string;
  contactPhone?: string;
  line1: string;
  line2?: string;
  landmark?: string;
  city: string;
  state: string;
  pincode: string;
  location?: { lat: number; lng: number };
  isDefault?: boolean;
}

/** What the API returns for a saved address (`serviceable` is computed, never stored). */
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
  serviceable: boolean;
}

export interface ServiceabilityResult {
  serviceable: boolean;
  pincode: string;
  city?: string;
  state?: string;
}
