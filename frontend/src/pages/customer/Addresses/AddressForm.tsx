import { useState, type FormEvent } from "react";
import { Briefcase, Home, MapPin } from "lucide-react";
import clsx from "clsx";
import { FOCUS_RING } from "@/components/customer/focusRing";
import type { AddressDto, AddressInput } from "@/features/customer";
import AddressMap from "./AddressMap";

const LABEL_CHOICES = [
  { name: "Home", icon: Home },
  { name: "Office", icon: Briefcase },
  { name: "Other", icon: MapPin },
] as const;

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

type Errors = Partial<Record<"label" | "line1" | "city" | "pincode", string>>;

function validate(v: { label: string; line1: string; city: string; pincode: string }): Errors {
  const e: Errors = {};
  if (!v.label.trim()) e.label = "Give this address a name";
  else if (v.label.trim().length > 30) e.label = "Keep the name under 30 characters";
  if (!v.line1.trim()) e.line1 = "Enter the house / street address";
  if (!v.city.trim()) e.city = "Enter the city";
  if (v.pincode.trim() && !/^\d{6}$/.test(v.pincode.trim())) e.pincode = "Pincode must be 6 digits";
  return e;
}

const inputClass = (invalid: boolean) =>
  clsx(
    "w-full rounded-lg border bg-panel px-3.5 py-3 text-base text-ink placeholder:text-muted sm:text-sm",
    invalid ? "border-danger" : "border-line",
    FOCUS_RING,
  );

export default function AddressForm({ initial, isFirst, saving, serverError, onSubmit, onCancel }: AddressFormProps) {
  const [label, setLabel] = useState(initial?.label ?? "Home");
  const [line1, setLine1] = useState(initial?.line1 ?? "");
  const [area, setArea] = useState(initial?.area ?? "");
  const [city, setCity] = useState(initial?.city ?? "");
  const [pincode, setPincode] = useState(initial?.pincode ?? "");
  const [makeDefault, setMakeDefault] = useState(false);
  const [errors, setErrors] = useState<Errors>({});

  function submit(e: FormEvent) {
    e.preventDefault();
    const found = validate({ label, line1, city, pincode });
    setErrors(found);
    if (Object.keys(found).length > 0) return;
    onSubmit({
      label: label.trim(),
      line1: line1.trim(),
      area: area.trim() || null,
      city: city.trim(),
      pincode: pincode.trim() || null,
      ...(makeDefault && !initial?.isDefault ? { isDefault: true } : {}),
    });
  }

  const err = (id: string, msg?: string) =>
    msg ? (
      <p id={id} role="alert" className="mt-1 text-xs text-danger">
        {msg}
      </p>
    ) : null;

  return (
    <form onSubmit={submit} noValidate aria-label={initial ? "Edit address" : "Add a new address"} className="overflow-hidden rounded-xl border border-line bg-panel shadow-sm">
      <div className="relative h-24 sm:h-28">
        <AddressMap seed={initial?.id ?? "new-address"} className="h-full w-full" />
        <div className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-panel to-transparent px-4 pb-2 pt-8 sm:px-5">
          <h2 className="text-base font-semibold text-ink">{initial ? "Edit address" : "Add a new address"}</h2>
        </div>
      </div>
      <div className="space-y-4 p-4 pt-3 sm:p-5 sm:pt-3">

      <div>
        <label htmlFor="addr-label" className="mb-1 block text-sm font-medium text-ink">Save as</label>
        <div className="mb-2 flex flex-wrap gap-2">
          {LABEL_CHOICES.map(({ name, icon: Icon }) => {
            const active = name === "Other" ? !["Home", "Office"].includes(label) : label === name;
            return (
              <button
                key={name}
                type="button"
                aria-pressed={active}
                onClick={() => setLabel(name === "Other" ? "" : name)}
                className={clsx(
                  "flex min-h-[44px] items-center gap-1.5 rounded-full border px-4 text-sm font-medium transition-colors",
                  active ? "border-brand bg-brand-soft text-brand" : "border-line text-muted hover:border-brand",
                  FOCUS_RING,
                )}
              >
                <Icon className="h-4 w-4" aria-hidden="true" /> {name}
              </button>
            );
          })}
        </div>
        <input id="addr-label" value={label} onChange={(e) => setLabel(e.target.value)} maxLength={30} placeholder="e.g. Parents' Home" aria-invalid={!!errors.label} aria-describedby={errors.label ? "addr-label-err" : undefined} className={inputClass(!!errors.label)} />
        {err("addr-label-err", errors.label)}
      </div>

      <div>
        <label htmlFor="addr-line1" className="mb-1 block text-sm font-medium text-ink">House / flat, street</label>
        <input id="addr-line1" value={line1} onChange={(e) => setLine1(e.target.value)} maxLength={200} placeholder="Flat 302, Manjeera Trinity" aria-invalid={!!errors.line1} aria-describedby={errors.line1 ? "addr-line1-err" : undefined} className={inputClass(!!errors.line1)} />
        {err("addr-line1-err", errors.line1)}
      </div>

      <div className="grid gap-4 sm:grid-cols-2">
        <div>
          <label htmlFor="addr-area" className="mb-1 block text-sm font-medium text-ink">Area / locality <span className="font-normal text-muted">(optional)</span></label>
          <input id="addr-area" value={area} onChange={(e) => setArea(e.target.value)} maxLength={100} placeholder="Kukatpally" className={inputClass(false)} />
        </div>
        <div>
          <label htmlFor="addr-city" className="mb-1 block text-sm font-medium text-ink">City</label>
          <input id="addr-city" value={city} onChange={(e) => setCity(e.target.value)} maxLength={100} placeholder="Hyderabad" aria-invalid={!!errors.city} aria-describedby={errors.city ? "addr-city-err" : undefined} className={inputClass(!!errors.city)} />
          {err("addr-city-err", errors.city)}
        </div>
      </div>

      <div className="sm:w-1/2">
        <label htmlFor="addr-pin" className="mb-1 block text-sm font-medium text-ink">Pincode <span className="font-normal text-muted">(optional)</span></label>
        <input id="addr-pin" value={pincode} onChange={(e) => setPincode(e.target.value.replace(/\D/g, "").slice(0, 6))} inputMode="numeric" placeholder="500072" aria-invalid={!!errors.pincode} aria-describedby={errors.pincode ? "addr-pin-err" : undefined} className={inputClass(!!errors.pincode)} />
        {err("addr-pin-err", errors.pincode)}
      </div>

      {!initial?.isDefault && !isFirst && (
        <label className="flex min-h-[44px] items-center gap-2 text-sm text-ink">
          <input type="checkbox" checked={makeDefault} onChange={(e) => setMakeDefault(e.target.checked)} className="h-4 w-4 accent-brand" />
          Use this as my delivery address on the dashboard
        </label>
      )}
      {isFirst && !initial && <p className="text-xs text-muted">This will be your delivery address on the dashboard.</p>}

      {serverError && <p role="alert" className="rounded bg-danger-soft px-3 py-2 text-sm text-danger">{serverError}</p>}

      <div className="flex flex-col-reverse gap-2 sm:flex-row">
        <button type="submit" disabled={saving} className={clsx("min-h-[48px] rounded-lg bg-brand px-6 text-sm font-semibold text-white hover:opacity-90 disabled:opacity-60", FOCUS_RING)}>
          {saving ? "Saving…" : initial ? "Save changes" : "Save address"}
        </button>
        <button type="button" onClick={onCancel} disabled={saving} className={clsx("min-h-[48px] rounded-lg border border-line px-6 text-sm font-medium text-ink hover:border-brand", FOCUS_RING)}>
          Cancel
        </button>
      </div>
      </div>
    </form>
  );
}
