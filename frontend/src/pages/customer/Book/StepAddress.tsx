import { useEffect, useState, type FormEvent } from "react";
import { ArrowLeft, ArrowRight, Briefcase, CheckCircle2, Home, Loader2, MapPin, Pencil, Plus, Trash2, TriangleAlert, type LucideIcon } from "lucide-react";
import clsx from "clsx";
import BookingSummary from "./components/BookingSummary";
import MapAddressPicker, { type PickedLocation } from "@/components/customer/maps/MapAddressPicker";
import { useQuery } from "@tanstack/react-query";
import { useAddresses, useBookingDraftStore } from "@/features/booking";
import { LoadingState, ErrorState, EmptyState } from "@/components/customer";
import { FOCUS_RING } from "@/components/customer/focusRing";
import { addressApi } from "@/services/addressApi";
import type { NormalizedApiError } from "@/services/bookingApi";
import { ADDRESS_LABELS, type AddressView } from "@/types/address";
import type { AddressSnapshot } from "@/types/booking";

const LABELS = ADDRESS_LABELS;
const LABEL_ICONS: Record<string, LucideIcon> = { Home, Work: Briefcase, Other: MapPin };

interface FormState {
  label: string;
  /** Typed by the customer. */
  house: string;
  /** Filled from the map until the customer types their own. */
  street: string;
  /** Filled from the map (locality / neighbourhood). */
  area: string;
  landmark: string;
  city: string;
  state: string;
  pincode: string;
}
const EMPTY_FORM: FormState = { label: "Home", house: "", street: "", area: "", landmark: "", city: "", state: "", pincode: "" };

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

const inputClass = `min-h-[42px] w-full rounded-xl border border-line bg-canvas px-3.5 py-1.5 text-base text-ink transition-colors placeholder:text-[13px] placeholder:text-muted/60 focus:border-brand sm:placeholder:text-sm sm:min-h-[48px] sm:px-4 sm:py-2.5 sm:text-sm ${FOCUS_RING}`;

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
  const [location, setLocation] = useState<{ lat: number; lng: number } | undefined>(undefined);
  const [editingLocation, setEditingLocation] = useState<{ lat: number; lng: number } | null>(null);
  const [streetEdited, setStreetEdited] = useState(false);

  // Live serviceability hint once a full 6-digit pincode is typed
  const pincodeReady = /^\d{6}$/.test(form.pincode);
  const serviceability = useQuery({
    queryKey: ["serviceability", form.pincode],
    queryFn: () => addressApi.checkServiceability(form.pincode),
    enabled: mode === "new" && pincodeReady,
    staleTime: 5 * 60 * 1000,
  });
  // A pincode we don't serve can't be used for a booking, so the save button is really disabled (not just ignored).
  const pincodeBlocked = mode === "new" && pincodeReady && !serviceability.isFetching && serviceability.data?.serviceable === false;

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
      street: streetEdited || !p.line1 ? f.street : p.line1,
      area: p.area || f.area,
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
      house: addr.house ?? (addr.street ? "" : addr.line1),
      street: addr.street ?? "",
      area: addr.area ?? addr.line2 ?? "",
      landmark: addr.landmark ?? "",
      city: addr.city,
      state: addr.state,
      pincode: addr.pincode,
    });
    setFormError(null);
    setLocation(addr.location);
    setEditingLocation(addr.location ?? null);
    setStreetEdited(true);
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
    // Addresses saved before house / street existed only have one line, so don't force a street on those.
    const editing = addresses.find((a) => a.id === editingId);
    const streetRequired = !(editing && !editing.house && !editing.street);
    if (!form.house.trim() || (streetRequired && !form.street.trim()) || !form.city.trim() || !form.state.trim() || !/^\d{6}$/.test(form.pincode.trim())) {
      setFormError(`Please fill in your house number, ${streetRequired ? "street, " : ""}city, state and a 6-digit pincode.`);
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
        label: ADDRESS_LABELS.find((l) => l === form.label) ?? "Home",
        house: form.house.trim(),
        ...(form.street.trim() ? { street: form.street.trim() } : {}),
        // An empty string clears the field when editing (the API sets what it is given).
        ...(form.area.trim() || editingId ? { area: form.area.trim() } : {}),
        ...(form.landmark.trim() || editingId ? { landmark: form.landmark.trim() } : {}),
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
      setStreetEdited(false);
      setEditingId(null);
      setMode("list");
      refetch();
    } catch (err) {
      setFormError((err as NormalizedApiError).message ?? "Couldn't save this address. Please try again.");
    }
  };

const startNew = () => {
  setEditingId(null);
  setForm(EMPTY_FORM);
  setFormError(null);
  setLocation(undefined);
  setEditingLocation(null);
  setStreetEdited(false);
  setMode("new");
};

const backToList = () => {
  setEditingId(null);
  setMode("list");
};

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
        disabled={isCreating || pincodeBlocked}
        title={pincodeBlocked ? "We don't serve this pincode yet. Change the pincode to continue." : undefined}
        className={clsx("inline-flex min-h-[48px] flex-1 items-center justify-center gap-2 rounded-full bg-brand px-6 text-sm font-bold text-white shadow-sm transition-colors hover:bg-[#3730A3] disabled:cursor-not-allowed disabled:opacity-50 disabled:hover:bg-brand", FOCUS_RING)}
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

      <section aria-label="Service address" className="rounded-3xl border border-line bg-panel p-3.5 shadow-[0_24px_60px_-48px_rgba(67,56,202,.55)] sm:p-6">
        {notServiceable && (
          <div role="alert" className="mb-4 rounded-2xl border border-danger bg-danger-soft px-4 py-3 text-sm text-ink">
            Sorry, we don't currently service that area. Please choose a different address.
          </div>
        )}

        {mode === "new" && (
          <div className="mb-5 flex items-center justify-between gap-3">
            <h4 className="text-base font-bold text-ink">{editingId ? "Edit address" : "Add a new address"}</h4>
            {addresses.length > 0 && (
              <button type="button" onClick={backToList} className={clsx("inline-flex min-h-[40px] items-center gap-1.5 rounded-full px-3 text-sm font-semibold text-brand hover:bg-brand-soft", FOCUS_RING)}>
                <ArrowLeft className="h-4 w-4" aria-hidden="true" />
                Saved addresses
              </button>
            )}
          </div>
        )}

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
                <button
                  type="button"
                  onClick={startNew}
                  className={clsx("flex items-center gap-3 rounded-2xl border-[1.5px] border-dashed border-brand/50 bg-brand-soft/60 p-3.5 text-left transition-colors hover:bg-brand-soft", FOCUS_RING)}
                >
                  <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-brand text-white">
                    <Plus className="h-5 w-5" aria-hidden="true" />
                  </span>
                  <span>
                    <span className="block text-sm font-semibold text-brand">Add new address</span>
                    <span className="block text-xs text-muted">Pin it on the map and we'll fill in the rest</span>
                  </span>
                </button>
                {sortedAddresses.map((addr) => {
                  const isSelected = selectedAddressId === addr.id;
                  const isDeleting = isDeletingId === addr.id;
                  const Icon = LABEL_ICONS[addr.label] ?? MapPin;
                  return (
                    <div
                      key={addr.id}
                      role="radio"
                      aria-checked={isSelected}
                      aria-disabled={!addr.serviceable}
                      tabIndex={0}
                      onClick={() => choose(addr)}
                      onKeyDown={(e) => {
                        if (e.key === "Enter" || e.key === " ") choose(addr);
                      }}
                      className={clsx(
                        "relative w-full cursor-pointer overflow-hidden rounded-2xl border bg-panel text-left transition-all duration-200 motion-reduce:transition-none",
                        FOCUS_RING,
                        isSelected
                          ? "border-brand shadow-[0_14px_26px_-20px_rgba(67,56,202,.8)] ring-2 ring-brand/20"
                          : addr.serviceable
                            ? "border-line hover:border-brand/50 motion-safe:hover:-translate-y-px"
                            : "border-danger/40",
                        isDeleting && "opacity-50",
                      )}
                    >
                      <div className="flex items-start gap-3 p-3 sm:gap-3.5 sm:p-4">
                        <span className={clsx("flex h-9 w-9 shrink-0 items-center justify-center rounded-xl sm:h-11 sm:w-11 sm:rounded-2xl", isSelected ? "bg-brand text-white" : addr.serviceable ? "bg-brand-soft text-brand" : "bg-canvas text-muted")}>
                          <Icon className="h-5 w-5" aria-hidden="true" />
                        </span>
                        <div className="min-w-0 flex-1">
                          <span className="flex flex-wrap items-center gap-2">
                            <span className="text-sm font-bold text-ink">{addr.label}</span>
                            {isSelected && (
                              <span className="inline-flex items-center gap-1 rounded-full bg-brand px-2 py-0.5 text-[10px] font-semibold text-white">
                                <CheckCircle2 className="h-3 w-3" aria-hidden="true" /> Selected
                              </span>
                            )}
                            {addr.isDefault && <span className="rounded-full bg-brand-soft px-2 py-0.5 text-[10px] font-semibold text-brand">Default</span>}
                            {!addr.serviceable && <span className="rounded-full bg-danger-soft px-2 py-0.5 text-[10px] font-semibold text-danger">Not serviceable</span>}
                          </span>
                          <span className="mt-1 block break-words text-sm text-ink">
                            {addr.line1}
                            {addr.line2 ? `, ${addr.line2}` : ""}
                          </span>
                          <span className="block break-words text-xs text-muted">
                            {addr.city}, {addr.state} {addr.pincode}
                            {addr.landmark ? ` · Near ${addr.landmark}` : ""}
                          </span>
                        </div>
                        <div className="flex shrink-0 items-center">
                          <button
                            type="button"
                            onClick={(e) => handleEdit(addr, e)}
                            className={clsx("flex h-9 w-9 items-center justify-center rounded-full text-muted transition-colors hover:bg-canvas sm:h-10 sm:w-10 hover:text-brand", FOCUS_RING)}
                            aria-label={`Edit ${addr.label} address`}
                            title="Edit address"
                          >
                            <Pencil className="h-4 w-4" aria-hidden="true" />
                          </button>
                          <button
                            type="button"
                            disabled={isDeleting}
                            onClick={(e) => handleDelete(addr.id, e)}
                            className={clsx("flex h-9 w-9 items-center justify-center rounded-full text-muted transition-colors hover:bg-canvas sm:h-10 sm:w-10 hover:text-danger disabled:opacity-50", FOCUS_RING)}
                            aria-label={`Delete ${addr.label} address`}
                            title="Delete address"
                          >
                            {isDeleting ? <Loader2 className="h-4 w-4 animate-spin" aria-hidden="true" /> : <Trash2 className="h-4 w-4" aria-hidden="true" />}
                          </button>
                        </div>
                      </div>
                      {!addr.serviceable && (
                        <div className="flex flex-wrap items-center justify-between gap-x-3 gap-y-1 border-t border-danger/20 bg-danger-soft px-3 py-2 text-xs text-ink sm:px-4 sm:py-2.5">
                          <span className="inline-flex items-center gap-1.5">
                            <TriangleAlert className="h-3.5 w-3.5 text-danger" aria-hidden="true" /> We don&apos;t serve this area yet.
                          </span>
                          <button type="button" onClick={(e) => handleEdit(addr, e)} className={clsx("rounded font-semibold text-danger underline", FOCUS_RING)}>
                            Edit pincode
                          </button>
                        </div>
                      )}
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
            <fieldset>
              <legend className="mb-2 text-xs font-semibold text-ink">Save as</legend>
              <div className="grid grid-cols-3 gap-2">
                {LABELS.map((l) => {
                  const Icon = LABEL_ICONS[l];
                  const active = form.label === l;
                  return (
                    <button
                      key={l}
                      type="button"
                      aria-pressed={active}
                      onClick={() => setForm((f) => ({ ...f, label: l }))}
                      className={clsx(
                        "flex min-h-[40px] items-center justify-center gap-1.5 rounded-xl border text-[13px] font-medium transition-colors sm:min-h-[48px] sm:gap-2 sm:text-sm",
                        active ? "border-brand bg-brand-soft text-brand" : "border-line bg-canvas text-muted hover:border-brand/50",
                        FOCUS_RING,
                      )}
                    >
                      <Icon className="h-4 w-4" aria-hidden="true" /> {l}
                    </button>
                  );
                })}
              </div>
            </fieldset>
            <div className="grid gap-3 sm:grid-cols-2 sm:gap-4">
              <div>
                <label htmlFor="addr-house" className="mb-1.5 block text-xs font-semibold text-ink">House / flat no.</label>
                <input id="addr-house" value={form.house} onChange={setField("house")} maxLength={100} autoComplete="address-line1" placeholder="Flat 302, Manjeera Trinity" className={inputClass} />
              </div>
              <div>
                <label htmlFor="addr-street" className="mb-1.5 block text-xs font-semibold text-ink">Street / road</label>
                <input id="addr-street" value={form.street} onChange={(e) => { setField("street")(e); setStreetEdited(true); }} maxLength={150} autoComplete="address-line2" className={inputClass} />
              </div>
            </div>
            <div className="grid gap-3 sm:grid-cols-2 sm:gap-4">
              <div>
                <label htmlFor="addr-area" className="mb-1.5 block text-xs font-semibold text-ink">Area / locality (optional)</label>
                <input id="addr-area" value={form.area} onChange={setField("area")} maxLength={150} className={inputClass} />
              </div>
              <div>
                <label htmlFor="addr-landmark" className="mb-1.5 block text-xs font-semibold text-ink">Landmark (optional)</label>
                <input id="addr-landmark" value={form.landmark} onChange={setField("landmark")} maxLength={200} className={inputClass} />
              </div>
            </div>
            <div className="grid gap-3 sm:grid-cols-2 sm:gap-4">
              <div>
                <label htmlFor="addr-city" className="mb-1.5 block text-xs font-semibold text-ink">City</label>
                <input id="addr-city" value={form.city} onChange={setField("city")} autoComplete="address-level2" className={inputClass} />
              </div>
              <div>
                <label htmlFor="addr-state" className="mb-1.5 block text-xs font-semibold text-ink">State</label>
                <input id="addr-state" value={form.state} onChange={setField("state")} autoComplete="address-level1" className={inputClass} />
              </div>
            </div>
            <div>
              <label htmlFor="addr-pincode" className="mb-1.5 block text-xs font-semibold text-ink">Pincode</label>
              <input
                id="addr-pincode"
                value={form.pincode}
                onChange={(e) => setForm((f) => ({ ...f, pincode: e.target.value.replace(/\D/g, "").slice(0, 6) }))}
                inputMode="numeric"
                maxLength={6}
                autoComplete="postal-code"
                aria-describedby="addr-pincode-hint"
                className={clsx(inputClass, "sm:max-w-[16rem]")}
              />
              <p id="addr-pincode-hint" role="status" aria-live="polite" className="mt-2 flex min-h-[1.75rem] items-center text-xs">
                {!pincodeReady && <span className="text-muted">Enter your 6-digit pincode to check we serve your area.</span>}
                {pincodeReady && serviceability.isFetching && (
                  <span className="inline-flex items-center gap-1.5 text-muted">
                    <Loader2 className="h-3.5 w-3.5 animate-spin" aria-hidden="true" /> Checking your area…
                  </span>
                )}
                {pincodeReady && !serviceability.isFetching && serviceability.data?.serviceable && (
                  <span className="inline-flex items-center gap-1.5 rounded-full bg-emerald-50 px-3 py-1 font-medium text-emerald-700">
                    <CheckCircle2 className="h-3.5 w-3.5" aria-hidden="true" /> We serve {serviceability.data.city}.
                  </span>
                )}
                {pincodeReady && !serviceability.isFetching && serviceability.data && !serviceability.data.serviceable && (
                  <span className="inline-flex items-center gap-1.5 rounded-full bg-danger-soft px-3 py-1 font-medium text-danger">
                    <TriangleAlert className="h-3.5 w-3.5" aria-hidden="true" /> We don&apos;t service this pincode yet. Change it to continue.
                  </span>
                )}
                {pincodeReady && serviceability.isError && <span className="text-muted">Couldn&apos;t check this pincode right now.</span>}
              </p>
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
    <BookingSummary ariaLabel="Your booking" actions={actions} footnote="Only serviceable areas can be selected" />
  </div>
);
}
