import clsx from "clsx";
import type { Offer } from "@/mocks/customerMockData";

/** Horizontally-scrolling offer/promo cards. */
export default function OffersCarousel({ offers }: { offers: Offer[] }) {
  return (
    <div className="-mx-4 flex gap-3 overflow-x-auto px-4 pb-1 sm:mx-0 sm:px-0">
      {offers.map((o) => (
        <div
          key={o.id}
          className={clsx(
            "w-72 shrink-0 rounded p-4",
            o.accent === "brand" ? "bg-brand-soft" : "bg-accent-soft",
          )}
        >
          <div className="text-sm font-semibold text-ink">{o.title}</div>
          <p className="mt-1 text-xs text-muted">{o.description}</p>
          <div className="mt-3 inline-block rounded bg-panel px-2 py-1 text-xs font-medium tracking-wide text-ink">
            CODE: {o.code}
          </div>
        </div>
      ))}
    </div>
  );
}
