import { useState } from "react";
import { Check, Copy, Sparkles } from "lucide-react";
import clsx from "clsx";
import type { Offer } from "@/mocks/customerMockData";

export default function OffersCarousel({ offers }: { offers: Offer[] }) {
  const [copiedId, setCopiedId] = useState<string | null>(null);

  async function copy(offer: Offer) {
    try {
      await navigator.clipboard.writeText(offer.code);
      setCopiedId(offer.id);
      setTimeout(() => setCopiedId((id) => (id === offer.id ? null : id)), 1800);
    } catch {
      /* clipboard unavailable */
    }
  }

  return (
    <div className="relative -mx-4 flex snap-x snap-mandatory gap-3 overflow-x-auto px-4 pb-2 sm:mx-0 sm:px-0">
      {offers.map((o, index) => (
        <div
          key={o.id}
          className={clsx(
            "dashboard-offer group relative flex min-h-[154px] w-[286px] shrink-0 snap-start flex-col justify-between overflow-hidden rounded-[20px] border p-4 shadow-[0_10px_28px_rgba(30,27,46,.07)] transition-all duration-300",
            o.accent === "brand" ? "border-brand/10 bg-gradient-to-br from-brand-soft via-white to-white" : "border-accent/20 bg-gradient-to-br from-accent-soft via-white to-white",
          )}
        >
          <span aria-hidden="true" className="dashboard-offer__shine" />
          <div className="relative z-[1]">
            <div className="mb-2 flex items-center gap-2">
              <span className="flex h-7 w-7 items-center justify-center rounded-full bg-white shadow-sm text-brand">
                <Sparkles className="h-3.5 w-3.5" aria-hidden="true" />
              </span>
              <span className="text-[9px] font-bold uppercase tracking-[0.16em] text-brand">Limited offer {index + 1}</span>
            </div>
            <div className="text-[13px] font-extrabold text-ink">{o.title}</div>
            <p className="mt-1 text-[10px] leading-relaxed text-muted">{o.description}</p>
          </div>
          <div className="relative z-[1] mt-3 flex items-center justify-between gap-2">
            <span className="rounded-lg border border-dashed border-brand/25 bg-white/80 px-2.5 py-1 text-[10px] font-extrabold tracking-wider text-ink shadow-sm">{o.code}</span>
            <button
              type="button"
              onClick={() => copy(o)}
              className="flex min-h-[32px] items-center gap-1 rounded-full bg-white px-3 text-[10px] font-bold text-brand shadow-sm transition-transform duration-200 active:scale-95 hover:bg-white focus-visible:outline focus-visible:outline-2 focus-visible:outline-brand"
            >
              {copiedId === o.id ? <Check className="h-3.5 w-3.5" aria-hidden="true" /> : <Copy className="h-3.5 w-3.5" aria-hidden="true" />}
              {copiedId === o.id ? "Copied" : "Copy"}
            </button>
          </div>
        </div>
      ))}
    </div>
  );
}
