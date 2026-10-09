import { AppError } from '../../utils/AppError';
import type { IAddress } from '../../models/Address';
import { getSetting } from '../settings';
import { addressesRepository } from './addresses.repository';
import { DEFAULT_CENTER, MAX_SAVED_ADDRESSES, SERVICEABLE_AREAS } from './addresses.constants';
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

type LatLng = { lat: number; lng: number };

const areaFor = (pincode: string) => SERVICEABLE_AREAS.find((a) => a.pincodePrefixes.includes(pincode.slice(0, 3)));

function isDuplicateKey(err: unknown): boolean {
  return (err as { code?: number })?.code === 11000;
}

/**
 * Keeps `line1` (house + street) and `line2` (area) in step with what the customer typed, because the
 * booking and partner modules read those two. Legacy callers may still send `line1` / `line2` directly.
 */
type StoredLines = { house?: string | null; street?: string | null; area?: string | null; line1?: string | null; line2?: string | null };

function composeLines(
  incoming: Pick<CreateAddressInput, 'house' | 'street' | 'area' | 'line1' | 'line2'>,
  current?: StoredLines,
): { line1: string; line2?: string } {
  const usesParts = incoming.house !== undefined || incoming.street !== undefined || incoming.area !== undefined;
  if (usesParts) {
    const house = incoming.house ?? current?.house ?? undefined;
    const street = incoming.street ?? current?.street ?? undefined;
    const area = incoming.area ?? current?.area ?? undefined;
    const line1 = [house, street].filter(Boolean).join(', ') || incoming.line1 || current?.line1 || '';
    return { line1, line2: area || undefined };
  }
  return { line1: incoming.line1 ?? current?.line1 ?? '', line2: incoming.line2 ?? current?.line2 ?? undefined };
}

class AddressesService {
  /** The serviceable pincode list from Settings ("serviceability.pincodes"). A method so tests can replace it. */
  async serviceablePincodes(): Promise<readonly string[]> {
    return getSetting('serviceability.pincodes');
  }

  private evaluate(pincode: string, list: readonly string[]): ServiceabilityResult {
    if (!list.includes(pincode)) return { serviceable: false, pincode };
    const area = areaFor(pincode);
    return { serviceable: true, pincode, ...(area ? { city: area.city, state: area.state } : {}) };
  }

  async checkServiceability(pincode: string): Promise<ServiceabilityResult> {
    return this.evaluate(pincode, await this.serviceablePincodes());
  }

  /** Throws 422 ADDRESS_NOT_SERVICEABLE; returns a map location for the pincode (area centre) as a fallback. */
  async assertServiceable(pincode: string): Promise<LatLng> {
    if (!(await this.checkServiceability(pincode)).serviceable) {
      throw new AppError(422, 'ADDRESS_NOT_SERVICEABLE', "Sorry, we don't service that area yet. Please choose a different address.", {
        pincode,
      });
    }
    return (areaFor(pincode)?.center ?? DEFAULT_CENTER);
  }

  async list(customerId: string): Promise<AddressView[]> {
    const [rows, pincodes] = await Promise.all([addressesRepository.listByCustomer(customerId), this.serviceablePincodes()]);
    return rows.map((r) => this.toView(r, pincodes));
  }

  /** The customer's default address, else their newest one (null when they have none). */
  async getDefault(customerId: string): Promise<AddressView | null> {
    const [rows, pincodes] = await Promise.all([addressesRepository.listByCustomer(customerId), this.serviceablePincodes()]);
    return rows[0] ? this.toView(rows[0], pincodes) : null;
  }

  async create(customerId: string, input: CreateAddressInput): Promise<AddressView> {
    const pincodes = await this.serviceablePincodes();
    const serviceable = pincodes.includes(input.pincode);
    const { isDefault: wantsDefault, house, street, area, line1, line2, ...rest } = input;

    try {
      const created = await addressesRepository.inTransaction(async (session) => {
        const count = await addressesRepository.countByCustomer(customerId, session);
        if (count >= MAX_SAVED_ADDRESSES) {
          throw new AppError(409, 'ADDRESS_LIMIT_REACHED', `You can save up to ${MAX_SAVED_ADDRESSES} addresses.`);
        }
        // The first address is always the default; otherwise only when asked. Exactly one default per customer.
        const makeDefault = Boolean(wantsDefault) || count === 0;
        if (makeDefault) await addressesRepository.clearDefault(customerId, session);

        return addressesRepository.create(
          {
            ...rest,
            house,
            street,
            area,
            ...composeLines({ house, street, area, line1, line2 }),
            customerId,
            isDefault: makeDefault,
            // Only serviceable pincodes get a fallback location; others simply have none.
            location: input.location ?? (serviceable ? (areaFor(input.pincode)?.center ?? DEFAULT_CENTER) : undefined),
          },
          session,
        );
      });
      return this.toView(created, pincodes);
    } catch (err) {
      if (isDuplicateKey(err)) throw new AppError(409, 'ADDRESS_CONFLICT', 'Your addresses changed at the same time. Please try again.');
      throw err;
    }
  }

  async update(customerId: string, addressId: string, input: Partial<CreateAddressInput>): Promise<AddressView> {
    const pincodes = await this.serviceablePincodes();
    const { isDefault: wantsDefault, house, street, area, line1, line2, ...rest } = input;

    try {
      const updated = await addressesRepository.inTransaction(async (session) => {
        const existing = await addressesRepository.findOwned(addressId, customerId, session);
        if (!existing) throw new AppError(404, 'ADDRESS_NOT_FOUND', 'That address was not found');

        const $set: Record<string, unknown> = { ...rest };
        const $unset: Record<string, ''> = {};

        const touchesLines = [house, street, area, line1, line2].some((v) => v !== undefined);
        if (house !== undefined) $set.house = house;
        if (street !== undefined) $set.street = street;
        if (area !== undefined) $set.area = area;
        if (touchesLines) {
          const lines = composeLines(
            { house, street, area, line1, line2 },
            { house: existing.house, street: existing.street, area: existing.area, line1: existing.line1, line2: existing.line2 },
          );
          $set.line1 = lines.line1;
          if (lines.line2) $set.line2 = lines.line2;
          else $unset.line2 = '';
        }

        // Re-derive the map location only when the pincode (or the location itself) changes.
        if (input.location) {
          $set.location = input.location;
        } else if (input.pincode !== undefined && input.pincode !== existing.pincode) {
          if (pincodes.includes(input.pincode)) $set.location = areaFor(input.pincode)?.center ?? DEFAULT_CENTER;
          else $unset.location = '';
        }

        // Making an address the default clears the old one first. A customer who has addresses always keeps
        // one default, so asking to un-default the current default is ignored (set another as default instead).
        if (wantsDefault === true && !existing.isDefault) {
          await addressesRepository.clearDefault(customerId, session);
          $set.isDefault = true;
        }

        const result = await addressesRepository.update(
          addressId,
          customerId,
          { ...(Object.keys($set).length ? { $set } : {}), ...(Object.keys($unset).length ? { $unset } : {}) },
          session,
        );
        if (!result) throw new AppError(404, 'ADDRESS_NOT_FOUND', 'That address was not found');
        return result;
      });
      return this.toView(updated, pincodes);
    } catch (err) {
      if (isDuplicateKey(err)) throw new AppError(409, 'ADDRESS_CONFLICT', 'Your addresses changed at the same time. Please try again.');
      throw err;
    }
  }

  async remove(customerId: string, addressId: string): Promise<void> {
    await addressesRepository.inTransaction(async (session) => {
      const existing = await addressesRepository.findOwned(addressId, customerId, session);
      if (!existing) throw new AppError(404, 'ADDRESS_NOT_FOUND', 'That address was not found');

      await addressesRepository.delete(addressId, customerId, session);

      // Deleting the default promotes the newest remaining address, so a customer with addresses always has one.
      if (existing.isDefault) {
        const next = await addressesRepository.findNewest(customerId, session);
        if (next) await addressesRepository.setDefault(String(next._id), customerId, session);
      }
    });
  }

  /** Resolves a saved address for a booking: must belong to the customer and be serviceable. */
  async resolveForBooking(customerId: string, addressId: string): Promise<ResolvedAddress> {
    const address = await addressesRepository.findOwned(addressId, customerId);
    if (!address) throw new AppError(404, 'ADDRESS_NOT_FOUND', 'That address was not found');
    const center = await this.assertServiceable(address.pincode);
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

  private toView(a: IAddress, pincodes: readonly string[]): AddressView {
    return {
      id: String(a._id),
      label: a.label ?? 'Home',
      contactName: a.contactName ?? undefined,
      contactPhone: a.contactPhone ?? undefined,
      house: a.house ?? undefined,
      street: a.street ?? undefined,
      area: a.area ?? undefined,
      line1: a.line1,
      line2: a.line2 ?? undefined,
      landmark: a.landmark ?? undefined,
      city: a.city,
      state: a.state,
      pincode: a.pincode,
      location: a.location?.lat != null && a.location?.lng != null ? { lat: a.location.lat, lng: a.location.lng } : undefined,
      isDefault: Boolean(a.isDefault),
      serviceable: pincodes.includes(a.pincode),
    };
  }
}

export const addressesService = new AddressesService();
