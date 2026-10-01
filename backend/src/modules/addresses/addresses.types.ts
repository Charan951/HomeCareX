/** Address contract shared by the addresses module, booking flow and customer dashboard. */
export interface AddressDto {
  id: string;
  label: string;
  line1: string;
  area: string | null;
  city: string;
  pincode: string | null;
  isDefault: boolean;
}

export type { Address } from '../../models/Address';

/** Body of POST /customer/addresses. */
export interface CreateAddressInput {
  label: string;
  line1: string;
  area?: string | null;
  city: string;
  pincode?: string | null;
  /** Make this the address used on the dashboard. The first address is always the default. */
  isDefault?: boolean;
}

/** Body of PATCH /customer/addresses/:id — any subset. `null` clears area / pincode. */
export interface UpdateAddressInput {
  label?: string;
  line1?: string;
  area?: string | null;
  city?: string;
  pincode?: string | null;
  /** Only `true` is accepted: pick a different address to move the default. */
  isDefault?: true;
}

/** Raw lean document returned by the repository. */
export interface AddressRow {
  _id: { toString(): string };
  label: string;
  line1: string;
  area?: string | null;
  city: string;
  pincode?: string | null;
  isDefault?: boolean | null;
}
