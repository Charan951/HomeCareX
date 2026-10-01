// src/layouts/PartnerLayout.tsx
// Issue MU-D01 (TSX) - P01 Partner Layout, Navigation & Dashboard
// Deps: react-router-dom, lucide-react, tailwindcss
// Palette: orange #ff8a3d (accent / active / online), indigo #4338ca (shell / brand)
//
// Mobile: Instagram-style bottom nav (hides on scroll down, shows on scroll up).
// Header shows [Back] + page name; the menu (drawer) button sits at the left end.

import { useState, useRef, useEffect, createContext, useContext } from "react";
import { NavLink, Outlet, useLocation, useNavigate } from "react-router-dom";
import {
  Home, Briefcase, CalendarClock, Wrench, Wallet, Star, User,
  LifeBuoy, Settings, Bell, Menu, X, ChevronDown, LogOut, ArrowLeft,
} from "lucide-react";
import type { CSSProperties } from "react";
import { useAuth } from "@/hooks/useAuth";
import OnlineIndicator from "../components/partner/OnlineIndicator";
import PartnerErrorBoundary from "../components/partner/PartnerErrorBoundary";

// ---- Navigation config (single source of truth for the sidebar / drawer) ----
export const NAV = [
  { key: "home", label: "Home", to: "/partner", icon: Home, end: true },
  { key: "work", label: "Work", to: "/partner/work", icon: Briefcase },
  { key: "availability", label: "Availability", to: "/partner/availability", icon: CalendarClock },
  { key: "services", label: "Services", to: "/partner/services", icon: Wrench },
  { key: "earnings", label: "Earnings", to: "/partner/earnings", icon: Wallet },
  { key: "performance", label: "Performance", to: "/partner/performance", icon: Star },
  { key: "profile", label: "Profile", to: "/partner/profile", icon: User },
  { key: "support", label: "Support", to: "/partner/support", icon: LifeBuoy },
  { key: "system", label: "System", to: "/partner/system", icon: Settings },
];

// Exact page names for sub-pages (falls back to the NAV label)
const PAGE_TITLES: Record<string, string> = {
  "/partner/availability": "Availability",
  "/partner/working-hours": "Working Hours",
  "/partner/availability/hours": "Working Hours",
  "/partner/blackout-dates": "Blackout Dates",
  "/partner/availability/blackout-dates": "Blackout Dates",
  "/partner/schedule": "Schedule",
  "/partner/earnings": "Earnings",
};

// ---- Mobile bottom navigation (Instagram-style: hides on scroll down, shows on scroll up) ----
const BOTTOM_NAV = [
  { key: "home", label: "Home", to: "/partner", icon: Home, match: ["/partner"], exact: true },
  { key: "work", label: "Work", to: "/partner/work", icon: Briefcase, match: ["/partner/work"] },
  {
    key: "availability", label: "Availability", to: "/partner/availability", icon: CalendarClock,
    match: ["/partner/availability", "/partner/working-hours", "/partner/blackout-dates", "/partner/schedule"],
  },
  { key: "earnings", label: "Earnings", to: "/partner/earnings", icon: Wallet, match: ["/partner/earnings"] },
  { key: "profile", label: "Profile", to: "/partner/profile", icon: User, match: ["/partner/profile"] },
];

function BottomNav({ visible, path }: { visible: boolean; path: string }) {
  return (
    <nav
      aria-label="Primary"
      className={`fixed inset-x-0 bottom-0 z-40 border-t border-slate-200 bg-white transition-transform duration-300 lg:hidden ${
        visible ? "translate-y-0" : "translate-y-full"
      }`}
      style={{ paddingBottom: "env(safe-area-inset-bottom, 0px)" }}
    >
      <ul className="mx-auto flex h-14 max-w-md items-stretch justify-around">
        {BOTTOM_NAV.map(({ key, label, to, icon: Icon, match, exact }) => {
          const active = exact ? path === to : match.some((m) => path === m || path.startsWith(m + "/"));
          return (
            <li key={key} className="flex-1">
              <NavLink
                to={to}
                aria-label={label}
                aria-current={active ? "page" : undefined}
                className={`flex h-full flex-col items-center justify-center gap-0.5 text-[11px] font-medium focus-visible:outline focus-visible:outline-2 focus-visible:outline-[#4338ca] ${
                  active ? "text-[#4338ca]" : "text-slate-500"
                }`}
              >
                <Icon size={22} strokeWidth={active ? 2.4 : 1.8} aria-hidden />
                <span>{label}</span>
              </NavLink>
            </li>
          );
        })}
      </ul>
    </nav>
  );
}

// ---- Online status shared with dashboard pages via context ----
const PartnerStatusContext = createContext<{ online: boolean; setOnline: (v: boolean) => void }>({ online: false, setOnline: () => {} });
export const usePartnerStatus = () => useContext(PartnerStatusContext);

// ---- Avatar menu ----
function AvatarMenu() {
  const [open, setOpen] = useState(false);
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const initials = (user?.name ?? "P").trim().charAt(0).toUpperCase() || "P";
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const close = (e: MouseEvent) => ref.current && !ref.current.contains(e.target as Node) && setOpen(false);
    document.addEventListener("mousedown", close);
    return () => document.removeEventListener("mousedown", close);
  }, []);

  return (
    <div className="relative" ref={ref}>
      <button
        onClick={() => setOpen((o) => !o)}
        aria-haspopup="menu"
        aria-expanded={open}
        className="flex items-center gap-1.5 rounded-full p-1 sm:pr-2 hover:bg-slate-100 focus-visible:outline focus-visible:outline-2 focus-visible:outline-[#4338ca]"
      >
        <span className="grid h-8 w-8 place-items-center rounded-full bg-indigo-50 text-sm font-semibold text-[#4338ca]">
          {initials}
        </span>
        <ChevronDown size={14} className="hidden text-slate-400 sm:block" />
      </button>
      {open && (
        <div role="menu" className="absolute right-0 z-50 mt-2 w-48 rounded-lg border border-slate-200 bg-white py-1 shadow-lg">
          <NavLink role="menuitem" to="/partner/profile" onClick={() => setOpen(false)}
            className="flex items-center gap-2 px-3 py-2 text-sm text-slate-700 hover:bg-slate-50">
            <User size={16} /> My profile
          </NavLink>
          <NavLink role="menuitem" to="/partner/support" onClick={() => setOpen(false)}
            className="flex items-center gap-2 px-3 py-2 text-sm text-slate-700 hover:bg-slate-50">
            <LifeBuoy size={16} /> Help & support
          </NavLink>
          <button role="menuitem" onClick={async () => {
              setOpen(false);
              await logout();
              navigate("/login", { replace: true });
            }}
            className="flex w-full items-center gap-2 px-3 py-2 text-sm text-red-600 hover:bg-red-50">
            <LogOut size={16} /> Log out
          </button>
        </div>
      )}
    </div>
  );
}

// ---- Sidebar (desktop + drawer content) ----
function SidebarLinks({ onNavigate }: { onNavigate?: () => void }) {
  return (
    <nav aria-label="Partner navigation" className="flex-1 space-y-1 overflow-y-auto px-3 py-4">
      {NAV.map(({ key, label, to, icon: Icon, end }) => (
        <NavLink
          key={key}
          to={to}
          end={end}
          onClick={onNavigate}
          className={({ isActive }) =>
            `group flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition-colors focus-visible:outline focus-visible:outline-2 focus-visible:outline-white ${
              isActive
                ? "bg-[#ff8a3d] text-white shadow-sm"
                : "text-indigo-100 hover:bg-white/10 hover:text-white"
            }`
          }
        >
          <Icon size={18} aria-hidden />
          {label}
        </NavLink>
      ))}
    </nav>
  );
}

function Brand() {
  return (
    <div className="flex items-center gap-2 px-5 py-5">
      <span className="grid h-9 w-9 place-items-center rounded-lg bg-[#ff8a3d] font-bold text-white">H</span>
      <div className="leading-tight">
        <p className="font-semibold text-white">HomeCareX</p>
        <p className="text-xs text-indigo-200">Partner</p>
      </div>
    </div>
  );
}

// ---- Layout ----
export default function PartnerLayout() {
  const [online, setOnline] = useState(false); // TODO: persist via availability API
  const [drawer, setDrawer] = useState(false);
  const [navVisible, setNavVisible] = useState(true);
  const { pathname } = useLocation();
  const navigate = useNavigate();

  useEffect(() => setDrawer(false), [pathname]);

  // Hide the bottom nav when scrolling down, show it when scrolling up (like Instagram)
  useEffect(() => {
    setNavVisible(true);
    let last = window.scrollY;
    const onScroll = () => {
      const y = window.scrollY;
      const delta = y - last;
      if (Math.abs(delta) < 8) return; // ignore tiny movements
      if (y <= 24) setNavVisible(true);
      else setNavVisible(delta < 0);
      last = y;
    };
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, [pathname]);

  const cleanPath = pathname.replace(/\/+$/, "") || "/";
  const current = NAV.find((n) => (n.end ? pathname === n.to : pathname.startsWith(n.to)));
  const title = PAGE_TITLES[cleanPath] ?? current?.label ?? "Partner";
  const isHome = cleanPath === "/partner";
  // Availability / Working Hours / Blackout Dates / Schedule / Earnings on mobile: header shows only [Back] + page name
  const minimalHeader = [
    "/partner/availability",
    "/partner/working-hours",
    "/partner/availability/hours",
    "/partner/blackout-dates",
    "/partner/availability/blackout-dates",
    "/partner/schedule",
    "/partner/earnings",
  ].includes(cleanPath);

  // Go back in history; if the page was opened directly, go to Home instead
  const goBack = () => {
    if (window.history.length > 1) navigate(-1);
    else navigate("/partner", { replace: true });
  };

  return (
    <PartnerStatusContext.Provider value={{ online, setOnline }}>
      <div
        className="min-h-screen bg-slate-50 text-slate-900"
        style={{ "--bn-h": navVisible ? "calc(3.5rem + env(safe-area-inset-bottom, 0px))" : "env(safe-area-inset-bottom, 0px)" } as CSSProperties}
      >
        {/* Desktop sidebar */}
        <aside className="fixed inset-y-0 left-0 z-30 hidden w-64 flex-col bg-[#4338ca] lg:flex">
          <Brand />
          <SidebarLinks />
        </aside>

        {/* Mobile drawer (opened from the header menu button) */}
        {drawer && (
          <div className="fixed inset-0 z-50 lg:hidden" role="dialog" aria-modal="true" aria-label="Menu">
            <div className="absolute inset-0 bg-black/40" onClick={() => setDrawer(false)} />
            <aside className="absolute inset-y-0 left-0 flex w-72 max-w-[85%] flex-col bg-[#4338ca]">
              <div className="flex items-center justify-between pr-3">
                <Brand />
                <button onClick={() => setDrawer(false)} aria-label="Close menu"
                  className="rounded-md p-2 text-indigo-100 hover:bg-white/10">
                  <X size={20} />
                </button>
              </div>
              <SidebarLinks onNavigate={() => setDrawer(false)} />
            </aside>
          </div>
        )}

        <div className="lg:pl-64">
          {/* Header: [Menu] [Back] Page name ........ status, bell, avatar */}
          <header className="sticky top-0 z-20 flex h-14 items-center justify-between border-b border-slate-200 bg-white px-2 sm:h-16 sm:px-6">
            <div className="flex min-w-0 items-center gap-0.5 sm:gap-3">
              <button onClick={() => setDrawer(true)} aria-label="Open menu"
                className={`shrink-0 rounded-md p-2 text-slate-600 hover:bg-slate-100 focus-visible:outline focus-visible:outline-2 focus-visible:outline-[#4338ca] lg:hidden ${minimalHeader ? "hidden" : ""}`}>
                <Menu size={22} />
              </button>
              {!isHome && (
                <button onClick={goBack} aria-label="Go back"
                  className="shrink-0 rounded-md p-2 text-slate-600 hover:bg-slate-100 focus-visible:outline focus-visible:outline-2 focus-visible:outline-[#4338ca] lg:hidden">
                  <ArrowLeft size={20} />
                </button>
              )}
              <h1 className="truncate text-base font-semibold text-slate-800 sm:text-lg">{title}</h1>
            </div>
            <div className={`shrink-0 items-center gap-0.5 sm:gap-3 ${minimalHeader ? "hidden lg:flex" : "flex"}`}>
              <OnlineIndicator online={online} onChange={setOnline} />
              <button aria-label="Notifications"
                className="relative rounded-full p-2 text-slate-500 hover:bg-slate-100 focus-visible:outline focus-visible:outline-2 focus-visible:outline-[#4338ca]">
                <Bell size={20} />
              </button>
              <AvatarMenu />
            </div>
          </header>

          {/* Page content (no bottom nav on mobile any more, so less bottom padding) */}
          <main className="px-4 py-6 pb-24 sm:px-6 lg:pb-8">
            <PartnerErrorBoundary resetKey={pathname}>
              <Outlet />
            </PartnerErrorBoundary>
          </main>
        </div>

        <BottomNav visible={navVisible} path={cleanPath} />
      </div>
    </PartnerStatusContext.Provider>
  );
}