import { useEffect, useState, type FormEvent } from "react";
import { ArrowLeft, ArrowRight, Check, MapPin, Pencil, Plus, ShieldCheck, Sparkles, Trash2 } from "lucide-react";
import clsx from "clsx";
import { formatINR } from "./formatMoney";
import MapAddressPicker, { type PickedLocation } from "@/components/customer/maps/MapAddressPicker";
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

const inputClass = `min-h-[48px] w-full rounded-xl border border-line bg-canvas px-4 text-sm text-ink placeholder:text-muted/60 ${FOCUS_RING}`;

export default function StepAddress() {
  const selectedAddressId = useBookingDraftStore((s) => s.addressId);
  const setAddress = useBookingDraftStore((s) => s.setAddress);
  const setStep = useBookingDraftStore((s) => s.setStep);
  const serviceName = useBookingDraftStore((s) => s.serviceName);
  const quantity = useBookingDraftStore((s) => s.quantity);
  const addOns = useBookingDraftStore((s) => s.addOns);
  const basePrice = useBookingDraftStore((s) => s.basePrice);

  // Destructure create, update, and delete mutations/functions from your hook if available
  const { addresses, isLoading, isError, error, refetch, createAddress, isCreating } = useAddresses();

  const [mode, setMode] = useState<"list" | "new">("list");
  const [editingId, setEditingId] = useState<string | null>(null);
  const [form, setForm] = useState<FormState>(EMPTY_FORM);
  const [formError, setFormError] = useState<string | null>(null);
  const [notServiceable, setNotServiceable] = useState(false);
  const [isDeletingId, setIsDeletingId] = useState<string | null>(null);
  const [location, setLocation] = useState<{ lat: number; lng: number } | undefined>(undefined);
  const [editingLocation, setEditingLocation] = useState<{ lat: number; lng: number } | null>(null);
  const [line1Edited, setLine1Edited] = useState(false);

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

  // A customer with no saved address starts straight on the map.
  const [autoOpened, setAutoOpened] = useState(false);
  useEffect(() => {
    if (!isLoading && !isError && addresses.length === 0 && !autoOpened) {
      setAutoOpened(true);
      setMode("new");
    }
  }, [isLoading, isError, addresses.length, autoOpened]);

  const applyPick = (p: PickedLocation) => {
    setLocation({ lat: p.lat, lng: p.lng });
    setForm((f) => ({
      ...f,
      line1: line1Edited || !p.line1 ? f.line1 : p.line1,
      city: p.city || f.city,
      state: p.state || f.state,
      pincode: p.pincode ? p.pincode.slice(0, 6) : f.pincode,
    }));
  };

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
    setLocation(addr.location);
    setEditingLocation(addr.location ?? null);
    setLine1Edited(true);
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
        ...(location ? { location } : {}),
      };

      if (editingId) {
        await addressApi.update(editingId, payload);
      } else {
        const created = await createAddress(payload);
        setAddress(created.id, toSnapshot(created));
      }

      setNotServiceable(false);
      setForm(EMPTY_FORM);
      setLocation(undefined);
      setEditingLocation(null);
      setLine1Edited(false);
      setEditingId(null);
      setMode("list");
      refetch();
    } catch (err) {
      setFormError((err as NormalizedApiError).message ?? "Couldn't save this address. Please try again.");
    }
  };

const estimate = basePrice * quantity + addOns.reduce((sum, a) => sum + a.price * a.quantity, 0);

const tabBtn = (active: boolean) =>
  clsx(
    "inline-flex h-10 items-center gap-1.5 rounded-full px-4 text-sm font-semibold transition-colors",
    FOCUS_RING,
    active ? "bg-brand text-white shadow-sm" : "border border-line bg-white text-ink hover:border-brand/50",
  );

const backBtn = (
  <button
    type="button"
    onClick={() => setStep(1)}
    className={clsx("inline-flex min-h-[48px] items-center justify-center gap-2 rounded-full border border-line bg-white px-5 text-sm font-semibold text-ink transition-colors hover:bg-canvas", FOCUS_RING)}
  >
    <ArrowLeft className="h-4 w-4" aria-hidden="true" />
    Back
  </button>
);

const actions =
  mode === "new" ? (
    <>
      <button
        type="button"
        onClick={() => {
          setEditingId(null);
          setMode("list");
        }}
        className={clsx("inline-flex min-h-[48px] items-center justify-center rounded-full border border-line bg-white px-5 text-sm font-semibold text-ink transition-colors hover:bg-canvas", FOCUS_RING)}
      >
        Cancel
      </button>
      <button
        type="submit"
        form="address-form"
        disabled={isCreating}
        className={clsx("inline-flex min-h-[48px] flex-1 items-center justify-center gap-2 rounded-full bg-brand px-6 text-sm font-bold text-white shadow-sm transition-colors hover:bg-[#3730A3] disabled:opacity-50", FOCUS_RING)}
      >
        {isCreating ? "Saving…" : editingId ? "Update address" : "Save & select"}
      </button>
    </>
  ) : (
    <>
      {backBtn}
      <button
        type="button"
        onClick={() => setStep(3)}
        disabled={!canContinue}
        className={clsx("group inline-flex min-h-[48px] flex-1 items-center justify-center gap-2 rounded-full bg-brand px-6 text-sm font-bold text-white shadow-sm transition-colors hover:bg-[#3730A3] disabled:cursor-not-allowed disabled:opacity-50 motion-safe:active:scale-95", FOCUS_RING)}
      >
        Next step
        <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-0.5 motion-reduce:transition-none" aria-hidden="true" />
      </button>
    </>
  );

return (
  <div className="grid gap-6 lg:grid-cols-[minmax(0,1fr)_340px] lg:items-start lg:gap-8">
    <div className="min-w-0 space-y-6">
      {/* Intro */}
      <div className="flex items-start gap-3.5">
        <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl bg-brand text-white shadow-[0_12px_24px_-12px_rgba(67,56,202,.8)]">
          <MapPin className="h-5 w-5" aria-hidden="true" />
        </span>
        <div>
          <h3 className="text-xl font-bold tracking-tight text-ink sm:text-2xl">{addresses.length === 0 ? "Add your service address" : "Where should we come?"}</h3>
          <p className="mt-0.5 text-sm text-muted">Choose where you'd like the service performed.</p>
        </div>
      </div>

      <section aria-label="Service address" className="rounded-3xl border border-line bg-panel p-5 shadow-[0_24px_60px_-48px_rgba(67,56,202,.55)] sm:p-6">
        {notServiceable && (
          <div role="alert" className="mb-4 rounded-2xl border border-danger bg-danger-soft px-4 py-3 text-sm text-ink">
            Sorry, we don't currently service that area. Please choose a different address.
          </div>
        )}

        <div className="mb-4 flex flex-wrap gap-2">
          <button
            type="button"
            onClick={() => {
              setEditingId(null);
              setMode("list");
            }}
            aria-pressed={mode === "list"}
            className={tabBtn(mode === "list")}
          >
            Saved addresses
          </button>
          <button
            type="button"
            onClick={() => {
              setEditingId(null);
              setForm(EMPTY_FORM);
              setFormError(null);
              setLocation(undefined);
              setEditingLocation(null);
              setLine1Edited(false);
              setMode("new");
            }}
            aria-pressed={mode === "new"}
            className={tabBtn(mode === "new")}
          >
            <Plus className="h-4 w-4" aria-hidden="true" />
            Add new
          </button>
        </div>

        {mode === "list" && (
          <>
            {isLoading && <LoadingState label="Loading your addresses…" />}
            {isError && <ErrorState title="Couldn't load your addresses" message={error?.message} onRetry={refetch} />}
            {!isLoading && !isError && addresses.length === 0 && (
              <EmptyState
                title="No saved addresses yet"
                description="Add an address to continue."
                action={
                  <button
                    type="button"
                    onClick={() => setMode("new")}
                    className={clsx("min-h-[44px] rounded-full bg-brand px-5 text-sm font-semibold text-white", FOCUS_RING)}
                  >
                    + Add new address
                  </button>
                }
              />
            )}
            {!isLoading && !isError && addresses.length > 0 && (
              <div role="radiogroup" aria-label="Saved addresses" className="grid gap-3">
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
                      className={clsx(
                        "relative flex w-full cursor-pointer items-start gap-3.5 rounded-2xl border p-4 text-left transition-all duration-200 motion-reduce:transition-none",
                        FOCUS_RING,
                        isSelected
                          ? "border-brand bg-brand-soft shadow-[0_14px_26px_-20px_rgba(67,56,202,.8)] ring-1 ring-brand"
                          : "border-line bg-panel hover:border-brand/50 motion-safe:hover:-translate-y-px",
                        addr.serviceable && !isDeleting ? "" : "opacity-60",
                      )}
                    >
                      <span
                        aria-hidden="true"
                        className={clsx(
                          "mt-0.5 flex h-6 w-6 shrink-0 items-center justify-center rounded-full border-2",
                          isSelected ? "border-brand bg-brand text-white" : "border-line text-transparent",
                        )}
                      >
                        <Check className="h-3.5 w-3.5" strokeWidth={3.5} />
                      </span>
                      <div className="min-w-0 flex-1">
                        <span className="flex flex-wrap items-center gap-2">
                          <span className="text-sm font-bold text-ink">{addr.label}</span>
                          {addr.isDefault && <span className="rounded-full bg-brand-soft px-2 py-0.5 text-[10px] font-semibold text-brand">Default</span>}
                          {!addr.serviceable && <span className="rounded-full bg-danger-soft px-2 py-0.5 text-[10px] font-semibold text-ink">Not serviceable</span>}
                        </span>
                        <span className="mt-0.5 block break-words text-sm text-muted">
                          {addr.line1}, {addr.city}, {addr.state} {addr.pincode}
                        </span>
                      </div>
                      <div className="flex shrink-0 items-center gap-1">
                        <button
                          type="button"
                          onClick={(e) => handleEdit(addr, e)}
                          className={clsx("inline-flex items-center gap-1 rounded-full px-2.5 py-1.5 text-xs font-semibold text-muted transition-colors hover:bg-white hover:text-brand", FOCUS_RING)}
                          title="Edit address"
                        >
                          <Pencil className="h-3.5 w-3.5" aria-hidden="true" />
                          Edit
                        </button>
                        <button
                          type="button"
                          disabled={isDeleting}
                          onClick={(e) => handleDelete(addr.id, e)}
                          className={clsx("inline-flex items-center gap-1 rounded-full px-2.5 py-1.5 text-xs font-semibold text-muted transition-colors hover:bg-white hover:text-danger disabled:opacity-50", FOCUS_RING)}
                          title="Delete address"
                        >
                          <Trash2 className="h-3.5 w-3.5" aria-hidden="true" />
                          {isDeleting ? "…" : "Delete"}
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
          <form id="address-form" onSubmit={submitNew} className="space-y-4" noValidate>
            <div>
              <p className="mb-2 text-xs font-semibold text-ink">Pin your location</p>
              <MapAddressPicker
                key={editingId ?? "new"}
                value={editingLocation}
                onPick={applyPick}
                autoLocate={!editingId}
                className="h-[300px] sm:h-[340px]"
              />
              <p className="mt-2 text-xs text-muted">Drag the map or search. We'll fill in the details below. You can still edit them.</p>
            </div>
            {formError && (
              <div role="alert" className="rounded-2xl border border-danger bg-danger-soft px-4 py-3 text-sm text-ink">
                {formError}
              </div>
            )}
            <div className="grid gap-4 sm:grid-cols-2">
              <div>
                <label htmlFor="addr-label" className="mb-1.5 block text-xs font-semibold text-ink">Label</label>
                <select id="addr-label" value={form.label} onChange={setField("label")} className={inputClass}>
                  {LABELS.map((l) => (
                    <option key={l} value={l}>{l}</option>
                  ))}
                </select>
              </div>
              <div>
                <label htmlFor="addr-pincode" className="mb-1.5 block text-xs font-semibold text-ink">Pincode</label>
                <input
                  id="addr-pincode"
                  value={form.pincode}
                  onChange={setField("pincode")}
                  inputMode="numeric"
                  maxLength={6}
                  autoComplete="postal-code"
                  aria-describedby="addr-pincode-hint"
                  className={inputClass}
                />
                <p id="addr-pincode-hint" role="status" className="mt-1 min-h-[1rem] text-xs text-muted">
                  {pincodeReady && serviceability.isFetching && "Checking your area…"}
                  {pincodeReady && serviceability.data?.serviceable && `✓ We serve ${serviceability.data.city}.`}
                  {pincodeReady && serviceability.data && !serviceability.data.serviceable && "We don't service this pincode yet."}
                  {pincodeReady && serviceability.isError && "Couldn't check this pincode right now."}
                </p>
              </div>
            </div>
            <div>
              <label htmlFor="addr-line1" className="mb-1.5 block text-xs font-semibold text-ink">Address line</label>
              <input id="addr-line1" value={form.line1} onChange={(e) => { setField("line1")(e); setLine1Edited(true); }} autoComplete="address-line1" className={inputClass} />
            </div>
            <div>
              <label htmlFor="addr-landmark" className="mb-1.5 block text-xs font-semibold text-ink">Landmark (optional)</label>
              <input id="addr-landmark" value={form.landmark} onChange={setField("landmark")} className={inputClass} />
            </div>
            <div className="grid gap-4 sm:grid-cols-2">
              <div>
                <label htmlFor="addr-city" className="mb-1.5 block text-xs font-semibold text-ink">City</label>
                <input id="addr-city" value={form.city} onChange={setField("city")} autoComplete="address-level2" className={inputClass} />
              </div>
              <div>
                <label htmlFor="addr-state" className="mb-1.5 block text-xs font-semibold text-ink">State</label>
                <input id="addr-state" value={form.state} onChange={setField("state")} autoComplete="address-level1" className={inputClass} />
              </div>
            </div>
          </form>
        )}
      </section>

      {/* Mobile / tablet: floating action bar */}
      <div className="sticky bottom-[calc(4.75rem+env(safe-area-inset-bottom))] z-20 md:bottom-4 lg:hidden">
        <div className="flex items-center gap-2 rounded-3xl border border-line bg-white/90 p-2 shadow-[0_18px_40px_-14px_rgba(30,27,46,.45)] backdrop-blur-xl">{actions}</div>
      </div>
    </div>

    {/* Desktop: sticky summary */}
    <aside className="hidden lg:sticky lg:top-24 lg:block" aria-label="Your booking">
      <div className="overflow-hidden rounded-3xl border border-line bg-panel shadow-[0_30px_70px_-44px_rgba(67,56,202,.6)]">
        <div className="bg-gradient-to-br from-brand to-[#6D5BE8] px-5 py-5 text-white">
          <p className="text-[11px] font-semibold uppercase tracking-wider text-white/70">Service address</p>
          {selected ? (
            <>
              <p className="mt-1.5 text-lg font-bold leading-snug">{selected.label}</p>
              <p className="mt-0.5 break-words text-sm text-white/85">
                {selected.line1}, {selected.city} – {selected.pincode}
              </p>
            </>
          ) : (
            <>
              <p className="mt-1.5 text-lg font-bold leading-snug">Select an address</p>
              <p className="mt-0.5 text-sm text-white/75">Your choice will appear here.</p>
            </>
          )}
        </div>
        <dl className="space-y-4 px-5 py-5 text-sm">
          <div className="flex items-start gap-3">
            <span className="mt-0.5 flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-brand-soft text-brand">
              <Sparkles className="h-4 w-4" aria-hidden="true" />
            </span>
            <div className="min-w-0">
              <dt className="text-xs text-muted">Service</dt>
              <dd className="font-semibold text-ink">
                {serviceName ?? "Home service"} × {quantity}
              </dd>
              {addOns.length > 0 && <dd className="text-xs text-muted">+ {addOns.length} add-on{addOns.length > 1 ? "s" : ""}</dd>}
            </div>
          </div>
          <div className="flex items-baseline justify-between border-t border-line pt-4">
            <dt className="text-muted">Estimated</dt>
            <dd className="text-lg font-bold tabular-nums text-ink">{formatINR(estimate)}</dd>
          </div>
        </dl>
        <div className="flex items-center gap-2 px-5 pb-5">{actions}</div>
        <p className="flex items-center justify-center gap-1.5 border-t border-line bg-canvas px-5 py-3 text-xs text-muted">
          <ShieldCheck className="h-3.5 w-3.5 text-emerald-600" aria-hidden="true" />
          Only serviceable areas can be selected
        </p>
      </div>
    </aside>
  </div>
);
}
