import { useState, type FormEvent } from "react";
import { useQuery } from "@tanstack/react-query";
import { useAddresses, useBookingDraftStore } from "@/features/booking";
import { LoadingState, ErrorState, EmptyState } from "@/components/customer";
import { FOCUS_RING } from "@/components/customer/focusRing";
import { addressApi } from "@/services/addressApi";
import type { NormalizedApiError } from "@/services/bookingApi";
import type { AddressView } from "@/types/address";
import type { AddressSnapshot } from "@/types/booking";

const LABELS = ["Home", "Office", "Other"] as const;

interface FormState {
  label: string;
  line1: string;
  landmark: string;
  city: string;
  state: string;
  pincode: string;
}
const EMPTY_FORM: FormState = { label: "Home", line1: "", landmark: "", city: "", state: "", pincode: "" };

function toSnapshot(a: AddressView): AddressSnapshot {
  return {
    label: a.label,
    line1: a.line1,
    line2: a.line2,
    landmark: a.landmark,
    city: a.city,
    state: a.state,
    pincode: a.pincode,
    location: a.location ?? { lat: 0, lng: 0 },
    sourceAddressId: a.id,
  };
}

const inputClass = `min-h-[44px] w-full rounded border border-line bg-panel px-3 text-sm text-ink ${FOCUS_RING}`;

export default function StepAddress() {
  const selectedAddressId = useBookingDraftStore((s) => s.addressId);
  const setAddress = useBookingDraftStore((s) => s.setAddress);
  const setStep = useBookingDraftStore((s) => s.setStep);

  // Destructure create, update, and delete mutations/functions from your hook if available
  const { addresses, isLoading, isError, error, refetch, createAddress, isCreating } = useAddresses();

  const [mode, setMode] = useState<"list" | "new">("list");
  const [editingId, setEditingId] = useState<string | null>(null);
  const [form, setForm] = useState<FormState>(EMPTY_FORM);
  const [formError, setFormError] = useState<string | null>(null);
  const [notServiceable, setNotServiceable] = useState(false);
  const [isDeletingId, setIsDeletingId] = useState<string | null>(null);

  // Live serviceability hint once a full 6-digit pincode is typed
  const pincodeReady = /^\d{6}$/.test(form.pincode);
  const serviceability = useQuery({
    queryKey: ["serviceability", form.pincode],
    queryFn: () => addressApi.checkServiceability(form.pincode),
    enabled: mode === "new" && pincodeReady,
    staleTime: 5 * 60 * 1000,
  });

  // Sort addresses so the default address appears first
  const sortedAddresses = [...addresses].sort((a, b) => (b.isDefault ? 1 : 0) - (a.isDefault ? 1 : 0));

  const selected = addresses.find((a) => a.id === selectedAddressId);
  const canContinue = Boolean(selected && selected.serviceable);

  const choose = (address: AddressView) => {
    if (!address.serviceable) {
      setNotServiceable(true);
      return;
    }
    setNotServiceable(false);
    setAddress(address.id, toSnapshot(address));
  };

  const setField = (key: keyof FormState) => (e: { target: { value: string } }) =>
    setForm((f) => ({ ...f, [key]: e.target.value }));

  const handleEdit = (addr: AddressView, e: React.MouseEvent) => {
    e.stopPropagation(); // Prevent card selection when clicking edit
    setEditingId(addr.id);
    setForm({
      label: addr.label,
      line1: addr.line1,
      landmark: addr.landmark ?? "",
      city: addr.city,
      state: addr.state,
      pincode: addr.pincode,
    });
    setFormError(null);
    setMode("new");
  };

  const handleDelete = async (id: string, e: React.MouseEvent) => {
    e.stopPropagation(); // Prevent card selection when clicking delete
    if (!confirm("Are you sure you want to delete this address?")) return;
    setIsDeletingId(id);

    try {
      await addressApi.delete(id);
      refetch();
    } catch (err) {
      alert((err as NormalizedApiError).message ?? "Failed to delete address. Please try again.");
    } finally {
      setIsDeletingId(null);
    }
  };

  const submitNew = async (e: FormEvent) => {
    e.preventDefault();
    if (isCreating) return; 
    if (!form.line1.trim() || !form.city.trim() || !form.state.trim() || !/^\d{4,10}$/.test(form.pincode.trim())) {
      setFormError("Please fill in the address line, city, state and a valid pincode.");
      return;
    }
    setFormError(null);

    try {
      const check = await addressApi.checkServiceability(form.pincode.trim());
      if (!check.serviceable) {
        setNotServiceable(true);
        return;
      }

      const payload = {
        label: form.label,
        line1: form.line1.trim(),
        landmark: form.landmark.trim() || undefined,
        city: form.city.trim(),
        state: form.state.trim(),
        pincode: form.pincode.trim(),
      };

      if (editingId) {
        await addressApi.update(editingId, payload);
      } else {
        const created = await createAddress(payload);
        setAddress(created.id, toSnapshot(created));
      }

      setNotServiceable(false);
      setForm(EMPTY_FORM);
      setEditingId(null);
      setMode("list");
      refetch();
    } catch (err) {
      setFormError((err as NormalizedApiError).message ?? "Couldn't save this address. Please try again.");
    }
  };

  return (
    <div className="space-y-6">
      <div className="border-b border-line pb-4">
        <h3 className="text-xl font-semibold text-ink">Service Address</h3>
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
          onClick={() => { setEditingId(null); setMode("list"); }}
          aria-pressed={mode === "list"}
          className={`min-h-[44px] rounded px-4 text-sm font-medium ${FOCUS_RING} ${mode === "list" ? "bg-brand text-white" : "border border-line text-ink"}`}
        >
          Saved addresses
        </button>
        <button
          type="button"
          onClick={() => {
            setEditingId(null);
            setForm(EMPTY_FORM);
            setFormError(null);
            setMode("new");
          }}
          aria-pressed={mode === "new"}
          className={`min-h-[44px] rounded px-4 text-sm font-medium ${FOCUS_RING} ${mode === "new" ? "bg-brand text-white" : "border border-line text-ink"}`}
        >
          + Add new
        </button>
      </div>

      {mode === "list" && (
        <>
          {isLoading && <LoadingState label="Loading your addresses…" />}
          {isError && (
            <ErrorState title="Couldn't load your addresses" message={error?.message} onRetry={refetch} />
          )}
          {!isLoading && !isError && addresses.length === 0 && (
            <EmptyState
              title="No saved addresses yet"
              description="Add an address to continue."
              action={
                <button
                  type="button"
                  onClick={() => setMode("new")}
                  className={`min-h-[44px] rounded bg-brand px-4 text-sm font-medium text-white ${FOCUS_RING}`}
                >
                  + Add new address
                </button>
              }
            />
          )}
          {!isLoading && !isError && addresses.length > 0 && (
            <div role="radiogroup" aria-label="Saved addresses" className="space-y-3">
              {sortedAddresses.map((addr) => {
                const isSelected = selectedAddressId === addr.id;
                const isDeleting = isDeletingId === addr.id;
                return (
                  <div
                    key={addr.id}
                    role="radio"
                    aria-checked={isSelected}
                    tabIndex={0}
                    onClick={() => choose(addr)}
                    onKeyDown={(e) => {
                      if (e.key === "Enter" || e.key === " ") choose(addr);
                    }}
                    className={`w-full rounded border p-4 text-left transition-colors relative flex justify-between items-start cursor-pointer ${FOCUS_RING} ${
                      isSelected ? "border-brand bg-brand-soft/20" : "border-line bg-panel hover:border-brand"
                    } ${addr.serviceable && !isDeleting ? "" : "opacity-60"}`}
                  >
                    <div>
                      <span className="flex flex-wrap items-center gap-2">
                        <span className="font-medium text-ink">{addr.label}</span>
                        {addr.isDefault && <span className="rounded-full bg-brand-soft px-2 py-0.5 text-xs text-brand">Default</span>}
                        {!addr.serviceable && (
                          <span className="rounded-full bg-danger-soft px-2 py-0.5 text-xs text-ink">Not serviceable</span>
                        )}
                      </span>
                      <span className="mt-1 block text-sm text-muted">{addr.line1}</span>
                      <span className="block text-sm text-muted">
                        {addr.city}, {addr.state} {addr.pincode}
                      </span>
                    </div>

                    {/* Edit & Delete Action Buttons */}
                    <div className="flex items-center gap-2">
                      <button
                        type="button"
                        onClick={(e) => handleEdit(addr, e)}
                        className="rounded border border-line bg-panel px-2.5 py-1 text-xs font-medium text-muted hover:text-brand hover:border-brand transition-colors"
                        title="Edit address"
                      >
                        Edit
                      </button>
                      <button
                        type="button"
                        disabled={isDeleting}
                        onClick={(e) => handleDelete(addr.id, e)}
                        className="rounded border border-line bg-panel px-2.5 py-1 text-xs font-medium text-muted hover:text-danger hover:border-danger transition-colors disabled:opacity-50"
                        title="Delete address"
                      >
                        {isDeleting ? "..." : "Delete"}
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </>
      )}

      {mode === "new" && (
        <form onSubmit={submitNew} className="space-y-3" noValidate>
          {formError && (
            <div role="alert" className="rounded border border-danger bg-danger-soft px-4 py-2 text-sm text-ink">
              {formError}
            </div>
          )}
          <div>
            <label htmlFor="addr-label" className="mb-1.5 block text-sm font-medium text-ink">Label</label>
            <select id="addr-label" value={form.label} onChange={setField("label")} className={inputClass}>
              {LABELS.map((l) => (
                <option key={l} value={l}>{l}</option>
              ))}
            </select>
          </div>
          <div>
            <label htmlFor="addr-line1" className="mb-1.5 block text-sm font-medium text-ink">Address line</label>
            <input id="addr-line1" value={form.line1} onChange={setField("line1")} autoComplete="address-line1" className={inputClass} />
          </div>
          <div>
            <label htmlFor="addr-landmark" className="mb-1.5 block text-sm font-medium text-ink">Landmark (optional)</label>
            <input id="addr-landmark" value={form.landmark} onChange={setField("landmark")} className={inputClass} />
          </div>
          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
            <div>
              <label htmlFor="addr-city" className="mb-1.5 block text-sm font-medium text-ink">City</label>
              <input id="addr-city" value={form.city} onChange={setField("city")} autoComplete="address-level2" className={inputClass} />
            </div>
            <div>
              <label htmlFor="addr-state" className="mb-1.5 block text-sm font-medium text-ink">State</label>
              <input id="addr-state" value={form.state} onChange={setField("state")} autoComplete="address-level1" className={inputClass} />
            </div>
          </div>
          <div>
            <label htmlFor="addr-pincode" className="mb-1.5 block text-sm font-medium text-ink">Pincode</label>
            <input
              id="addr-pincode"
              value={form.pincode}
              onChange={setField("pincode")}
              inputMode="numeric"
              maxLength={6}
              autoComplete="postal-code"
              aria-describedby="addr-pincode-hint"
              className={`${inputClass} max-w-[160px]`}
            />
            <p id="addr-pincode-hint" role="status" className="mt-1 text-xs text-muted">
              {pincodeReady && serviceability.isFetching && "Checking your area…"}
              {pincodeReady && serviceability.data?.serviceable && `✓ We serve ${serviceability.data.city}.`}
              {pincodeReady && serviceability.data && !serviceability.data.serviceable && "We don't service this pincode yet."}
              {pincodeReady && serviceability.isError && "Couldn't check this pincode right now."}
            </p>
          </div>
          <div className="flex gap-3">
            <button
              type="submit"
              disabled={isCreating}
              className={`min-h-[44px] rounded bg-brand px-6 text-sm font-medium text-white hover:opacity-90 disabled:opacity-50 ${FOCUS_RING}`}
            >
              {isCreating ? "Saving…" : editingId ? "Update Address" : "Save & Select Address"}
            </button>
            <button
              type="button"
              onClick={() => { setEditingId(null); setMode("list"); }}
              className={`min-h-[44px] rounded border border-line px-4 text-sm font-medium text-ink ${FOCUS_RING}`}
            >
              Cancel
            </button>
          </div>
        </form>
      )}

      <div className="mt-8 flex justify-between border-t border-line pt-4">
        <button
          type="button"
          onClick={() => setStep(1)}
          className={`min-h-[44px] rounded border border-line px-6 text-sm font-medium text-ink hover:bg-canvas ${FOCUS_RING}`}
        >
          Back
        </button>
        <button
          type="button"
          onClick={() => setStep(3)}
          disabled={!canContinue}
          className={`min-h-[44px] rounded bg-brand px-6 text-sm font-medium text-white hover:opacity-90 disabled:opacity-50 ${FOCUS_RING}`}
        >
          Next Step
        </button>
      </div>
    </div>
  );
}