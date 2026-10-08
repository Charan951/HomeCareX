import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import clsx from "clsx";
import { FOCUS_RING } from "@/components/customer/focusRing";
import { formatPrice } from "@/pages/customer/Shared/visuals";
import { bookingHref } from "../format";

interface StickyCTAProps {
  slug: string;
  name: string;
  price: number;
  /** Optional: hide the bar (it is always shown on phones by default). */
  show?: boolean;
}

/** Height reserved at the end of the page so the fixed bar never covers the last content. */
export function StickyCTASpacer() {
  return <div aria-hidden="true" className="h-[calc(5.5rem+env(safe-area-inset-bottom))] md:hidden" />;
}

/**
 * Phones only: the single, always-visible "Starting at / Book now" bar, docked to the bottom edge of the screen
 * (the customer bottom nav is hidden on this page). From md up the booking card (ServiceInfo) holds the button
 * instead, so the two are never on screen together.
 *
 * It is position: fixed (not sticky) on purpose: the app's global `body { overflow-x: hidden }` turns <body>
 * into a scroll container that never scrolls, which silently breaks position: sticky for everything inside it.
 * It respects the iPhone home-indicator inset and slides up when the page first appears.
 */
export default function StickyCTA({ slug, name, price, show = true }: StickyCTAProps) {
  const [entered, setEntered] = useState(false);
  useEffect(() => {
    const id = window.requestAnimationFrame(() => setEntered(true));
    return () => window.cancelAnimationFrame(id);
  }, []);
  const visible = show && entered;

  return (
    <div
      aria-hidden={!show}
      className={clsx(
        "fixed inset-x-0 bottom-0 z-30 border-t border-line/70 bg-white/95 px-4 pt-3 pb-[calc(0.75rem+env(safe-area-inset-bottom))] backdrop-blur-xl md:hidden",
        "shadow-[0_-10px_30px_-12px_rgba(30,27,46,.28)] transition-[transform,opacity] duration-500 ease-out motion-reduce:transition-none",
        visible ? "translate-y-0 opacity-100" : "translate-y-full opacity-0",
        !show && "invisible",
      )}
    >
      <div className="mx-auto flex max-w-xl items-center justify-between gap-4">
        <div className="min-w-0">
          <p className="text-[11px] font-medium leading-4 text-muted">Starting at</p>
          <p className="text-xl font-bold leading-6 tracking-tight text-ink">{formatPrice(price)}</p>
        </div>
        <Link
          to={bookingHref(slug)}
          aria-label={`Book ${name}`}
          className={clsx("inline-flex min-h-[48px] min-w-[150px] items-center justify-center rounded-full bg-brand px-8 text-sm font-bold text-white shadow-sm transition-all hover:bg-[#3730A3] motion-safe:active:scale-95", FOCUS_RING)}
        >
          Book now
        </Link>
      </div>
    </div>
  );
}
