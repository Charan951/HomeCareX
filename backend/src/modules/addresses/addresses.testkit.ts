import { Types } from 'mongoose';
import { addressesRepository } from './addresses.repository';
import { addressesService } from './addresses.service';

/** In-memory stand-in for the addresses repository, shared by the service and HTTP tests. */

interface Doc extends Record<string, unknown> {
  _id: Types.ObjectId;
  customerId: string;
  isDefault: boolean;
  createdAt: number;
}

let store: Doc[] = [];
let clock = 0;

/** Same rule as the unique partial index: a customer can never hold two defaults at once. */
function assertSingleDefault(customerId: string) {
  const defaults = store.filter((d) => d.customerId === customerId && d.isDefault).length;
  if (defaults > 1) throw Object.assign(new Error('E11000 duplicate key uniq_default_address_per_customer'), { code: 11000 });
}

const fake = {
  inTransaction: async <T>(work: (s: undefined) => Promise<T>) => work(undefined),
  listByCustomer: async (customerId: string) =>
    store
      .filter((d) => d.customerId === customerId)
      .sort((a, b) => Number(b.isDefault) - Number(a.isDefault) || b.createdAt - a.createdAt),
  countByCustomer: async (customerId: string) => store.filter((d) => d.customerId === customerId).length,
  findOwned: async (id: string, customerId: string) => store.find((d) => String(d._id) === id && d.customerId === customerId) ?? null,
  findNewest: async (customerId: string) => store.filter((d) => d.customerId === customerId).sort((a, b) => b.createdAt - a.createdAt)[0] ?? null,
  create: async (doc: Record<string, unknown>) => {
    const created = { ...doc, _id: new Types.ObjectId(), createdAt: ++clock } as Doc;
    store.push(created);
    assertSingleDefault(created.customerId);
    return created;
  },
  clearDefault: async (customerId: string) => {
    store.filter((d) => d.customerId === customerId).forEach((d) => (d.isDefault = false));
  },
  setDefault: async (id: string, customerId: string) => {
    const d = store.find((x) => String(x._id) === id && x.customerId === customerId);
    if (d) d.isDefault = true;
    assertSingleDefault(customerId);
  },
  update: async (id: string, customerId: string, upd: { $set?: Record<string, unknown>; $unset?: Record<string, ''> }) => {
    const d = store.find((x) => String(x._id) === id && x.customerId === customerId);
    if (!d) return null;
    Object.assign(d, upd.$set ?? {});
    for (const k of Object.keys(upd.$unset ?? {})) delete d[k];
    assertSingleDefault(customerId);
    return d;
  },
  delete: async (id: string, customerId: string) => {
    const before = store.length;
    store = store.filter((d) => !(String(d._id) === id && d.customerId === customerId));
    return store.length < before;
  },
};

const originals = { ...addressesRepository } as Record<string, unknown>;
const originalPincodes = addressesService.serviceablePincodes;

export const SERVICEABLE = ['500081', '500033', '506005'];

/** Fresh empty store, fake repository installed, and a fixed serviceable-pincode list. */
export function installFakeRepository() {
  store = [];
  clock = 0;
  Object.assign(addressesRepository, fake);
  addressesService.serviceablePincodes = async () => SERVICEABLE;
}

export function restoreRepository() {
  Object.assign(addressesRepository, originals);
  addressesService.serviceablePincodes = originalPincodes;
}
