// src/layouts/PartnerLayout.tsx
// Issue MU-D01 (TSX) · P01 Partner Layout, Navigation & Dashboard
// Deps: react-router-dom, lucide-react, tailwindcss
// Palette: orange #ff8a3d (accent / active / online), indigo #4338ca (shell / brand)

import { useState, useRef, useEffect, createContext, useContext } from "react";
import { NavLink, Outlet, useLocation, useNavigate } from "react-router-dom";
import {
  Home, Briefcase, CalendarClock, Wrench, Wallet, Star, User,
  LifeBuoy, Settings, Bell, Menu, X, ChevronDown, LogOut,
} from "lucide-react";
import { useAuth } from "@/hooks/useAuth";
import OnlineIndicator from "../components/partner/OnlineIndicator";
import PartnerErrorBoundary from "../components/partner/PartnerErrorBoundary";

// ---- Navigation config (single source of truth for sidebar + bottom nav) ----
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

// Bottom nav shows 4 primary tabs + "More" sheet for the rest
const BOTTOM_KEYS = ["home", "work", "earnings", "profile"];

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
        className="flex items-center gap-1.5 rounded-full p-1 pr-2 hover:bg-slate-100 focus-visible:outline focus-visible:outline-2 focus-visible:outline-[#4338ca]"
      >
        <span className="grid h-8 w-8 place-items-center rounded-full bg-[#4338ca] text-sm font-semibold text-white">
          {initials}
        </span>
        <ChevronDown size={14} className="text-slate-500" />
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
  const { pathname } = useLocation();

  useEffect(() => setDrawer(false), [pathname]);

  const current = NAV.find((n) => (n.end ? pathname === n.to : pathname.startsWith(n.to)));
  const bottom = NAV.filter((n) => BOTTOM_KEYS.includes(n.key));
  const moreActive = current && !BOTTOM_KEYS.includes(current.key);

  return (
    <PartnerStatusContext.Provider value={{ online, setOnline }}>
      <div className="min-h-screen bg-slate-50 text-slate-900">
        {/* Desktop sidebar */}
        <aside className="fixed inset-y-0 left-0 z-30 hidden w-64 flex-col bg-[#4338ca] lg:flex">
          <Brand />
          <SidebarLinks />
        </aside>

        {/* Mobile drawer (opened from header menu or "More") */}
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
          {/* Header */}
          <header className="sticky top-0 z-20 flex h-16 items-center justify-between border-b border-slate-200 bg-white/95 px-4 backdrop-blur sm:px-6">
            <div className="flex items-center gap-3">
              <button onClick={() => setDrawer(true)} aria-label="Open menu"
                className="rounded-md p-2 text-slate-600 hover:bg-slate-100 lg:hidden">
                <Menu size={20} />
              </button>
              <h1 className="text-lg font-semibold text-[#4338ca]">{current?.label ?? "Partner"}</h1>
            </div>
            <div className="flex items-center gap-2 sm:gap-3">
              <OnlineIndicator online={online} onChange={setOnline} />
              <button aria-label="Notifications"
                className="relative rounded-full p-2 text-slate-600 hover:bg-slate-100 focus-visible:outline focus-visible:outline-2 focus-visible:outline-[#4338ca]">
                <Bell size={20} />
              </button>
              <AvatarMenu />
            </div>
          </header>

          {/* Page content */}
          <main className="px-4 py-6 pb-24 sm:px-6 lg:pb-8">
            <PartnerErrorBoundary resetKey={pathname}>
              <Outlet />
            </PartnerErrorBoundary>
          </main>
        </div>

        {/* Mobile bottom nav */}
        <nav aria-label="Primary" className="fixed inset-x-0 bottom-0 z-30 border-t border-slate-200 bg-white pb-[env(safe-area-inset-bottom)] lg:hidden">
          <ul className="grid grid-cols-5">
            {bottom.map(({ key, label, to, icon: Icon, end }) => (
              <li key={key}>
                <NavLink to={to} end={end}
                  className={({ isActive }) =>
                    `flex flex-col items-center gap-0.5 py-2 text-xs font-medium ${isActive ? "text-[#ff8a3d]" : "text-slate-500"}`
                  }>
                  <Icon size={20} aria-hidden />
                  {label}
                </NavLink>
              </li>
            ))}
            <li>
              <button onClick={() => setDrawer(true)}
                className={`flex w-full flex-col items-center gap-0.5 py-2 text-xs font-medium ${moreActive ? "text-[#ff8a3d]" : "text-slate-500"}`}>
                <Menu size={20} aria-hidden />
                More
              </button>
            </li>
          </ul>
        </nav>
      </div>
    </PartnerStatusContext.Provider>
  );
}
