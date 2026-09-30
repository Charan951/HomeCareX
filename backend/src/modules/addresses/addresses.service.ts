import { AppError } from '../../utils/AppError';
import type { IAddress } from '../../models/Address';
import { addressesRepository } from './addresses.repository';
import { MAX_SAVED_ADDRESSES, SERVICEABLE_AREAS } from './addresses.constants';
import type { AddressView, CreateAddressInput, ServiceabilityResult } from './addresses.types';

export interface ResolvedAddress {
  label?: string;
  contactName?: string;
  contactPhone?: string;
  line1: string;
  line2?: string;
  landmark?: string;
  city: string;
  state: string;
  pincode: string;
  location: { lat: number; lng: number };
  sourceAddressId?: string;
}

class AddressesService {
  checkServiceability(pincode: string): ServiceabilityResult {
    const prefix = pincode.slice(0, 3);
    const area = SERVICEABLE_AREAS.find((a) => a.pincodePrefixes.includes(prefix));
    return area
      ? { serviceable: true, pincode, city: area.city, state: area.state }
      : { serviceable: false, pincode };
  }

  /** Throws 422 ADDRESS_NOT_SERVICEABLE; returns the matched area's centre for location fallback. */
  assertServiceable(pincode: string): { lat: number; lng: number } {
    const prefix = pincode.slice(0, 3);
    const area = SERVICEABLE_AREAS.find((a) => a.pincodePrefixes.includes(prefix));
    if (!area) {
      throw new AppError(422, 'ADDRESS_NOT_SERVICEABLE', "Sorry, we don't service that area yet. Please choose a different address.", {
        pincode,
      });
    }
    return area.center;
  }

  async list(customerId: string): Promise<AddressView[]> {
    const rows = await addressesRepository.listByCustomer(customerId);
    return rows.map((r) => this.toView(r));
  }

  async create(customerId: string, input: CreateAddressInput): Promise<AddressView> {
    if ((await addressesRepository.countByCustomer(customerId)) >= MAX_SAVED_ADDRESSES) {
      throw new AppError(409, 'ADDRESS_LIMIT_REACHED', `You can save up to ${MAX_SAVED_ADDRESSES} addresses.`);
    }
    const serviceable = this.checkServiceability(input.pincode).serviceable;
    const isFirst = (await addressesRepository.countByCustomer(customerId)) === 0;
    const makeDefault = Boolean(input.isDefault) || isFirst;
    if (makeDefault) await addressesRepository.clearDefault(customerId);

    const created = await addressesRepository.create({
      ...input,
      customerId,
      isDefault: makeDefault,
      // Only serviceable pincodes get a fallback location; others simply have none.
      location: input.location ?? (serviceable ? this.assertServiceable(input.pincode) : undefined),
    });
    return this.toView(created);
  }

  async update(customerId: string, addressId: string, input: Partial<CreateAddressInput>): Promise<AddressView> {
    const existing = await addressesRepository.findOwned(addressId, customerId);
    if (!existing) {
      throw new AppError(404, 'ADDRESS_NOT_FOUND', 'That address was not found');
    }

    if (input.isDefault) {
      await addressesRepository.clearDefault(customerId);
    }

    const serviceable = input.pincode ? this.checkServiceability(input.pincode).serviceable : true;

    const updated = await addressesRepository.update(addressId, customerId, {
      ...input,
      location: input.pincode
        ? (input.location ?? (serviceable ? this.assertServiceable(input.pincode) : undefined))
        : existing.location,
    });

    if (!updated) {
      throw new AppError(404, 'ADDRESS_NOT_FOUND', 'That address was not found');
    }

    return this.toView(updated);
  }

  async remove(customerId: string, addressId: string): Promise<void> {
    const success = await addressesRepository.delete(addressId, customerId);
    if (!success) {
      throw new AppError(404, 'ADDRESS_NOT_FOUND', 'That address was not found');
    }
  }

  /** Resolves a saved address for a booking: must belong to the customer and be serviceable. */
  async resolveForBooking(customerId: string, addressId: string): Promise<ResolvedAddress> {
    const address = await addressesRepository.findOwned(addressId, customerId);
    if (!address) throw new AppError(404, 'ADDRESS_NOT_FOUND', 'That address was not found');
    const center = this.assertServiceable(address.pincode);
    return {
      label: address.label ?? undefined,
      contactName: address.contactName ?? undefined,
      contactPhone: address.contactPhone ?? undefined,
      line1: address.line1,
      line2: address.line2 ?? undefined,
      landmark: address.landmark ?? undefined,
      city: address.city,
      state: address.state,
      pincode: address.pincode,
      location: address.location?.lat != null && address.location?.lng != null
        ? { lat: address.location.lat, lng: address.location.lng }
        : center,
      sourceAddressId: String(address._id),
    };
  }

  private toView(a: IAddress): AddressView {
    return {
      id: String(a._id),
      label: a.label ?? 'Home',
      contactName: a.contactName ?? undefined,
      contactPhone: a.contactPhone ?? undefined,
      line1: a.line1,
      line2: a.line2 ?? undefined,
      landmark: a.landmark ?? undefined,
      city: a.city,
      state: a.state,
      pincode: a.pincode,
      location: a.location?.lat != null && a.location?.lng != null ? { lat: a.location.lat, lng: a.location.lng } : undefined,
      isDefault: Boolean(a.isDefault),
      serviceable: this.checkServiceability(a.pincode).serviceable,
    };
  }
}

export const addressesService = new AddressesService();