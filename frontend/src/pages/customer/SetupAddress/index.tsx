import { useState, type FormEvent } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { ArrowRight, Briefcase, CheckCircle2, Home, Loader2, MapPin, ShieldCheck, TriangleAlert } from "lucide-react";
import clsx from "clsx";
import { FOCUS_RING } from "@/components/customer/focusRing";
import MapAddressPicker, { type PickedLocation } from "@/components/customer/maps/MapAddressPicker";
import { useCreateAddress } from "@/features/customer";
import { addressApi } from "@/services/addressApi";
import { customerPath } from "@/routes/customerPath";

/** Set when the customer taps "Skip for now", so the gate doesn't send them back during this session. */
export const SKIP_ADDRESS_SETUP_KEY = "hcx:address-setup-skipped";

const LABELS = [
  { name: "Home", icon: Home },
  { name: "Office", icon: Briefcase },
  { name: "Other", icon: MapPin },
] as const;

const field = (invalid = false) =>
  clsx(
    "min-h-[48px] w-full rounded-xl border bg-canvas px-4 text-sm text-ink placeholder:text-muted/60",
    invalid ? "border-danger" : "border-line",
    FOCUS_RING,
  );

/**
 * First step for a brand-new customer: pin the service location on a live Google map (Swiggy / Zomato style),
 * confirm the details, and continue. Renders outside the dashboard layout so nothing competes for attention.
 */
export default function SetupAddress() {
  const navigate = useNavigate();
  const { state } = useLocation() as { state?: { from?: string } };
  const create = useCreateAddress();

  const [label, setLabel] = useState("Home");
  const [line1, setLine1] = useState("");
  const [line1Edited, setLine1Edited] = useState(false);
  const [landmark, setLandmark] = useState("");
  const [city, setCity] = useState("");
  const [stateName, setStateName] = useState("");
  const [pincode, setPincode] = useState("");
  const [coords, setCoords] = useState<{ lat: number; lng: number } | undefined>();
  const [pinned, setPinned] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const pincodeReady = /^\d{6}$/.test(pincode);
  const serviceability = useQuery({
    queryKey: ["serviceability", pincode],
    queryFn: () => addressApi.checkServiceability(pincode),
    enabled: pincodeReady,
    staleTime: 5 * 60 * 1000,
  });
  const notServiceable = pincodeReady && serviceability.data?.serviceable === false;

  const applyPick = (p: PickedLocation) => {
    setPinned(true);
    setCoords({ lat: p.lat, lng: p.lng });
    if (!line1Edited && p.line1) setLine1(p.line1);
    if (p.city) setCity(p.city);
    if (p.state) setStateName(p.state);
    if (p.pincode) setPincode(p.pincode.slice(0, 6));
    setError(null);
  };

  const goOn = () => navigate(state?.from && state.from.startsWith(customerPath()) ? state.from : customerPath("/"), { replace: true });

  const skip = () => {
    try {
      sessionStorage.setItem(SKIP_ADDRESS_SETUP_KEY, "1");
    } catch {
      /* private mode: the gate will simply ask again next time */
    }
    goOn();
  };

  const submit = (e: FormEvent) => {
    e.preventDefault();
    if (create.isPending) return;
    if (!line1.trim() || !city.trim() || !stateName.trim() || !/^\d{6}$/.test(pincode.trim()) || !label.trim()) {
      setError("Please fill in the house / street, city, state and a 6-digit pincode.");
      return;
    }
    if (notServiceable) {
      setError("We don't service this pincode yet. Move the pin to a different spot.");
      return;
    }
    setError(null);
    create.mutate(
      {
        label: label.trim(),
        line1: line1.trim(),
        ...(landmark.trim() ? { landmark: landmark.trim() } : {}),
        city: city.trim(),
        state: stateName.trim(),
        pincode: pincode.trim(),
        ...(coords ? { location: coords } : {}),
        isDefault: true,
      },
      { onSuccess: goOn, onError: (err) => setError(err.message || "Couldn't save this address. Please try again.") },
    );
  };

  return (
    <div className="min-h-screen bg-canvas">
      <header className="mx-auto flex max-w-6xl items-center justify-between px-4 py-4 sm:px-6">
        <span className="text-xl font-bold tracking-tight">
          <span className="text-accent">Home</span>
          <span className="text-brand">CareX</span>
        </span>
        <button type="button" onClick={skip} className={clsx("rounded-full px-4 py-2 text-sm font-semibold text-muted hover:bg-white hover:text-brand", FOCUS_RING)}>
          Skip for now
        </button>
      </header>

      <main className="mx-auto grid max-w-6xl gap-6 px-4 pb-10 sm:px-6 lg:grid-cols-[minmax(0,1.15fr)_minmax(0,1fr)] lg:items-start lg:gap-8">
        {/* Map */}
        <div className="lg:sticky lg:top-6">
          <div className="mb-4">
            <h1 className="text-2xl font-bold tracking-tight text-ink sm:text-3xl">Where do you need us?</h1>
            <p className="mt-1 text-sm text-muted">Set your location so we can show services and professionals in your area.</p>
          </div>
          <MapAddressPicker onPick={applyPick} autoLocate className="h-[56vh] min-h-[340px] shadow-[0_30px_70px_-44px_rgba(67,56,202,.6)] lg:h-[calc(100vh-14rem)]" />
        </div>

        {/* Details */}
        <form onSubmit={submit} noValidate className="space-y-5 rounded-3xl border border-line bg-panel p-5 shadow-[0_30px_70px_-44px_rgba(67,56,202,.6)] sm:p-6">
          <div>
            <h2 className="text-lg font-bold text-ink">Confirm address details</h2>
            <p className="text-xs text-muted">{pinned ? "We filled these in from the map. Add your house or flat number." : "Move the pin on the map, or fill these in yourself."}</p>
          </div>

          <div>
            <span className="mb-2 block text-xs font-semibold text-ink">Save as</span>
            <div className="flex flex-wrap gap-2">
              {LABELS.map(({ name, icon: Icon }) => {
                const active = name === "Other" ? !["Home", "Office"].includes(label) : label === name;
                return (
                  <button
                    key={name}
                    type="button"
                    aria-pressed={active}
                    onClick={() => setLabel(name === "Other" ? "" : name)}
                    className={clsx(
                      "inline-flex min-h-[44px] items-center gap-1.5 rounded-full border px-4 text-sm font-semibold transition-colors",
                      active ? "border-brand bg-brand-soft text-brand" : "border-line text-muted hover:border-brand/50",
                      FOCUS_RING,
                    )}
                  >
                    <Icon className="h-4 w-4" aria-hidden="true" />
                    {name}
                  </button>
                );
              })}
            </div>
            {!["Home", "Office"].includes(label) && (
              <input value={label} onChange={(e) => setLabel(e.target.value)} maxLength={30} placeholder="e.g. Parents' home" aria-label="Address name" className={clsx(field(), "mt-2")} />
            )}
          </div>

          <div>
            <label htmlFor="setup-line1" className="mb-1.5 block text-xs font-semibold text-ink">House / flat, street</label>
            <input
              id="setup-line1"
              value={line1}
              onChange={(e) => {
                setLine1(e.target.value);
                setLine1Edited(true);
              }}
              maxLength={200}
              autoComplete="address-line1"
              placeholder="Flat 302, Manjeera Trinity"
              className={field()}
            />
          </div>

          <div>
            <label htmlFor="setup-landmark" className="mb-1.5 block text-xs font-semibold text-ink">
              Landmark <span className="font-normal text-muted">(optional)</span>
            </label>
            <input id="setup-landmark" value={landmark} onChange={(e) => setLandmark(e.target.value)} maxLength={200} placeholder="Near the temple" className={field()} />
          </div>

          <div className="grid gap-4 sm:grid-cols-2">
            <div>
              <label htmlFor="setup-city" className="mb-1.5 block text-xs font-semibold text-ink">City</label>
              <input id="setup-city" value={city} onChange={(e) => setCity(e.target.value)} autoComplete="address-level2" className={field()} />
            </div>
            <div>
              <label htmlFor="setup-state" className="mb-1.5 block text-xs font-semibold text-ink">State</label>
              <input id="setup-state" value={stateName} onChange={(e) => setStateName(e.target.value)} autoComplete="address-level1" className={field()} />
            </div>
          </div>

          <div>
            <label htmlFor="setup-pin" className="mb-1.5 block text-xs font-semibold text-ink">Pincode</label>
            <input
              id="setup-pin"
              value={pincode}
              onChange={(e) => setPincode(e.target.value.replace(/\D/g, "").slice(0, 6))}
              inputMode="numeric"
              autoComplete="postal-code"
              aria-describedby="setup-pin-hint"
              className={field(notServiceable)}
            />
            <p id="setup-pin-hint" role="status" className="mt-1.5 flex min-h-[1.25rem] items-center gap-1.5 text-xs">
              {pincodeReady && serviceability.isFetching && (
                <span className="inline-flex items-center gap-1.5 text-muted">
                  <Loader2 className="h-3.5 w-3.5 animate-spin" aria-hidden="true" /> Checking your area…
                </span>
              )}
              {pincodeReady && serviceability.data?.serviceable && (
                <span className="inline-flex items-center gap-1.5 font-medium text-emerald-700">
                  <CheckCircle2 className="h-3.5 w-3.5" aria-hidden="true" /> We serve {serviceability.data.city ?? "your area"}.
                </span>
              )}
              {notServiceable && (
                <span className="inline-flex items-center gap-1.5 font-medium text-danger">
                  <TriangleAlert className="h-3.5 w-3.5" aria-hidden="true" /> We don't service this pincode yet.
                </span>
              )}
            </p>
          </div>

          {error && (
            <p role="alert" className="rounded-2xl border border-danger bg-danger-soft px-4 py-3 text-sm text-ink">
              {error}
            </p>
          )}

          <button
            type="submit"
            disabled={create.isPending || notServiceable}
            className={clsx(
              "group inline-flex min-h-[52px] w-full items-center justify-center gap-2 rounded-full bg-brand px-6 text-sm font-bold text-white shadow-[0_16px_30px_-14px_rgba(67,56,202,.9)] transition-colors hover:bg-[#3730A3] disabled:cursor-not-allowed disabled:opacity-50 motion-safe:active:scale-95",
              FOCUS_RING,
            )}
          >
            {create.isPending ? "Saving…" : "Confirm location & continue"}
            {!create.isPending && <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-0.5 motion-reduce:transition-none" aria-hidden="true" />}
          </button>

          <p className="flex items-center justify-center gap-1.5 text-xs text-muted">
            <ShieldCheck className="h-3.5 w-3.5 text-emerald-600" aria-hidden="true" />
            You can add or change addresses any time from your account.
          </p>
        </form>
      </main>
    </div>
  );
}
