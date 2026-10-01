import { useEffect, useRef, type RefObject } from "react";
import { Link } from "react-router-dom";
import { X } from "lucide-react";
import clsx from "clsx";
import PartnerSidebarNav from "./PartnerSidebarNav";
import { partnerPath } from "./partnerNav";
import { FOCUS_RING } from "@/components/customer/focusRing";
import { NO_SCROLLBAR } from "@/components/customer/noScrollbar";

export const PARTNER_DRAWER_ID = "partner-mobile-drawer";

interface Props {
  open: boolean;
  onClose: () => void;
  returnFocusRef: RefObject<HTMLElement>;
}

/** Slide-in nav below md: Esc / overlay / link / resize closes; scroll locked and Tab trapped while open. */
export default function PartnerMobileDrawer({ open, onClose, returnFocusRef }: Props) {
  const panelRef = useRef<HTMLDivElement>(null);
  const closeRef = useRef<HTMLButtonElement>(null);

  useEffect(() => {
    if (!open) return;
    const returnTarget = returnFocusRef.current;
    closeRef.current?.focus();
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";

    function onKeyDown(e: KeyboardEvent) {
      if (e.key === "Escape") return onClose();
      if (e.key !== "Tab" || !panelRef.current) return;
      const f = panelRef.current.querySelectorAll<HTMLElement>("a[href], button:not([disabled])");
      if (!f.length) return;
      const first = f[0];
      const last = f[f.length - 1];
      if (e.shiftKey && document.activeElement === first) { e.preventDefault(); last.focus(); }
      else if (!e.shiftKey && document.activeElement === last) { e.preventDefault(); first.focus(); }
    }
    document.addEventListener("keydown", onKeyDown);
    const mq = window.matchMedia("(min-width: 768px)");
    const onBp = (e: MediaQueryListEvent) => e.matches && onClose();
    mq.addEventListener("change", onBp);

    return () => {
      document.body.style.overflow = prev;
      document.removeEventListener("keydown", onKeyDown);
      mq.removeEventListener("change", onBp);
      returnTarget?.focus();
    };
  }, [open, onClose, returnFocusRef]);

  return (
    <div className="md:hidden">
      <div
        aria-hidden="true"
        onClick={onClose}
        className={clsx("fixed inset-0 z-40 bg-black/40 transition-opacity duration-200", open ? "opacity-100" : "pointer-events-none opacity-0")}
      />
      <div
        id={PARTNER_DRAWER_ID}
        ref={panelRef}
        role="dialog"
        aria-modal="true"
        aria-label="Navigation menu"
        aria-hidden={!open}
        className={clsx(
          "fixed inset-y-0 left-0 z-50 flex w-72 max-w-[85vw] flex-col bg-panel shadow-xl transition-[transform,visibility] duration-200 ease-out",
          open ? "visible translate-x-0" : "invisible -translate-x-full",
        )}
      >
        <div className="flex h-14 shrink-0 items-center justify-between border-b border-line px-4">
          <Link to={partnerPath()} className={clsx("rounded text-lg font-semibold tracking-tight text-brand", FOCUS_RING)}>
            HomeCareX
          </Link>
          <button
            ref={closeRef}
            type="button"
            onClick={onClose}
            aria-label="Close menu"
            className={clsx("flex h-11 w-11 items-center justify-center rounded text-ink hover:bg-canvas", FOCUS_RING)}
          >
            <X className="h-5 w-5" aria-hidden="true" />
          </button>
        </div>
        <div className={clsx("flex-1 overflow-y-auto pb-[env(safe-area-inset-bottom)] pt-4", NO_SCROLLBAR)}>
          <PartnerSidebarNav idPrefix="pdrawer" onNavigate={onClose} />
        </div>
      </div>
    </div>
  );
}