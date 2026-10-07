import { Plus } from "lucide-react";
import { formatPrice } from "@/pages/customer/Shared/visuals";
import type { ServiceAddOn } from "@/types/catalog";

/** Optional paid extras. Display only: they are chosen in the booking steps. */
export default function AddOnList({ addOns }: { addOns: ServiceAddOn[] }) {
  if (addOns.length === 0) return null;
  return (
    <section id="add-ons" aria-labelledby="addons-title" className="scroll-mt-40">
      <h2 id="addons-title" className="text-xl font-bold tracking-tight text-ink md:text-2xl">
        Optional add-ons
      </h2>
      <p className="mt-1 text-sm text-muted">Extras you can add while booking.</p>
      <ul className="mt-4 divide-y divide-line overflow-hidden rounded-3xl border border-line bg-panel">
        {addOns.map((a) => (
          <li key={a.id} className="group flex items-center gap-3 px-4 py-3.5 transition-colors hover:bg-brand-soft/50 md:px-5">
            <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-accent-soft text-accent transition-transform duration-300 group-hover:rotate-90 motion-reduce:transition-none" aria-hidden="true">
              <Plus className="h-4 w-4" strokeWidth={3} />
            </span>
            <span className="min-w-0 flex-1 text-sm font-medium text-ink">{a.name}</span>
            <span className="shrink-0 text-sm font-bold text-ink">
              <span className="sr-only">Adds </span>+{formatPrice(a.price)}
            </span>
          </li>
        ))}
      </ul>
    </section>
  );
}
