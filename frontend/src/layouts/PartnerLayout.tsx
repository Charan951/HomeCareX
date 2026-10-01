// src/layouts/PartnerLayout.tsx
// Issue MU-D01 (TSX) - P01 Partner Layout, Navigation & Dashboard
// Deps: react-router-dom, lucide-react, tailwindcss
// Palette: orange #ff8a3d (accent / active / online), indigo #4338ca (shell / brand)
//
// Mobile: Instagram-style bottom nav (hides on scroll down, shows on scroll up).
// Header shows [Back] + page name; the menu (drawer) button sits at the left end.

import { useState, useEffect, createContext, useContext } from "react";
import { NavLink, Outlet, useLocation, useNavigate } from "react-router-dom";
import {
  Home, Briefcase, CalendarClock, Wrench, Wallet, Star, User,
  LifeBuoy, Settings, Bell, Menu, X, ChevronDown, LogOut, ArrowLeft, PanelLeftClose, PanelLeftOpen,
} from "lucide-react";
import type { CSSProperties } from "react";
import { useAuth } from "@/hooks/useAuth";
import { useMediaQuery } from "@/hooks/useMediaQuery";
import { HomeCarexMark } from "@/components/band/Homecarexmark";
import "@/styles/admin.css"; // shared sidebar look (admin-sidebar, nav-link, ...)
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

// ---- Sidebar groups (same accordion look as the admin sidebar) ----
const NAV_GROUPS: { groupName: string; keys: string[] }[] = [
  { groupName: "Overview", keys: ["home"] },
  { groupName: "Operations", keys: ["work", "availability", "services"] },
  { groupName: "Finance", keys: ["earnings", "performance"] },
  { groupName: "Account", keys: ["profile", "support", "system"] },
];

// ---- Sidebar: reuses the admin sidebar CSS so both portals look the same ----
function PartnerSidebar({
  collapsed, mobileOpen, onClose, currentLabel,
}: { collapsed: boolean; mobileOpen: boolean; onClose: () => void; currentLabel?: string }) {
  const { pathname } = useLocation();
  const navigate = useNavigate();
  const { user, logout } = useAuth();
  const displayName = user?.name ?? "Partner";

  const groupOf = (label?: string) =>
    NAV_GROUPS.find((g) => g.keys.some((k) => NAV.find((n) => n.key === k)?.label === label))?.groupName ?? "Overview";
  const [openGroup, setOpenGroup] = useState<string>(groupOf(currentLabel));

  useEffect(() => { setOpenGroup(groupOf(currentLabel)); }, [pathname]); // eslint-disable-line react-hooks/exhaustive-deps

  useEffect(() => {
    if (!mobileOpen) return;
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && onClose();
    document.addEventListener("keydown", onKey);
    return () => document.removeEventListener("keydown", onKey);
  }, [mobileOpen, onClose]);

  const cls = ["admin-sidebar", collapsed ? "is-collapsed" : "", mobileOpen ? "is-mobile-open" : ""]
    .filter(Boolean).join(" ");

  return (
    <>
      {mobileOpen && <div className="sidebar-overlay" style={{ zIndex: 35 }} onClick={onClose} aria-hidden />}
      <aside className={cls} aria-label="Partner navigation">
        <div className="sidebar-brand">
          <div className="sidebar-brand__top">
            <div className="sidebar-brand__logo">
              <span className="sidebar-brand__icon"><HomeCarexMark size={22} /></span>
              {!collapsed && <span className="sidebar-brand__name">HomeCareX</span>}
            </div>
            <button type="button" onClick={onClose} className="sidebar-close-btn" aria-label="Close menu">
              <X size={20} />
            </button>
          </div>
          {!collapsed && (
            <p className="sidebar-brand__guide">
              {currentLabel ? `Partner / ${currentLabel}` : "Partner Console"}
            </p>
          )}
        </div>

        <nav className="sidebar-nav">
          {NAV_GROUPS.map((group) => {
            const items = NAV.filter((n) => group.keys.includes(n.key));
            const isOpen = collapsed || openGroup === group.groupName;
            return (
              <div key={group.groupName} className="nav-group">
                {!collapsed && (
                  <button
                    type="button"
                    className="nav-group__title nav-group__toggle"
                    aria-expanded={isOpen}
                    onClick={() => setOpenGroup((cur) => (cur === group.groupName ? "" : group.groupName))}
                  >
                    <span>{group.groupName}</span>
                    <ChevronDown size={14} className={`nav-group__chevron${isOpen ? " is-open" : ""}`} />
                  </button>
                )}
                {isOpen && (
                  <ul className="nav-list">
                    {items.map(({ key, label, to, icon: Icon, end }) => (
                      <li key={key}>
                        <NavLink
                          to={to}
                          end={end}
                          onClick={onClose}
                          title={collapsed ? label : undefined}
                          className={({ isActive }) => `nav-link${isActive ? " is-active" : ""}`}
                        >
                          <Icon className="nav-link__icon" size={20} aria-hidden />
                          {!collapsed && <span className="nav-link__label">{label}</span>}
                          {collapsed && <span className="sr-only">{label}</span>}
                        </NavLink>
                      </li>
                    ))}
                  </ul>
                )}
              </div>
            );
          })}
        </nav>

        <div className="sidebar-footer">
          <button
            type="button"
            className="sidebar-footer__user sidebar-footer__user-btn"
            title={collapsed ? displayName : undefined}
            onClick={() => { onClose(); navigate("/partner/profile"); }}
          >
            <span className="avatar">{displayName.charAt(0).toUpperCase()}</span>
            {!collapsed && <span className="profile-name">{displayName}</span>}
          </button>
          <button
            type="button"
            className="sidebar-signout-btn"
            title="Sign out"
            onClick={async () => { await logout(); navigate("/login", { replace: true }); }}
          >
            <LogOut size={18} />
            {!collapsed && <span>Sign out</span>}
          </button>
        </div>
      </aside>
    </>
  );
}

// ---- Layout ----
export default function PartnerLayout() {
  const [online, setOnline] = useState(false); // TODO: persist via availability API
  const [drawer, setDrawer] = useState(false);
  const [navVisible, setNavVisible] = useState(true);
  const [collapsedPref, setCollapsedPref] = useState(false);
  const isDesktop = useMediaQuery("(min-width: 1024px)");
  const collapsed = collapsedPref && isDesktop;
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
        className="flex min-h-screen bg-slate-50 text-slate-900"
        style={{ "--bn-h": navVisible ? "calc(3.5rem + env(safe-area-inset-bottom, 0px))" : "env(safe-area-inset-bottom, 0px)" } as CSSProperties}
      >
        <PartnerSidebar
          collapsed={collapsed}
          mobileOpen={drawer}
          onClose={() => setDrawer(false)}
          currentLabel={current?.label}
        />

        <div className="min-w-0 flex-1">
          {/* Header */}
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
              <button onClick={() => setCollapsedPref((v) => !v)}
                aria-label={collapsed ? "Expand sidebar" : "Collapse sidebar"}
                className="hidden rounded-md p-2 text-slate-600 hover:bg-slate-100 lg:inline-flex">
                {collapsed ? <PanelLeftOpen size={20} /> : <PanelLeftClose size={20} />}
              </button>
                            <h1 className="truncate text-base font-semibold text-slate-800 sm:text-lg">{title}</h1>
            </div>
            <div className={`shrink-0 items-center gap-0.5 sm:gap-3 ${minimalHeader ? "hidden lg:flex" : "flex"}`}>
              <OnlineIndicator online={online} onChange={setOnline} />
              <button aria-label="Notifications"
                className="relative rounded-full p-2 text-slate-500 hover:bg-slate-100 focus-visible:outline focus-visible:outline-2 focus-visible:outline-[#4338ca]">
                <Bell size={20} />
              </button>
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