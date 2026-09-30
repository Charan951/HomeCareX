import { create } from "zustand";
import { persist } from "zustand/middleware";
import type { AddressSnapshot } from "@/types/booking";

export interface BookingAddOn {
  id: string;
  quantity: number;
  price: number;
}

export interface BookingDraftState {
  serviceId: string | null;
  serviceSlug: string | null;
  basePrice: number;
  quantity: number;
  addOns: BookingAddOn[];
  addressId: string | null;
  /** Full snapshot for whichever address `addressId` points at. The backend has no saved-address
   *  lookup yet (that's a separate Addresses module/issue), so Step 4 sends this snapshot as
   *  `newAddress` regardless of whether it came from a saved address or a freshly typed one. */
  addressSnapshot: AddressSnapshot | null;
  date: string | null;
  slot: string | null;
  couponCode: string | null;
  currentStep: number;
  setServiceDetails: (
    serviceId: string,
    serviceSlug: string,
    basePrice: number,
    quantity: number,
    addOns: BookingAddOn[]
  ) => void;
  setAddress: (addressId: string, snapshot: AddressSnapshot) => void;
  setDateAndSlot: (date: string, slot: string) => void;
  setCouponCode: (code: string | null) => void;
  setStep: (step: number) => void;
  clearDraft: () => void;
  getFirstIncompleteStep: () => number;
}

const initialState = {
  serviceId: null as string | null,
  serviceSlug: null as string | null,
  basePrice: 0,
  quantity: 1,
  addOns: [] as BookingAddOn[],
  addressId: null as string | null,
  addressSnapshot: null as AddressSnapshot | null,
  date: null as string | null,
  slot: null as string | null,
  couponCode: null as string | null,
  currentStep: 1,
};

export const useBookingDraftStore = create<BookingDraftState>()(
  persist(
    (set, get) => ({
      ...initialState,
      setServiceDetails: (serviceId, serviceSlug, basePrice, quantity, addOns) =>
        set({
          serviceId,
          serviceSlug,
          basePrice,
          quantity,
          addOns,
          currentStep: Math.max(get().currentStep, 2),
        }),
      setAddress: (addressId, snapshot) =>
        set({ addressId, addressSnapshot: snapshot, currentStep: Math.max(get().currentStep, 3) }),
      setDateAndSlot: (date, slot) =>
        set({ date, slot, currentStep: Math.max(get().currentStep, 4) }),
      setCouponCode: (couponCode) => set({ couponCode }),
      setStep: (step) => set({ currentStep: Math.min(4, Math.max(1, step)) }),
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
      partialize: (state) => ({
        serviceId: state.serviceId,
        serviceSlug: state.serviceSlug,
        basePrice: state.basePrice,
        quantity: state.quantity,
        addOns: state.addOns,
        addressId: state.addressId,
        addressSnapshot: state.addressSnapshot,
        date: state.date,
        slot: state.slot,
        couponCode: state.couponCode,
        currentStep: state.currentStep,
      }),
    }
  )
);
