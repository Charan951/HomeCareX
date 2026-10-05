import { useEffect, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import { LogOut } from "lucide-react";
import clsx from "clsx";
import { useAuth } from "@/hooks/useAuth";
import { LOGIN_PATH } from "@/routes/authPaths";
import { FOCUS_RING } from "@/components/customer/focusRing";

const BOTTOM_CLEARANCE = 112; // px kept free above the screen's bottom edge for the floating nav

/** Log out with a confirm step, so a stray tap at the bottom of the page can't end the session. */
export default function LogoutCard() {
  const { logout } = useAuth();
  const navigate = useNavigate();
  const [confirming, setConfirming] = useState(false);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const confirmRef = useRef<HTMLButtonElement>(null);
  const dialogRef = useRef<HTMLDivElement>(null);
  const triggerRef = useRef<HTMLButtonElement>(null);

  // Move focus to the safe choice when the confirm step appears, and scroll just enough that the
  // card is not left behind the floating bottom nav (BOTTOM_CLEARANCE ≈ nav height + gap).
  useEffect(() => {
    if (!confirming) return;
    confirmRef.current?.focus({ preventScroll: true });
    const card = dialogRef.current;
    if (!card) return;
    const overlap = card.getBoundingClientRect().bottom + BOTTOM_CLEARANCE - window.innerHeight;
    if (overlap > 0) {
      const reduce = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
      window.scrollBy({ top: overlap, behavior: reduce ? "auto" : "smooth" });
    }
  }, [confirming]);

  async function handleLogout() {
    setBusy(true);
    setError(null);
    try {
      await logout();
      navigate(LOGIN_PATH, { replace: true });
    } catch {
      setError("Couldn't log out. Please try again.");
      setBusy(false);
    }
  }

  function cancel() {
    setConfirming(false);
    setError(null);
    requestAnimationFrame(() => triggerRef.current?.focus());
  }

  return (
    <section className="profile-rise md:hidden" style={{ ["--d" as string]: "360ms" }} aria-label="Sign out">
      <div className="overflow-hidden rounded-[22px] border border-line/70 bg-panel shadow-[0_10px_28px_-12px_rgba(30,27,46,.14)]">
        {!confirming ? (
          <button
            ref={triggerRef}
            type="button"
            onClick={() => setConfirming(true)}
            className={clsx("group flex min-h-[64px] w-full items-center gap-3.5 px-4 py-3 text-left transition-colors active:bg-danger-soft", FOCUS_RING)}
          >
            <span aria-hidden="true" className="flex h-11 w-11 shrink-0 items-center justify-center rounded-[14px] bg-danger-soft text-danger transition-transform duration-200 motion-safe:group-active:scale-90">
              <LogOut className="h-5 w-5" />
            </span>
            <span className="text-[15px] font-semibold text-danger">Log out</span>
          </button>
        ) : (
          <div ref={dialogRef} role="alertdialog" aria-labelledby="logout-title" aria-describedby="logout-desc" className="profile-pop-in p-4">
            <p id="logout-title" className="text-[15px] font-semibold text-ink">
              Log out of HomeCareX?
            </p>
            <p id="logout-desc" className="mt-0.5 text-xs text-muted">
              You&apos;ll need to sign in again to book or track a service.
            </p>
            <div className="mt-4 grid grid-cols-2 gap-3">
              <button
                ref={confirmRef}
                type="button"
                onClick={cancel}
                disabled={busy}
                className={clsx("min-h-[46px] rounded-xl border border-line bg-canvas text-sm font-semibold text-ink transition-transform motion-safe:active:scale-95 disabled:opacity-60", FOCUS_RING)}
              >
                Stay signed in
              </button>
              <button
                type="button"
                onClick={handleLogout}
                disabled={busy}
                className={clsx("min-h-[46px] rounded-xl bg-danger text-sm font-semibold text-white shadow-sm transition-transform motion-safe:active:scale-95 disabled:opacity-60", FOCUS_RING)}
              >
                {busy ? "Logging out…" : "Yes, log out"}
              </button>
            </div>
            {error && (
              <p role="alert" className="mt-3 text-xs text-danger">
                {error}
              </p>
            )}
          </div>
        )}
      </div>
    </section>
  );
}
