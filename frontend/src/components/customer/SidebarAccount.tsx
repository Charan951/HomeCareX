import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { ChevronRight, LogOut } from "lucide-react";
import clsx from "clsx";
import { useAuth } from "@/hooks/useAuth";
import { customerPath } from "@/routes/customerPath";
import { LOGIN_PATH } from "@/routes/authPaths";
import { FOCUS_RING } from "./focusRing";

/** Bottom of the desktop sidebar: who's signed in (opens Profile) + Log out. Replaces the old avatar menu in the top bar. */
export default function SidebarAccount() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const name = user?.name ?? "Guest";
  const initials = name.split(" ").map((w) => w[0]).slice(0, 2).join("").toUpperCase() || "?";

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
    <div className="mt-auto border-t border-line p-3">
      <Link to={customerPath("/profile")} className={clsx("flex items-center gap-3 rounded-lg p-2 transition-colors hover:bg-canvas", FOCUS_RING)}>
        <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-brand text-sm font-medium text-white" aria-hidden="true">{initials}</span>
        <span className="min-w-0 flex-1">
          <span className="block truncate text-sm font-semibold text-ink">{name}</span>
          <span className="block truncate text-xs text-muted">{user?.email ?? "View profile"}</span>
        </span>
        <ChevronRight className="h-4 w-4 shrink-0 text-muted" aria-hidden="true" />
      </Link>
      <button
        type="button"
        onClick={handleLogout}
        disabled={busy}
        className={clsx("mt-1 flex min-h-[44px] w-full items-center gap-3 rounded-lg px-2 text-sm font-medium text-danger transition-colors hover:bg-danger-soft disabled:opacity-60", FOCUS_RING)}
      >
        <LogOut className="ml-2.5 h-4 w-4" aria-hidden="true" />
        {busy ? "Logging out…" : "Log out"}
      </button>
      {error && <p role="alert" className="px-2 pt-1 text-xs text-danger">{error}</p>}
    </div>
  );
}
