// src/layouts/PartnerLayout.tsx
// Issue MU-D01 (TSX) · P01 Partner Layout, Navigation & Dashboard
// Deps: react-router-dom, lucide-react, tailwindcss
// Palette: orange #ff8a3d (accent / active / online), indigo #4338ca (shell / brand)

import { useState, useEffect, createContext, useContext } from "react";
import { NavLink, Outlet, useLocation, useNavigate } from "react-router-dom";
import {
  Home, Briefcase, CalendarClock, Wrench, Wallet, Star, User,
  LifeBuoy, Settings, Bell, ArrowLeft, ChevronDown, LogOut, PanelLeftClose, PanelLeftOpen,
} from "lucide-react";
import { useAuth } from "@/hooks/useAuth";
import { useMediaQuery } from "@/hooks/useMediaQuery";
import { HomeCarexMark } from "@/components/band/Homecarexmark";
import "@/styles/admin.css"; // shared sidebar look (admin-sidebar, nav-link, ...)
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

// Bottom nav shows 4 primary tabs. Every other page is reached from the Profile tab (see ProfileMenu).
export const BOTTOM_KEYS = ["home", "work", "earnings", "profile"];

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
// Desktop only (>=1024px). On mobile the bottom bar + Profile page replace the old drawer.
function PartnerSidebar({
  collapsed, currentLabel,
}: { collapsed: boolean; currentLabel?: string }) {
  const { pathname } = useLocation();
  const navigate = useNavigate();
  const { user, logout } = useAuth();
  const displayName = user?.name ?? "Partner";

  const groupOf = (label?: string) =>
    NAV_GROUPS.find((g) => g.keys.some((k) => NAV.find((n) => n.key === k)?.label === label))?.groupName ?? "Overview";
  const [openGroup, setOpenGroup] = useState<string>(groupOf(currentLabel));

  useEffect(() => { setOpenGroup(groupOf(currentLabel)); }, [pathname]); // eslint-disable-line react-hooks/exhaustive-deps

  const cls = ["admin-sidebar", collapsed ? "is-collapsed" : ""].filter(Boolean).join(" ");

  return (
    <>
      <aside className={cls} aria-label="Partner navigation">
        <div className="sidebar-brand">
          <div className="sidebar-brand__top">
            <div className="sidebar-brand__logo">
              <span className="sidebar-brand__icon"><HomeCarexMark size={22} /></span>
              {!collapsed && <span className="sidebar-brand__name">HomeCareX</span>}
            </div>
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
            onClick={() => navigate("/partner/profile")}
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
  const [collapsedPref, setCollapsedPref] = useState(false);
  const isDesktop = useMediaQuery("(min-width: 1024px)");
  const collapsed = collapsedPref && isDesktop;
  const { pathname } = useLocation();
  const navigate = useNavigate();

  const current = NAV.find((n) => (n.end ? pathname === n.to : pathname.startsWith(n.to)));
  const bottom = NAV.filter((n) => BOTTOM_KEYS.includes(n.key));

  // Mobile back button: shown on every page except Home.
  const showBack = pathname !== "/partner";
  const isTabRoot = bottom.some((n) => n.to === pathname); // /partner/work, /earnings, /profile
  const goBack = () => {
    if (isTabRoot) return navigate("/partner"); // tab root -> Home
    const hasHistory = (window.history.state as { idx?: number } | null)?.idx;
    if (hasHistory) return navigate(-1); // came from a page inside the app
    // opened directly (refresh / bookmark): go to the logical parent
    navigate(current && !BOTTOM_KEYS.includes(current.key) ? "/partner/profile" : "/partner");
  };

  return (
    <PartnerStatusContext.Provider value={{ online, setOnline }}>
      <div className="flex min-h-screen bg-slate-50 text-slate-900">
        <PartnerSidebar collapsed={collapsed} currentLabel={current?.label} />

        <div className="min-w-0 flex-1">
          {/* Header */}
          <header className="sticky top-0 z-20 flex h-16 items-center justify-between border-b border-slate-200 bg-white/95 px-4 backdrop-blur sm:px-6">
            <div className="flex items-center gap-3">
              {showBack && (
                <button onClick={goBack} aria-label="Go back"
                  className="rounded-md p-2 text-slate-600 hover:bg-slate-100 focus-visible:outline focus-visible:outline-2 focus-visible:outline-[#4338ca] lg:hidden">
                  <ArrowLeft size={20} />
                </button>
              )}
              <button onClick={() => setCollapsedPref((v) => !v)}
                aria-label={collapsed ? "Expand sidebar" : "Collapse sidebar"}
                className="hidden rounded-md p-2 text-slate-600 hover:bg-slate-100 lg:inline-flex">
                {collapsed ? <PanelLeftOpen size={20} /> : <PanelLeftClose size={20} />}
              </button>
              <h1 className="text-lg font-semibold text-[#4338ca]">{current?.label ?? "Partner"}</h1>
            </div>
            <div className="flex items-center gap-2 sm:gap-3">
              <OnlineIndicator online={online} onChange={setOnline} />
              <button aria-label="Notifications"
                className="relative rounded-full p-2 text-slate-600 hover:bg-slate-100 focus-visible:outline focus-visible:outline-2 focus-visible:outline-[#4338ca]">
                <Bell size={20} />
              </button>
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
          <ul className="grid grid-cols-4">
            {bottom.map(({ key, label, to, icon: Icon, end }) => (
              <li key={key}>
                <NavLink to={to} end={end}
                  className={({ isActive }) =>
                    `flex flex-col items-center gap-0.5 py-2 text-xs font-medium focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-[-2px] focus-visible:outline-[#4338ca] ${isActive ? "text-[#ff8a3d]" : "text-slate-500"}`
                  }>
                  <Icon size={20} aria-hidden />
                  {label}
                </NavLink>
              </li>
            ))}
          </ul>
        </nav>
      </div>
    </PartnerStatusContext.Provider>
  );
}