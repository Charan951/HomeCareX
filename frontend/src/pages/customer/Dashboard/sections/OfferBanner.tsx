import { useState } from "react";
import { Check, Copy } from "lucide-react";
import clsx from "clsx";
import type { Offer } from "@/mocks/customerMockData";

/** One promo card with a copy-code button. */
export default function OfferBanner({ offer }: { offer: Offer }) {
  const [copied, setCopied] = useState(false);

  async function copy() {
    try {
      await navigator.clipboard.writeText(offer.code);
      setCopied(true);
      setTimeout(() => setCopied(false), 1800);
    } catch {
      /* clipboard unavailable (e.g. insecure context) — the code is still visible to copy by hand */
    }
  }

  return (
    <div
      className={clsx(
        "flex w-72 shrink-0 flex-col justify-between rounded-lg border p-4",
        offer.accent === "brand" ? "border-brand/10 bg-brand-soft" : "border-accent/20 bg-accent-soft",
      )}
    >
      <div>
        <div className="text-sm font-semibold text-ink">{offer.title}</div>
        <p className="mt-1 text-xs leading-relaxed text-muted">{offer.description}</p>
      </div>
      <div className="mt-4 flex items-center justify-between gap-2">
        <span className="rounded border border-dashed border-ink/30 bg-panel px-2.5 py-1 text-xs font-semibold tracking-wider text-ink">
          {offer.code}
        </span>
        <button
          type="button"
          onClick={copy}
          className="flex min-h-[32px] items-center gap-1 rounded px-2 text-xs font-medium text-brand hover:bg-panel/60 focus-visible:outline focus-visible:outline-2 focus-visible:outline-brand"
        >
          {copied ? <Check className="h-3.5 w-3.5" aria-hidden="true" /> : <Copy className="h-3.5 w-3.5" aria-hidden="true" />}
          {copied ? "Copied" : "Copy"}
        </button>
      </div>
    </div>
  );
}
