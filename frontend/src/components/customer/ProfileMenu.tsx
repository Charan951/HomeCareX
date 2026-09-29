import { useEffect, useRef, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { LogOut, User } from "lucide-react";
import clsx from "clsx";
import { useAuth } from "@/hooks/useAuth";
import { customerPath } from "@/routes/customerPath";
import { LOGIN_PATH } from "@/routes/authPaths";
import { FOCUS_RING } from "./focusRing";

/**
 * Avatar dropdown (disclosure pattern): profile link + logout.
 * Logout uses the shared auth contract — useAuth().logout() — and never touches tokens itself.
 * Closes on outside click and on Escape (focus returns to the avatar).
 */
export default function ProfileMenu() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const [open, setOpen] = useState(false);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const wrapperRef = useRef<HTMLDivElement>(null);
  const triggerRef = useRef<HTMLButtonElement>(null);

  useEffect(() => {
    if (!open) return;
    function onMouseDown(e: MouseEvent) {
      if (wrapperRef.current && !wrapperRef.current.contains(e.target as Node)) setOpen(false);
    }
    function onKeyDown(e: KeyboardEvent) {
      if (e.key === "Escape") {
        setOpen(false);
        triggerRef.current?.focus();
      }
    }
    document.addEventListener("mousedown", onMouseDown);
    document.addEventListener("keydown", onKeyDown);
    return () => {
      document.removeEventListener("mousedown", onMouseDown);
      document.removeEventListener("keydown", onKeyDown);
    };
  }, [open]);

  const name = user?.name ?? "Guest";
  const initials =
    name
      .split(" ")
      .map((w) => w[0])
      .slice(0, 2)
      .join("")
      .toUpperCase() || "?";

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

  return (
    <div className="relative" ref={wrapperRef}>
      <button
        ref={triggerRef}
        type="button"
        onClick={() => setOpen((v) => !v)}
        aria-expanded={open}
        aria-controls="customer-profile-menu"
        aria-label={`Account menu for ${name}`}
        className={clsx(
          "flex h-11 w-11 items-center justify-center rounded-full bg-brand text-sm font-medium text-white transition-opacity hover:opacity-90",
          FOCUS_RING,
        )}
      >
        {initials}
      </button>

      {open && (
        <div
          id="customer-profile-menu"
          className="absolute right-0 z-30 mt-2 w-56 rounded border border-line bg-panel py-1 shadow-lg"
        >
          <div className="border-b border-line px-4 py-2">
            <p className="truncate text-sm font-medium text-ink">{name}</p>
            {user?.email && <p className="truncate text-xs text-muted">{user.email}</p>}
          </div>
          <Link
            to={customerPath("/profile")}
            onClick={() => setOpen(false)}
            className={clsx("flex min-h-[44px] items-center gap-2 px-4 text-sm text-ink hover:bg-canvas", FOCUS_RING)}
          >
            <User className="h-4 w-4" aria-hidden="true" />
            View profile
          </Link>
          <button
            type="button"
            onClick={handleLogout}
            disabled={busy}
            className={clsx(
              "flex min-h-[44px] w-full items-center gap-2 px-4 text-left text-sm text-danger hover:bg-danger-soft disabled:opacity-60",
              FOCUS_RING,
            )}
          >
            <LogOut className="h-4 w-4" aria-hidden="true" />
            {busy ? "Logging out…" : "Log out"}
          </button>
          {error && (
            <p role="alert" className="px-4 pb-2 text-xs text-danger">
              {error}
            </p>
          )}
        </div>
      )}
    </div>
  );
}
