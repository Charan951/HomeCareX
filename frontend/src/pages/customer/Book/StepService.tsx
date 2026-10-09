import { useEffect, useMemo, useRef, useState, type CSSProperties } from "react";
import { ArrowRight, Clock3, Minus, Plus, ShieldCheck, Sparkles, Star } from "lucide-react";
import clsx from "clsx";

/** Backend rejects quantity > 20 (bookings.validation.ts). */
const MAX_QUANTITY = 20;
import { useBookingDraftStore } from "@/features/booking";
import { LoadingState, ErrorState } from "@/components/customer";
import { FOCUS_RING } from "@/components/customer/focusRing";
import { formatDuration } from "@/components/customer/catalog/format";
import { useService } from "@/hooks/useService";
import { Icon3D, serviceVisual } from "@/pages/customer/Shared/visuals";
import { formatINR } from "./formatMoney";
import type { ServiceAddOn } from "@/types/catalog";
import AddOnSelector from "./components/AddOnSelector";

export default function StepService({ serviceSlug }: { serviceSlug?: string }) {
  // Live catalog data (GET /services/:slug). The booking API validates the service id and the
  // add-on ids against the database, so ids and prices must come from here, never a local list.
  const { data: service, isLoading, error, refetch } = useService(serviceSlug);
  const [quantity, setQuantity] = useState(1);
  const [selectedIds, setSelectedIds] = useState<ReadonlySet<string>>(new Set());
  const [isSubmitting, setIsSubmitting] = useState(false);
  const restoredFor = useRef<string | null>(null);

  const setServiceDetails = useBookingDraftStore((s) => s.setServiceDetails);
  const draftServiceId = useBookingDraftStore((s) => s.serviceId);
  const draftQuantity = useBookingDraftStore((s) => s.quantity);
  const draftAddOns = useBookingDraftStore((s) => s.addOns);

  // Restore selections if the customer comes back to Step 1 with a draft already in progress.
  // Runs once per service (a background refetch must not undo edits made since), and drops any
  // add-on the service no longer offers, because the server would reject it (ADDON_NOT_FOUND).
  useEffect(() => {
    if (!service || service.id !== draftServiceId || restoredFor.current === service.id) return;
    restoredFor.current = service.id;
    setQuantity(draftQuantity || 1);
    const offered = new Set(service.addOns.map((a) => a.id));
    setSelectedIds(new Set(draftAddOns.map((a) => a.id).filter((id) => offered.has(id))));
    // eslint-disable-next-line react-hooks/exhaustive-deps -- restore once, when the matching service loads
  }, [service]);

  // Always derived from the current catalog data, so a refreshed price is never stale here.
  const selected = useMemo(() => (service ? service.addOns.filter((a) => selectedIds.has(a.id)) : []), [service, selectedIds]);

  const toggleAddOn = (addOn: ServiceAddOn) => {
    setSelectedIds((prev) => {
      const next = new Set(prev);
      if (next.has(addOn.id)) next.delete(addOn.id);
      else next.add(addOn.id);
      return next;
    });
  };

  const runningEstimate = useMemo(() => {
    if (!service) return 0;
    return service.basePrice * quantity + selected.reduce((sum, a) => sum + a.price, 0);
  }, [service, quantity, selected]);

  const handleNextStep = () => {
    if (!service || isSubmitting) return; // guards the double-click case
    setIsSubmitting(true);
    setServiceDetails(
      service.id,
      service.slug,
      service.basePrice,
      quantity,
      selected.map((a) => ({ id: a.id, quantity: 1, price: a.price, name: a.name })),
      service.name,
    );
  };

  if (isLoading) return <LoadingState label="Loading service details…" />;
  if (!service) {
    // 404 = unknown or inactive slug: retrying cannot help. Anything else may be a blip.
    const notFound = error?.status === 404;
    return (
      <ErrorState
        title={notFound ? "Service not found" : "Couldn't load this service"}
        message={notFound ? "This service may no longer be available." : "Please check your connection and try again."}
        onRetry={notFound ? undefined : () => void refetch()}
      />
    );
  }

const stagger = (i: number): CSSProperties => ({ "--i": i }) as CSSProperties;
const visual = serviceVisual(service.slug, service.category.slug);
const photo = service.media[0]?.url ?? visual.image;

const stepBtn = clsx(
  "flex h-11 w-11 items-center justify-center rounded-full text-ink transition-colors hover:bg-brand-soft hover:text-brand disabled:cursor-not-allowed disabled:text-muted/40 disabled:hover:bg-transparent",
  FOCUS_RING,
);

const priceDetails = (id: string) => (
  <section aria-labelledby={id} className="rounded-2xl border border-dashed border-brand/30 bg-brand-soft/40 p-4">
    <h3 id={id} className="text-sm font-semibold text-ink">
      Price details
    </h3>
    <dl className="mt-3 space-y-2 text-sm">
      <div className="flex items-baseline justify-between gap-4">
        <dt className="min-w-0 text-muted">
          {service.name} × {quantity}
        </dt>
        <dd className="shrink-0 font-semibold tabular-nums text-ink">{formatINR(service.basePrice * quantity)}</dd>
      </div>
      {selected.map((a) => (
        <div key={a.id} className="flex items-baseline justify-between gap-4">
          <dt className="min-w-0 text-muted">{a.name}</dt>
          <dd className="shrink-0 font-semibold tabular-nums text-ink">+{formatINR(a.price)}</dd>
        </div>
      ))}
    </dl>
  </section>
);

const nextButton = (
  <button
    type="button"
    onClick={handleNextStep}
    disabled={isSubmitting}
    aria-busy={isSubmitting}
    className={clsx(
      "group inline-flex min-h-[48px] items-center justify-center gap-2 rounded-full bg-brand px-7 text-sm font-bold text-white shadow-sm transition-colors hover:bg-[#3730A3] disabled:opacity-60 motion-safe:active:scale-95",
      FOCUS_RING,
    )}
  >
    {isSubmitting ? "Saving…" : "Next Step"}
    {!isSubmitting && <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-0.5 motion-reduce:transition-none" aria-hidden="true" />}
  </button>
);

return (
  <div className="grid gap-6 lg:grid-cols-[minmax(0,1fr)_340px] lg:items-start lg:gap-8">
   <div className="min-w-0 space-y-6">
    {/* Intro */}
    <div className="flex items-start gap-3.5">
      <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl bg-brand text-white shadow-[0_12px_24px_-12px_rgba(67,56,202,.8)]">
        <Sparkles className="h-5 w-5" aria-hidden="true" />
      </span>
      <div>
        <h3 className="text-xl font-bold tracking-tight text-ink sm:text-2xl">What do you need done?</h3>
        <p className="mt-0.5 text-sm text-muted">Set the quantity and pick any extras for this visit.</p>
      </div>
    </div>

    {/* Service summary */}
    <div className="sd-rise flex items-center gap-4 rounded-3xl border border-line bg-panel p-4 shadow-[0_24px_60px_-48px_rgba(67,56,202,.55)] sm:p-5" style={stagger(0)}>
      <div className={clsx("relative h-[84px] w-[84px] shrink-0 overflow-hidden rounded-2xl", visual.tint)}>
        {photo ? (
          <img
            src={photo}
            alt=""
            className="h-full w-full object-cover"
            style={{ objectPosition: visual.focus }}
            onError={(e) => {
              e.currentTarget.style.display = "none";
            }}
          />
        ) : (
          <Icon3D asset={visual.asset} className="h-full w-full p-3" />
        )}
      </div>
      <div className="min-w-0">
        <p className="inline-flex rounded-full bg-brand-soft px-2.5 py-0.5 text-[11px] font-semibold text-brand">{service.category.name}</p>
        <h3 className="mt-1 text-xl font-bold leading-tight tracking-tight text-ink">{service.name}</h3>
        <div className="mt-1.5 flex flex-wrap items-center gap-x-3 gap-y-1 text-sm text-muted">
          <span>Base price: {formatINR(service.basePrice)} per unit</span>
          <span className="inline-flex items-center gap-1">
            <Clock3 className="h-3.5 w-3.5" aria-hidden="true" />
            {formatDuration(service.durationMinutes)}
          </span>
          {service.ratingCount > 0 && (
            <span className="inline-flex items-center gap-1 font-medium text-ink">
              <Star className="h-3.5 w-3.5 fill-accent text-accent" aria-hidden="true" />
              {service.rating.toFixed(1)}
            </span>
          )}
        </div>
      </div>
    </div>

    {/* Quantity */}
    <section aria-labelledby="qty-heading" className="sd-rise rounded-3xl border border-line bg-panel p-4 shadow-[0_24px_60px_-48px_rgba(67,56,202,.55)] sm:p-5" style={stagger(1)}>
      <div className="flex items-center justify-between gap-4">
        <div>
          <h3 id="qty-heading" className="text-sm font-semibold text-ink">
            No of Persons
          </h3>
          <p className="mt-0.5 text-xs text-muted">Units to be serviced (up to {MAX_QUANTITY}).</p>
        </div>
        <div role="group" aria-label="Quantity" className="inline-flex items-center rounded-full border border-line bg-panel p-1 shadow-sm">
          <button type="button" onClick={() => setQuantity((q) => Math.max(1, q - 1))} disabled={quantity <= 1} aria-label="Decrease quantity" className={stepBtn}>
            <Minus className="h-4 w-4" strokeWidth={2.5} aria-hidden="true" />
          </button>
          <span key={quantity} className="bk-tick w-12 text-center text-lg font-bold tabular-nums text-ink" aria-live="polite">
            {quantity}
          </span>
          <button type="button" onClick={() => setQuantity((q) => Math.min(MAX_QUANTITY, q + 1))} disabled={quantity >= MAX_QUANTITY} aria-label="Increase quantity" className={stepBtn}>
            <Plus className="h-4 w-4" strokeWidth={2.5} aria-hidden="true" />
          </button>
        </div>
      </div>
    </section>

    {service.addOns.length > 0 && (
      <div className="sd-rise rounded-3xl border border-line bg-panel p-4 shadow-[0_24px_60px_-48px_rgba(67,56,202,.55)] sm:p-5" style={stagger(2)}>
        <AddOnSelector addOns={service.addOns} selectedIds={selectedIds} onToggle={toggleAddOn} />
      </div>
    )}

    {/* Mobile / tablet: price details inline, estimate bar floats above the bottom navigation */}
    <div className="sd-rise lg:hidden" style={stagger(3)}>{priceDetails("price-heading-inline")}</div>

    <div className="sticky bottom-[calc(4.75rem+env(safe-area-inset-bottom))] z-20 md:bottom-4 lg:hidden">
      <div className="flex items-center justify-between gap-4 rounded-3xl border border-line bg-white/90 py-2 pl-5 pr-2 shadow-[0_18px_40px_-14px_rgba(30,27,46,.45)] backdrop-blur-xl">
        <div className="min-w-0">
          <p className="text-[11px] font-medium leading-4 text-muted">Running Estimate</p>
          <p key={runningEstimate} className="bk-tick text-xl font-bold leading-6 tracking-tight tabular-nums text-ink">
            {formatINR(runningEstimate)}
          </p>
        </div>
        {nextButton}
      </div>
    </div>
   </div>

   {/* Desktop: sticky summary panel on the right */}
   <aside className="hidden lg:sticky lg:top-24 lg:block" aria-label="Booking summary">
    <div className="overflow-hidden rounded-3xl border border-line bg-panel shadow-[0_30px_70px_-44px_rgba(67,56,202,.6)]">
      <div className="bg-gradient-to-br from-brand to-[#6D5BE8] px-5 py-5 text-white">
        <p className="text-[11px] font-semibold uppercase tracking-wider text-white/70">Running estimate</p>
        <p key={runningEstimate} className="bk-tick mt-1 text-3xl font-bold tracking-tight tabular-nums">
          {formatINR(runningEstimate)}
        </p>
      </div>
      <div className="px-5 py-5">{priceDetails("price-heading-panel")}</div>
      <div className="flex px-5 pb-5 [&>button]:w-full">{nextButton}</div>
      <p className="flex items-center justify-center gap-1.5 border-t border-line bg-canvas px-5 py-3 text-xs text-muted">
        <ShieldCheck className="h-3.5 w-3.5 text-emerald-600" aria-hidden="true" />
        Final price is confirmed before you pay
      </p>
    </div>
   </aside>
  </div>
);
}
