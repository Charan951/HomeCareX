import { useEffect, useState } from "react";
import { Check, Share2 } from "lucide-react";
import clsx from "clsx";
import { FOCUS_RING } from "@/components/customer/focusRing";

/** Native share sheet where available, otherwise copies the link and confirms with a short note. */
export default function ShareButton({ title }: { title: string }) {
  const [note, setNote] = useState<string | null>(null);

  useEffect(() => {
    if (!note) return;
    const t = window.setTimeout(() => setNote(null), 2200);
    return () => window.clearTimeout(t);
  }, [note]);

  const share = async () => {
    const url = window.location.href;
    try {
      if (navigator.share) {
        await navigator.share({ title, url });
      } else {
        await navigator.clipboard.writeText(url);
        setNote("Link copied");
      }
    } catch {
      /* Share sheet dismissed, or clipboard blocked: nothing to report. */
    }
  };

  return (
    <div className="relative">
      <button
        type="button"
        onClick={() => void share()}
        aria-label={`Share ${title}`}
        className={clsx("flex h-10 w-10 items-center justify-center rounded-full border border-line text-ink transition-colors hover:border-brand hover:text-brand", FOCUS_RING)}
      >
        {note ? <Check className="h-[18px] w-[18px] text-[#16A34A]" aria-hidden="true" /> : <Share2 className="h-[18px] w-[18px]" aria-hidden="true" />}
      </button>
      <span role="status" className={clsx("absolute right-0 top-12 z-10 whitespace-nowrap rounded-lg bg-ink px-2.5 py-1 text-xs font-medium text-white shadow-lg transition-opacity", note ? "opacity-100" : "pointer-events-none opacity-0")}>
        {note ?? ""}
      </span>
    </div>
  );
}
