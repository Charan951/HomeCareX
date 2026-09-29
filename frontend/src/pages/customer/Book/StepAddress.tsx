import { useState } from "react";
import { useBookingDraftStore } from "@/features/booking";
import { FOCUS_RING } from "@/components/customer/focusRing";
import { ADDRESSES } from "@/mocks/customerMockData";
import type { AddressSnapshot } from "@/types/booking";

const MOCK_LAT_LNG = { lat: 17.385, lng: 78.4867 };

function savedAddressToSnapshot(addr: (typeof ADDRESSES)[number]): AddressSnapshot {
  const [city, state = "Telangana"] = addr.city.split(",").map((s) => s.trim());
  return {
    label: addr.label,
    line1: addr.line,
    city,
    state: state.replace(/\s*\d{6}$/, ""),
    pincode: (addr.city.match(/\d{4,10}/)?.[0]) ?? "500000",
    location: MOCK_LAT_LNG,
    sourceAddressId: addr.id,
  };
}

function isServiceable(snapshot: Pick<AddressSnapshot, "city">): boolean {
  return /hyderabad|warangal/i.test(snapshot.city);
}

interface NewAddressForm {
  line1: string;
  city: string;
  state: string;
  pincode: string;
}

const EMPTY_FORM: NewAddressForm = { line1: "", city: "", state: "", pincode: "" };

export default function StepAddress() {
  const setAddress = useBookingDraftStore((s) => s.setAddress);
  const setStep = useBookingDraftStore((s) => s.setStep);
  const selectedAddressId = useBookingDraftStore((s) => s.addressId);

  const [addressList, setAddressList] = useState(ADDRESSES);
  const [mode, setMode] = useState<"list" | "new">("list");
  const [editingId, setEditingId] = useState<string | null>(null);
  const [form, setForm] = useState<NewAddressForm>(EMPTY_FORM);
  const [formError, setFormError] = useState<string | null>(null);
  const [notServiceable, setNotServiceable] = useState(false);

  const chooseSaved = (addr: (typeof ADDRESSES)[number]) => {
    const snapshot = savedAddressToSnapshot(addr);
    if (!isServiceable(snapshot)) {
      setNotServiceable(true);
      return;
    }
    setNotServiceable(false);
    setAddress(addr.id, snapshot); 
  };

  const handleEditAddress = (addr: (typeof ADDRESSES)[number]) => {
    const snapshot = savedAddressToSnapshot(addr);
    setForm({
      line1: snapshot.line1,
      city: snapshot.city,
      state: snapshot.state,
      pincode: snapshot.pincode,
    });
    setEditingId(addr.id);
    setMode("new");
  };

  const handleDeleteAddress = (id: string) => {
    setAddressList((prev) => prev.filter((addr) => addr.id !== id));
  };

  const submitNew = () => {
    if (!form.line1.trim() || !form.city.trim() || !form.state.trim() || !/^\d{4,10}$/.test(form.pincode)) {
      setFormError("Please fill in the address line, city, state and a valid pincode.");
      return;
    }
    
    const snapshot: AddressSnapshot = {
      line1: form.line1.trim(),
      city: form.city.trim(),
      state: form.state.trim(),
      pincode: form.pincode.trim(),
      location: MOCK_LAT_LNG,
    };
    
    if (!isServiceable(snapshot)) {
      setFormError(null);
      setNotServiceable(true);
      return;
    }

    const newId = editingId || `new-${Date.now()}`;
    const newAddressEntry = {
      id: newId,
      label: editingId ? (addressList.find(a => a.id === editingId)?.label || "Custom") : "Custom",
      line: form.line1.trim(),
      city: `${form.city.trim()}, ${form.state.trim()} ${form.pincode.trim()}`,
      isDefault: false
    };

    if (editingId) {
      setAddressList(prev => prev.map(a => a.id === editingId ? { ...a, ...newAddressEntry } : a));
    } else {
      setAddressList(prev => [newAddressEntry, ...prev]);
    }

    setFormError(null);
    setNotServiceable(false);
    setAddress(newId, snapshot);
    setEditingId(null);
    setMode("list"); 
  };

  const handleNext = () => {
    if (selectedAddressId) {
      setStep(3);
    }
  };

  // Ensure the user hasn't deleted the address they currently have selected
  const isSelectedAddressValid = addressList.some(addr => addr.id === selectedAddressId);

  return (
    <div className="space-y-6">
      <div className="border-b border-line pb-4">
        <h1 className="text-xl font-semibold text-ink">Service Address</h1>
        <p className="mt-1 text-sm text-muted">Choose where you'd like the service performed.</p>
      </div>

      {notServiceable && (
        <div role="alert" className="rounded border border-danger bg-danger-soft px-4 py-3 text-sm text-ink">
          Sorry, we don't currently service that area. Please choose a different address.
        </div>
      )}

      <div className="flex gap-2">
        <button
          type="button"
          onClick={() => setMode("list")}
          className={`min-h-[44px] rounded px-4 text-sm font-medium ${FOCUS_RING} ${mode === "list" ? "bg-brand text-white" : "border border-line text-ink"}`}
        >
          Saved addresses
        </button>
        <button
          type="button"
          onClick={() => { 
            setForm(EMPTY_FORM); 
            setEditingId(null);
            setMode("new"); 
          }}
          className={`min-h-[44px] rounded px-4 text-sm font-medium ${FOCUS_RING} ${mode === "new" ? "bg-brand text-white" : "border border-line text-ink"}`}
        >
          + Add new
        </button>
      </div>

      {mode === "list" ? (
        addressList.length === 0 ? (
          <p className="py-8 text-center text-sm text-muted">No saved addresses yet. Add one to continue.</p>
        ) : (
          <div className="space-y-3">
            {addressList.map((addr) => (
              <div 
                key={addr.id}
                className={`flex w-full items-start justify-between rounded border p-4 text-left transition-colors ${
                  selectedAddressId === addr.id ? "border-brand bg-brand-soft/20" : "border-line bg-panel hover:border-brand"
                }`}
              >
                <button
                  type="button"
                  onClick={() => chooseSaved(addr)}
                  className={`flex-1 text-left ${FOCUS_RING}`}
                >
                  <div className="flex items-center gap-2">
                    <span className="font-medium text-ink">{addr.label}</span>
                    {addr.isDefault && <span className="rounded-full bg-brand-soft px-2 py-0.5 text-xs text-brand">Default</span>}
                  </div>
                  <div className="mt-1 text-sm text-muted">{addr.line}</div>
                  <div className="text-sm text-muted">{addr.city}</div>
                </button>

                <div className="ml-4 flex items-center gap-4">
                  <button 
                    type="button"
                    onClick={(e) => {
                      e.stopPropagation();
                      handleEditAddress(addr);
                    }}
                    className={`text-sm font-medium text-brand hover:underline ${FOCUS_RING}`}
                  >
                    Edit
                  </button>
                  <button 
                    type="button"
                    onClick={(e) => {
                      e.stopPropagation();
                      handleDeleteAddress(addr.id);
                    }}
                    className={`text-sm font-medium text-danger hover:underline ${FOCUS_RING}`}
                  >
                    Delete
                  </button>
                </div>
              </div>
            ))}
          </div>
        )
      ) : (
        <div className="space-y-3">
          {formError && (
            <div role="alert" className="rounded border border-danger bg-danger-soft px-4 py-2 text-sm text-ink">
              {formError}
            </div>
          )}
          <div>
            <label htmlFor="addr-line1" className="mb-1.5 block text-sm font-medium text-ink">Address line</label>
            <input
              id="addr-line1"
              value={form.line1}
              onChange={(e) => setForm((f) => ({ ...f, line1: e.target.value }))}
              className={`min-h-[44px] w-full rounded border border-line bg-panel px-3 text-sm text-ink ${FOCUS_RING}`}
            />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label htmlFor="addr-city" className="mb-1.5 block text-sm font-medium text-ink">City</label>
              <input
                id="addr-city"
                value={form.city}
                onChange={(e) => setForm((f) => ({ ...f, city: e.target.value }))}
                className={`min-h-[44px] w-full rounded border border-line bg-panel px-3 text-sm text-ink ${FOCUS_RING}`}
              />
            </div>
            <div>
              <label htmlFor="addr-state" className="mb-1.5 block text-sm font-medium text-ink">State</label>
              <input
                id="addr-state"
                value={form.state}
                onChange={(e) => setForm((f) => ({ ...f, state: e.target.value }))}
                className={`min-h-[44px] w-full rounded border border-line bg-panel px-3 text-sm text-ink ${FOCUS_RING}`}
              />
            </div>
          </div>
          <div>
            <label htmlFor="addr-pincode" className="mb-1.5 block text-sm font-medium text-ink">Pincode</label>
            <input
              id="addr-pincode"
              value={form.pincode}
              onChange={(e) => setForm((f) => ({ ...f, pincode: e.target.value }))}
              className={`min-h-[44px] w-full max-w-[160px] rounded border border-line bg-panel px-3 text-sm text-ink ${FOCUS_RING}`}
            />
          </div>
          <button
            type="button"
            onClick={submitNew}
            className={`min-h-[44px] rounded bg-brand px-6 text-sm font-medium text-white hover:opacity-90 ${FOCUS_RING}`}
          >
            Save & Select Address
          </button>
        </div>
      )}

      <div className="mt-8 flex justify-between pt-4 border-t border-line">
        <button
          type="button"
          onClick={() => setStep(1)}
          className={`min-h-[44px] rounded border border-line px-6 text-sm font-medium text-ink hover:bg-canvas ${FOCUS_RING}`}
        >
          Back
        </button>
        
        {mode === "list" && (
          <button
            type="button"
            onClick={handleNext}
            disabled={!selectedAddressId || !isSelectedAddressValid}
            className={`min-h-[44px] rounded bg-brand px-6 text-sm font-medium text-white hover:opacity-90 disabled:opacity-50 ${FOCUS_RING}`}
          >
            Next Step
          </button>
        )}
      </div>
    </div>
  );
}