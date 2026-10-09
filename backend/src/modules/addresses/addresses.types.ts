import type { AddressLabel } from '../../models/Address';

export interface CreateAddressInput {
  label?: AddressLabel;
  contactName?: string;
  contactPhone?: string;
  house?: string;
  street?: string;
  area?: string;
  /** Legacy single-line form; used when house/street are not sent. */
  line1?: string;
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
  house?: string;
  street?: string;
  area?: string;
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
