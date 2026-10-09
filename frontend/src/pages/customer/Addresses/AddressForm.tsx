import { useState, type FormEvent } from "react";
import { Briefcase, Home, MapPin, type LucideIcon } from "lucide-react";
import clsx from "clsx";
import { FOCUS_RING } from "@/components/customer/focusRing";
import { useServiceability, type AddressDto, type AddressInput } from "@/features/customer";
import { ADDRESS_LABELS, type AddressLabel } from "@/types/address";
import MapAddressPicker, { type PickedLocation } from "@/components/customer/maps/MapAddressPicker";
import ServiceabilityResult from "./ServiceabilityResult";

const LABEL_ICONS: Record<AddressLabel, LucideIcon> = { Home, Work: Briefcase, Other: MapPin };

interface AddressFormProps {
  /** Present → editing that address; absent → adding a new one. */
  initial?: AddressDto;
  /** Adding your very first address: it becomes the default automatically. */
  isFirst: boolean;
  saving: boolean;
  /** Message from the server (e.g. "Some fields are invalid"). */
  serverError?: string;
  onSubmit: (input: AddressInput) => void;
  onCancel: () => void;
}

type Field = "house" | "street" | "city" | "state" | "pincode";
type Errors = Partial<Record<Field, string>>;

interface Values {
  house: string;
  street: string;
  city: string;
  state: string;
  pincode: string;
}

function validate(v: Values, streetRequired: boolean): Errors {
  const e: Errors = {};
  if (!v.house.trim()) e.house = "Enter your house or flat number";
  if (streetRequired && !v.street.trim()) e.street = "Enter the street or road";
  if (!v.city.trim()) e.city = "Enter the city";
  if (!v.state.trim()) e.state = "Enter the state";
  if (!/^\d{6}$/.test(v.pincode.trim())) e.pincode = "Pincode must be 6 digits";
  return e;
}

const inputClass = (invalid: boolean) =>
  clsx(
    "min-h-[42px] w-full rounded-xl border bg-canvas px-3.5 py-1.5 text-base text-ink transition-colors placeholder:text-[13px] placeholder:text-muted/60 focus:border-brand sm:placeholder:text-sm sm:min-h-[48px] sm:px-4 sm:py-2.5 sm:text-sm",
    invalid ? "border-danger" : "border-line",
    FOCUS_RING,
  );

const toLabel = (label: string | undefined): AddressLabel => (ADDRESS_LABELS as readonly string[]).includes(label ?? "") ? (label as AddressLabel) : label ? "Other" : "Home";

export default function AddressForm({ initial, isFirst, saving, serverError, onSubmit, onCancel }: AddressFormProps) {
  // Addresses saved before house / street existed only have line1 (+ line2). Put line1 in "house" and don't
  // force a street, so those can still be edited.
  const legacy = Boolean(initial) && !initial?.house && !initial?.street;
  const [label, setLabel] = useState<AddressLabel>(toLabel(initial?.label));
  const [house, setHouse] = useState(initial?.house ?? (legacy ? (initial?.line1 ?? "") : ""));
  const [street, setStreet] = useState(initial?.street ?? "");
  const [area, setArea] = useState(initial?.area ?? initial?.line2 ?? "");
  const [landmark, setLandmark] = useState(initial?.landmark ?? "");
  const [city, setCity] = useState(initial?.city ?? "");
  const [state, setState] = useState(initial?.state ?? "");
  const [pincode, setPincode] = useState(initial?.pincode ?? "");
  const [makeDefault, setMakeDefault] = useState(false);
  const [location, setLocation] = useState<{ lat: number; lng: number } | undefined>(initial?.location);
  // Once the customer types their own street, the map stops overwriting it.
  const [streetEdited, setStreetEdited] = useState(Boolean(initial?.street));
  const [errors, setErrors] = useState<Errors>({});

  const serviceability = useServiceability(pincode);
  const unavailable = serviceability.status === "unserviceable";
  const checking = serviceability.status === "checking";

  function applyPick(p: PickedLocation) {
    setLocation({ lat: p.lat, lng: p.lng });
    if (!streetEdited && p.line1) setStreet(p.line1);
    setArea(p.area);
    if (p.city) setCity(p.city);
    if (p.state) setState(p.state);
    if (p.pincode) setPincode(p.pincode.slice(0, 6));
    setErrors({});
  }

  function submit(e: FormEvent) {
    e.preventDefault();
    if (unavailable || checking) return;
    const found = validate({ house, street, city, state, pincode }, !legacy);
    setErrors(found);
    if (Object.keys(found).length > 0) return;
    onSubmit({
      label,
      house: house.trim(),
      ...(street.trim() ? { street: street.trim() } : {}),
      // An empty string clears the field on edit (the API $sets what it's given).
      ...(area.trim() || initial?.area || initial?.line2 ? { area: area.trim() } : {}),
      ...(landmark.trim() || initial?.landmark ? { landmark: landmark.trim() } : {}),
      city: city.trim(),
      state: state.trim(),
      pincode: pincode.trim(),
      ...(location ? { location } : {}),
      ...(makeDefault && !initial?.isDefault ? { isDefault: true } : {}),
    });
  }

  const err = (id: string, msg?: string) =>
    msg ? (
      <p id={id} role="alert" className="mt-1 text-xs text-danger">
        {msg}
      </p>
    ) : null;
  const describe = (id: string, msg?: string) => (msg ? id : undefined);
  const labelClass = "mb-1 block text-xs font-semibold text-ink sm:mb-1.5";
  const optional = <span className="font-normal text-muted">(optional)</span>;
  const sectionTitle = "text-[11px] font-semibold uppercase tracking-wider text-muted";

  return (
    <form onSubmit={submit} noValidate aria-label={initial ? "Edit address" : "Add a new address"} className="rounded-3xl  bg-panel shadow-[0_24px_60px_-48px_rgba(67,56,202,.55)]">
      <div className="lg:grid lg:grid-cols-[minmax(0,1fr)_minmax(0,1.05fr)]">
        {/* Map: on top for phones, pinned on the left for desktop */}
        <div className="space-y-2.5 p-3.5 pb-0 sm:space-y-3 sm:p-5 sm:pb-0 lg:sticky lg:top-24 lg:self-start lg:pb-5">
          <div className="flex items-start gap-3.5">
            <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-brand text-white sm:h-11 sm:w-11 sm:rounded-2xl shadow-[0_12px_24px_-12px_rgba(67,56,202,.8)]">
              <MapPin className="h-5 w-5" aria-hidden="true" />
            </span>
            <div>
              <h2 className="text-base font-bold tracking-tight text-ink sm:text-lg">{initial ? "Edit address" : "Add a new address"}</h2>
              <p className="text-xs text-muted">Drag the map so the pin sits on your exact location, or search for it.</p>
            </div>
          </div>
          <MapAddressPicker value={initial?.location ?? null} onPick={applyPick} autoLocate={!initial} className="h-[200px] sm:h-[320px] lg:h-[calc(100vh-18rem)] lg:min-h-[420px]" />
        </div>

        {/* Details */}
        <div className="space-y-4 p-3.5 sm:space-y-5 sm:p-5 ">
          <fieldset>
            <legend className={clsx(sectionTitle, "mb-2")}>Save as</legend>
            <div className="grid grid-cols-3 gap-2">
              {ADDRESS_LABELS.map((name) => {
                const Icon = LABEL_ICONS[name];
                const active = label === name;
                return (
                  <button
                    key={name}
                    type="button"
                    aria-pressed={active}
                    onClick={() => setLabel(name)}
                    className={clsx(
                      "flex min-h-[40px] items-center justify-center gap-1.5 rounded-xl border text-[13px] font-medium transition-colors sm:min-h-[48px] sm:gap-2 sm:text-sm",
                      active ? "border-brand bg-brand-soft text-brand" : "border-line bg-canvas text-muted hover:border-brand/50",
                      FOCUS_RING,
                    )}
                  >
                    <Icon className="h-4 w-4" aria-hidden="true" /> {name}
                  </button>
                );
              })}
            </div>
          </fieldset>

          <div className="space-y-3 sm:space-y-4">
            <p className={sectionTitle}>Address details</p>
            <div className="grid gap-3 sm:grid-cols-2 sm:gap-4">
              <div>
                <label htmlFor="addr-house" className={labelClass}>House / flat no.</label>
                <input id="addr-house" value={house} onChange={(e) => setHouse(e.target.value)} maxLength={100} autoComplete="address-line1" placeholder="Flat 302, Manjeera Trinity" aria-invalid={!!errors.house} aria-describedby={describe("addr-house-err", errors.house)} className={inputClass(!!errors.house)} />
                {err("addr-house-err", errors.house)}
              </div>
              <div>
                <label htmlFor="addr-street" className={labelClass}>
                  Street / road {legacy && optional}
                </label>
                <input id="addr-street" value={street} onChange={(e) => { setStreet(e.target.value); setStreetEdited(true); }} maxLength={150} autoComplete="address-line2" placeholder="JNTU Road" aria-invalid={!!errors.street} aria-describedby={describe("addr-street-err", errors.street)} className={inputClass(!!errors.street)} />
                {err("addr-street-err", errors.street)}
              </div>
              <div>
                <label htmlFor="addr-area" className={labelClass}>Area / locality {optional}</label>
                <input id="addr-area" value={area} onChange={(e) => setArea(e.target.value)} maxLength={150} placeholder="Kukatpally" className={inputClass(false)} />
              </div>
              <div>
                <label htmlFor="addr-landmark" className={labelClass}>Landmark {optional}</label>
                <input id="addr-landmark" value={landmark} onChange={(e) => setLandmark(e.target.value)} maxLength={200} placeholder="Near City Centre mall" className={inputClass(false)} />
              </div>
              <div>
                <label htmlFor="addr-city" className={labelClass}>City</label>
                <input id="addr-city" value={city} onChange={(e) => setCity(e.target.value)} maxLength={100} autoComplete="address-level2" placeholder="Hyderabad" aria-invalid={!!errors.city} aria-describedby={describe("addr-city-err", errors.city)} className={inputClass(!!errors.city)} />
                {err("addr-city-err", errors.city)}
              </div>
              <div>
                <label htmlFor="addr-state" className={labelClass}>State</label>
                <input id="addr-state" value={state} onChange={(e) => setState(e.target.value)} maxLength={100} autoComplete="address-level1" placeholder="Telangana" aria-invalid={!!errors.state} aria-describedby={describe("addr-state-err", errors.state)} className={inputClass(!!errors.state)} />
                {err("addr-state-err", errors.state)}
              </div>
            </div>

            <div>
              <label htmlFor="addr-pin" className={labelClass}>Pincode</label>
              <input
                id="addr-pin"
                value={pincode}
                onChange={(e) => setPincode(e.target.value.replace(/\D/g, "").slice(0, 6))}
                inputMode="numeric"
                autoComplete="postal-code"
                placeholder="500072"
                aria-invalid={!!errors.pincode || unavailable}
                aria-describedby={clsx("addr-pin-status", errors.pincode && "addr-pin-err")}
                className={clsx(inputClass(!!errors.pincode || unavailable), "sm:max-w-[16rem]")}
              />
              {err("addr-pin-err", errors.pincode)}
              <ServiceabilityResult pincode={pincode} id="addr-pin-status" className="mt-2" />
            </div>
          </div>

          {!initial?.isDefault && !isFirst && (
            <label className="flex min-h-[48px] cursor-pointer items-center justify-between gap-3 rounded-2xl border border-line bg-canvas px-3.5 py-2 sm:min-h-[56px] sm:px-4 sm:py-3">
              <span>
                <span className="block text-sm font-medium text-ink">Use this as my delivery address on the dashboard</span>
                <span className="block text-xs text-muted">You can change it any time.</span>
              </span>
              <input type="checkbox" checked={makeDefault} onChange={(e) => setMakeDefault(e.target.checked)} className="peer sr-only" />
              <span aria-hidden="true" className="relative h-6 w-11 shrink-0 rounded-full bg-line transition-colors after:absolute after:left-0.5 after:top-0.5 after:h-5 after:w-5 after:rounded-full after:bg-white after:shadow after:transition-transform peer-checked:bg-brand peer-checked:after:translate-x-5 peer-focus-visible:ring-2 peer-focus-visible:ring-brand peer-focus-visible:ring-offset-2" />
            </label>
          )}
          {isFirst && !initial && <p className="text-xs text-muted">This will be your delivery address on the dashboard.</p>}

          {serverError && <p role="alert" className="rounded-xl bg-danger-soft px-3 py-2 text-sm text-danger">{serverError}</p>}
          {unavailable && (
            <p id="addr-save-hint" className="rounded-xl bg-danger-soft px-3 py-2 text-sm text-danger">
              We can&apos;t save this address because we don&apos;t serve this pincode yet. Change the pincode or move the pin on the map.
            </p>
          )}

          {/* Phones: floating bar above the bottom nav. Desktop: sits at the end of the form. */}
          <div className="sticky bottom-[calc(4.75rem+env(safe-area-inset-bottom))] z-20 -mx-3.5 border-t border-line bg-panel/95 px-3.5 py-2.5 backdrop-blur sm:-mx-5 sm:px-5 md:bottom-0 lg:static lg:mx-0 lg:border-0 lg:bg-transparent lg:p-0 lg:backdrop-blur-none">
            <div className="flex flex-col-reverse gap-2 sm:flex-row sm:justify-end">
              <button type="button" onClick={onCancel} disabled={saving} className={clsx("min-h-[44px] rounded-full border border-line bg-panel px-6 sm:min-h-[48px] text-sm font-semibold text-ink transition-colors hover:bg-canvas", FOCUS_RING)}>
                Cancel
              </button>
              <button
                type="submit"
                disabled={saving || unavailable || checking}
                aria-describedby={unavailable ? "addr-save-hint" : undefined}
                className={clsx("min-h-[44px] rounded-full bg-brand px-8 sm:min-h-[48px] text-sm font-bold text-white shadow-sm transition-colors hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-60 sm:min-w-[11rem]", FOCUS_RING)}
              >
                {saving ? "Saving…" : checking ? "Checking area…" : initial ? "Save changes" : "Save address"}
              </button>
            </div>
          </div>
        </div>
      </div>
    </form>
  );
}
