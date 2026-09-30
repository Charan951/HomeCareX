import { useEffect, useRef, useState, type RefObject } from "react";
import { Link, useNavigate } from "react-router-dom";
import { LogOut, X } from "lucide-react";
import clsx from "clsx";
import { useAuth } from "@/hooks/useAuth";
import { customerPath } from "@/routes/customerPath";
import { LOGIN_PATH } from "@/routes/authPaths";
import SidebarNav from "./SidebarNav";
import { FOCUS_RING } from "./focusRing";
import { NO_SCROLLBAR } from "./noScrollbar";

export const MOBILE_DRAWER_ID = "customer-mobile-drawer";

interface MobileDrawerProps {
  open: boolean;
  onClose: () => void;
  /** Element (the hamburger) that gets focus back when the drawer closes. */
  returnFocusRef: RefObject<HTMLElement>;
}

/**
 * Slide-in navigation for screens below md (opened by the hamburger in TopBar).
 *  - Same grouped links as the desktop sidebar (SidebarNav), with Log out pinned at the bottom.
 *  - Closes on: link click, overlay click, Escape, route change (layout), or growing to desktop width.
 *  - While open: page scroll is locked, focus moves inside and Tab is trapped in the panel.
 *  - While closed it is `invisible`, so it is skipped by Tab and screen readers.
 */
export default function MobileDrawer({ open, onClose, returnFocusRef }: MobileDrawerProps) {
  const panelRef = useRef<HTMLDivElement>(null);
  const closeButtonRef = useRef<HTMLButtonElement>(null);
  const { logout } = useAuth();
  const navigate = useNavigate();
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleLogout() {
    setBusy(true);
    setError(null);
    try {
      await logout();
      onClose();
      navigate(LOGIN_PATH, { replace: true });
    } catch {
      setError("Couldn't log out. Please try again.");
    } finally {
      setBusy(false);
    }
  }

  useEffect(() => {
    if (!open) return;

    const returnTarget = returnFocusRef.current;
    closeButtonRef.current?.focus();

    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";

    function onKeyDown(e: KeyboardEvent) {
      if (e.key === "Escape") {
        onClose();
        return;
      }
      if (e.key !== "Tab" || !panelRef.current) return;
      const focusable = panelRef.current.querySelectorAll<HTMLElement>("a[href], button:not([disabled])");
      if (focusable.length === 0) return;
      const first = focusable[0];
      const last = focusable[focusable.length - 1];
      if (e.shiftKey && document.activeElement === first) {
        e.preventDefault();
        last.focus();
      } else if (!e.shiftKey && document.activeElement === last) {
        e.preventDefault();
        first.focus();
      }
    }
    document.addEventListener("keydown", onKeyDown);

    // If the window grows to desktop width the sidebar takes over, so close the drawer.
    const mq = window.matchMedia("(min-width: 768px)");
    const onBreakpoint = (e: MediaQueryListEvent) => {
      if (e.matches) onClose();
    };
    mq.addEventListener("change", onBreakpoint);

    return () => {
      document.body.style.overflow = previousOverflow;
      document.removeEventListener("keydown", onKeyDown);
      mq.removeEventListener("change", onBreakpoint);
      returnTarget?.focus();
    };
  }, [open, onClose, returnFocusRef]);

  return (
    <div className="md:hidden">
      <div
        aria-hidden="true"
        onClick={onClose}
        className={clsx(
          "fixed inset-0 z-40 bg-black/40 transition-opacity duration-200",
          open ? "opacity-100" : "pointer-events-none opacity-0",
        )}
      />

      <div
        id={MOBILE_DRAWER_ID}
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
          <Link to={customerPath()} className={clsx("rounded text-lg font-semibold tracking-tight text-brand", FOCUS_RING)}>
            HomeCareX
          </Link>
          <button
            ref={closeButtonRef}
            type="button"
            onClick={onClose}
            aria-label="Close menu"
            className={clsx("flex h-11 w-11 items-center justify-center rounded text-ink hover:bg-canvas", FOCUS_RING)}
          >
            <X className="h-5 w-5" aria-hidden="true" />
          </button>
        </div>

        <div className={clsx("flex-1 overflow-y-auto pt-4", NO_SCROLLBAR)}>
          <SidebarNav idPrefix="drawer" onNavigate={onClose} />
        </div>

        <div className="shrink-0 border-t border-line px-2 pb-[env(safe-area-inset-bottom)] pt-2">
          <button
            type="button"
            onClick={handleLogout}
            disabled={busy}
            className={clsx(
              "flex min-h-[44px] w-full items-center gap-2 rounded px-3 text-left text-sm font-medium text-danger hover:bg-danger-soft disabled:opacity-60",
              FOCUS_RING,
            )}
          >
            <LogOut className="h-4 w-4" aria-hidden="true" />
            {busy ? "Logging out…" : "Log out"}
          </button>
          {error && (
            <p role="alert" className="px-3 pb-2 text-xs text-danger">
              {error}
            </p>
          )}
        </div>
      </div>
    </div>
  );
}
