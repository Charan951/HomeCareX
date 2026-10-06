import { useState } from "react";
import { Check, Copy } from "lucide-react";
import clsx from "clsx";
import { Icon3D } from "@/components/customer";
import type { Offer } from "@/mocks/customerMockData";

/** Offer banners: scroll on phones, two-up grid from md. The brand offer is solid indigo, the other soft orange. */
export default function OffersCarousel({ offers }: { offers: Offer[] }) {
  const [copiedId, setCopiedId] = useState<string | null>(null);

  async function copy(offer: Offer) {
    try {
      await navigator.clipboard.writeText(offer.code);
      setCopiedId(offer.id);
      setTimeout(() => setCopiedId((id) => (id === offer.id ? null : id)), 1800);
    } catch {
      /* clipboard unavailable — the code is still visible to copy by hand */
    }
  }

  return (
    <div className="relative -mx-4 flex snap-x snap-mandatory gap-3 overflow-x-auto px-4 pb-2 md:mx-0 md:grid md:grid-cols-2 md:gap-4 md:overflow-visible md:px-0 md:pb-0">
      {offers.map((o, index) => {
        const solid = o.accent === "brand";
        return (
          <div
            key={o.id}
            className={clsx(
              "dashboard-offer group relative flex min-h-[150px] w-[286px] shrink-0 snap-start flex-col justify-between overflow-hidden rounded-[20px] p-4 shadow-[0_10px_28px_rgba(30,27,46,.08)] md:w-auto md:min-h-[160px] md:p-5",
              solid ? "bg-brand text-white" : "border border-accent/20 bg-accent-soft text-ink",
            )}
          >
            <span aria-hidden="true" className="dashboard-offer__shine" />
            <Icon3D hints={[index % 2 === 0 ? "🎁" : "✨"]} size={84} delay={index * -1.4} className="absolute -bottom-2 right-3" />
            <div className="relative z-[1] max-w-[68%]">
              <div className="text-sm font-semibold md:text-base">{o.title}</div>
              <p className={clsx("mt-1 text-xs leading-relaxed", solid ? "text-white/80" : "text-muted")}>{o.description}</p>
            </div>
            <div className="relative z-[1] mt-3 flex items-center gap-2">
              <span className={clsx("rounded-lg border border-dashed px-2.5 py-1 text-xs font-bold tracking-wider", solid ? "border-white/50 bg-white/10" : "border-brand/30 bg-white/80")}>
                {o.code}
              </span>
              <button
                type="button"
                onClick={() => copy(o)}
                className={clsx(
                  "flex min-h-[32px] items-center gap-1 rounded-full px-3 text-xs font-semibold shadow-sm transition-transform duration-200 hover:scale-105 active:scale-95 focus-visible:outline focus-visible:outline-2 focus-visible:outline-accent",
                  solid ? "bg-accent text-ink" : "bg-white text-brand",
                )}
              >
                {copiedId === o.id ? <Check className="h-3.5 w-3.5" aria-hidden="true" /> : <Copy className="h-3.5 w-3.5" aria-hidden="true" />}
                {copiedId === o.id ? "Copied" : "Copy"}
              </button>
            </div>
          </div>
        );
      })}
    </div>
  );
}
