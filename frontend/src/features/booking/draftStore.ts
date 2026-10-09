import { create } from "zustand";
import { persist } from "zustand/middleware";
import type { AddressSnapshot } from "@/types/booking";

export interface BookingAddOn {
  id: string;
  quantity: number;
  price: number;
  /** Display only (Step 4 review). The server prices add-ons from its own catalog. */
  name?: string;
}

/** The Idempotency-Key for one exact booking request. Kept in the (persisted) draft so a page
 *  refresh or a dropped connection re-sends the SAME key and the server replays the first booking. */
export interface DraftIdempotency {
  /** JSON of the request body the key belongs to. A different body needs a different key. */
  signature: string;
  key: string;
}

export interface BookingDraftState {
  serviceId: string | null;
  serviceSlug: string | null;
  serviceName: string | null;
  basePrice: number;
  quantity: number;
  addOns: BookingAddOn[];
  /** Id of a saved address (POST /addresses). Step 4 sends only this id; the server re-reads the
   *  address and re-checks serviceability, so the client can never book an address it made up. */
  addressId: string | null;
  /** Display copy of the chosen address for the review step. Never sent to the server. */
  addressSnapshot: AddressSnapshot | null;
  date: string | null;
  slot: string | null;
  couponCode: string | null;
  currentStep: number;
  /** One-off message shown above the stepper after Step 4 sends the customer back (not persisted). */
  idempotency: DraftIdempotency | null;
  notice: string | null;
  setNotice: (notice: string | null) => void;
  /** Returns the key for this request body, creating and saving a new one only if the body changed. */
  getIdempotencyKey: (signature: string) => string;
  resetIdempotency: () => void;
  setServiceDetails: (
    serviceId: string,
    serviceSlug: string,
    basePrice: number,
    quantity: number,
    addOns: BookingAddOn[],
    serviceName?: string
  ) => void;
  setAddress: (addressId: string, snapshot: AddressSnapshot) => void;
  setDateAndSlot: (date: string, slot: string) => void;
  // Added individual setters for StepSlot compatibility
  setDate: (date: string) => void;
  setSlot: (slot: string | null) => void;
  setCouponCode: (code: string | null) => void;
  setStep: (step: number) => void;
  clearDraft: () => void;
  getFirstIncompleteStep: () => number;
}

const initialState = {
  serviceId: null as string | null,
  serviceSlug: null as string | null,
  serviceName: null as string | null,
  basePrice: 0,
  quantity: 1,
  addOns: [] as BookingAddOn[],
  addressId: null as string | null,
  addressSnapshot: null as AddressSnapshot | null,
  date: null as string | null,
  slot: null as string | null,
  couponCode: null as string | null,
  currentStep: 1,
  idempotency: null as DraftIdempotency | null,
  notice: null as string | null,
};

export const useBookingDraftStore = create<BookingDraftState>()(
  persist(
    (set, get) => ({
      ...initialState,
      setServiceDetails: (serviceId, serviceSlug, basePrice, quantity, addOns, serviceName) =>
        set({
          serviceId,
          serviceSlug,
          serviceName: serviceName ?? null,
          basePrice,
          quantity,
          addOns,
          currentStep: Math.max(get().currentStep, 2),
        }),
      // Selecting an address / slot only records the choice; the step's Next button moves on.
      setAddress: (addressId, snapshot) => set({ addressId, addressSnapshot: snapshot }),
      setDateAndSlot: (date, slot) => set({ date, slot }),
      // Implementation of the new setters
      setDate: (date) => set({ date }),
      setSlot: (slot) => set({ slot }),
      setCouponCode: (couponCode) => set({ couponCode }),
      setStep: (step) => set({ currentStep: Math.min(4, Math.max(1, step)) }),
      setNotice: (notice) => set({ notice }),
      getIdempotencyKey: (signature) => {
        const existing = get().idempotency;
        if (existing && existing.signature === signature) return existing.key;
        const key = crypto.randomUUID();
        set({ idempotency: { signature, key } });
        return key;
      },
      resetIdempotency: () => set({ idempotency: null }),
      clearDraft: () => set({ ...initialState }),
      getFirstIncompleteStep: () => {
        const s = get();
        if (!s.serviceId) return 1;
        if (!s.addressId) return 2;
        if (!s.date || !s.slot) return 3;
        return 4;
      },
    }),
    {
      name: "booking-draft-storage",
      // v1 drafts held mock address ids ("addr-1"); v2 drafts held mock service/add-on ids
      // ("650000...") that the API rejects with SERVICE_NOT_FOUND. The API needs real ids, so drop them.
      // v3 drafts could still carry those ids without a matching slug, so they are dropped too.
      // v4 drafts were saved while Step 1 still read the 9-service mock catalog (mock ids and prices), so drop them.
      version: 5,
      migrate: () => ({ ...initialState }),
      partialize: (state) => ({
        serviceId: state.serviceId,
        serviceSlug: state.serviceSlug,
        serviceName: state.serviceName,
        basePrice: state.basePrice,
        quantity: state.quantity,
        addOns: state.addOns,
        addressId: state.addressId,
        addressSnapshot: state.addressSnapshot,
        date: state.date,
        slot: state.slot,
        couponCode: state.couponCode,
        currentStep: state.currentStep,
        idempotency: state.idempotency,
      }),
    }
  )
);