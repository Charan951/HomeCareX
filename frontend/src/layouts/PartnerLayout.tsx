import { useState, useEffect, createContext, useContext } from "react";
import {
  NavLink,
  Outlet,
  useLocation,
  useNavigate,
} from "react-router-dom";
import {
  Home,
  Briefcase,
  CalendarClock,
  Wrench,
  Wallet,
  Star,
  User,
  LifeBuoy,
  Settings,
  Bell,
  ArrowLeft,
  ChevronDown,
  LogOut,
  PanelLeftClose,
  PanelLeftOpen,
} from "lucide-react";

import { useAuth } from "@/hooks/useAuth";
import { useMediaQuery } from "@/hooks/useMediaQuery";
import { HomeCarexMark } from "@/components/band/Homecarexmark";
import "@/styles/admin.css";
import OnlineIndicator from "../components/partner/OnlineIndicator";
import PartnerErrorBoundary from "../components/partner/PartnerErrorBoundary";

import "@/styles/admin.css";

// -----------------------------------------------------------------------------
// Navigation
// -----------------------------------------------------------------------------

export const NAV = [
  {
    key: "home",
    label: "Home",
    to: "/partner",
    icon: Home,
    end: true,
  },

  // My Jobs added here
  {
    key: "jobs",
    label: "My Jobs",
    to: "/partner/jobs",
    icon: Briefcase,
  },

  {
    key: "work",
    label: "Work",
    to: "/partner/work",
    icon: Briefcase,
  },

  {
    key: "availability",
    label: "Availability",
    to: "/partner/availability",
    icon: CalendarClock,
  },

  {
    key: "services",
    label: "Services",
    to: "/partner/services",
    icon: Wrench,
  },

  {
    key: "earnings",
    label: "Earnings",
    to: "/partner/earnings",
    icon: Wallet,
  },

  {
    key: "performance",
    label: "Performance",
    to: "/partner/performance",
    icon: Star,
  },

  {
    key: "profile",
    label: "Profile",
    to: "/partner/profile",
    icon: User,
  },

  {
    key: "support",
    label: "Support",
    to: "/partner/support",
    icon: LifeBuoy,
  },

  {
    key: "system",
    label: "System",
    to: "/partner/system",
    icon: Settings,
  },
];

// -----------------------------------------------------------------------------
// Page titles
// -----------------------------------------------------------------------------

const PAGE_TITLES: Record<string, string> = {
  "/partner/availability": "Availability",
  "/partner/working-hours": "Working Hours",
  "/partner/availability/hours": "Working Hours",
  "/partner/blackout-dates": "Blackout Dates",
  "/partner/availability/blackout-dates": "Blackout Dates",
  "/partner/schedule": "Schedule",
  "/partner/earnings": "Earnings",
  "/partner/jobs": "Job Requests",
};

// Titles that only change the heading
// They also hide the Online/Offline pill
const EXTRA_TITLES: Record<string, string> = {
  "/partner/incentives": "Partner Incentives",
  "/partner/earnings/incentives": "Partner Incentives",
  "/partner/payouts": "Partner Payouts",
  "/partner/earnings/payouts": "Partner Payouts",
  "/partner/transactions": "Partner Transactions",
  "/partner/wallet": "Partner Wallet",
};

// Pages that hide the mobile bottom bar
const HIDE_BOTTOM_NAV = [
  "/partner/wallet",
  "/partner/transactions",
];

// Bottom tabs.
// My Jobs remains accessible through the sidebar and Work tab remains unchanged.
const BOTTOM_NAV = [
  {
    key: "home",
    label: "Home",
    to: "/partner",
    icon: Home,
    match: ["/partner"],
    exact: true,
  },

  {
    key: "work",
    label: "Work",
    to: "/partner/work",
    icon: Briefcase,
    match: ["/partner/work"],
  },

  {
    key: "availability",
    label: "Availability",
    to: "/partner/availability",
    icon: CalendarClock,
    match: [
      "/partner/availability",
      "/partner/working-hours",
      "/partner/blackout-dates",
      "/partner/schedule",
    ],
  },

  {
    key: "earnings",
    label: "Earnings",
    to: "/partner/earnings",
    icon: Wallet,
    match: ["/partner/earnings"],
  },

  {
    key: "profile",
    label: "Profile",
    to: "/partner/profile",
    icon: User,
    match: ["/partner/profile"],
  },
];

function BottomNav({
  visible,
  path,
}: {
  visible: boolean;
  path: string;
}) {
  return (
    <nav
      aria-label="Primary"
      className={`fixed inset-x-0 bottom-0 z-40 border-t border-slate-200 bg-white transition-transform duration-300 lg:hidden ${
        visible ? "translate-y-0" : "translate-y-full"
      }`}
      style={{
        paddingBottom: "env(safe-area-inset-bottom, 0px)",
      }}
    >
      <ul className="mx-auto flex h-14 max-w-md items-stretch justify-around">
        {BOTTOM_NAV.map(
          ({
            key,
            label,
            to,
            icon: Icon,
            match,
            exact,
          }) => {
            const active = exact
              ? path === to
              : match.some(
                  (m) =>
                    path === m ||
                    path.startsWith(m + "/")
                );

            return (
              <li
                key={key}
                className="flex-1"
              >
                <NavLink
                  to={to}
                  aria-label={label}
                  aria-current={
                    active ? "page" : undefined
                  }
                  className={`flex h-full flex-col items-center justify-center gap-0.5 text-[11px] font-medium focus-visible:outline focus-visible:outline-2 focus-visible:outline-[#4338ca] ${
                    active
                      ? "text-[#4338ca]"
                      : "text-slate-500"
                  }`}
                >
                  <Icon
                    size={22}
                    strokeWidth={
                      active ? 2.4 : 1.8
                    }
                    aria-hidden
                  />
                  <span>{label}</span>
                </NavLink>
              </li>
            );
          }
        )}
      </ul>
    </nav>
  );
}

export const BOTTOM_KEYS = BOTTOM_NAV.map(
  (n) => n.key
);

// ---- Online status shared with dashboard pages via context ----
const PartnerStatusContext = createContext<{
  online: boolean;
  setOnline: (v: boolean) => void;
}>({
  online: false,
  setOnline: () => {},
});

export const usePartnerStatus = () =>
  useContext(PartnerStatusContext);

// ---- Sidebar groups ----
const NAV_GROUPS: {
  groupName: string;
  keys: string[];
}[] = [
  {
    groupName: "Overview",
    keys: ["home"],
  },

  {
    groupName: "Operations",

    // My Jobs added to Operations
    keys: [
      "jobs",
      "work",
      "availability",
      "services",
    ],
  },

  {
    groupName: "Finance",
    keys: ["earnings", "performance"],
  },

  {
    groupName: "Account",
    keys: ["profile", "support", "system"],
  },
];

// ---- Sidebar ----
function PartnerSidebar({
  collapsed,
  currentLabel,
}: {
  collapsed: boolean;
  currentLabel?: string;
}) {
  const { pathname } = useLocation();
  const navigate = useNavigate();
  const { user, logout } = useAuth();

  const displayName = user?.name ?? "Partner";

  const groupOf = (label?: string) =>
    NAV_GROUPS.find((g) =>
      g.keys.some(
        (k) =>
          NAV.find((n) => n.key === k)
            ?.label === label
      )
    )?.groupName ?? "Overview";

  const [openGroup, setOpenGroup] =
    useState<string>(
      groupOf(currentLabel)
    );

  useEffect(() => {
    setOpenGroup(groupOf(currentLabel));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [pathname]);

  const cls = [
    "admin-sidebar",
    collapsed ? "is-collapsed" : "",
  ]
    .filter(Boolean)
    .join(" ");

  return (
    <>
      <aside
        className={cls}
        aria-label="Partner navigation"
      >
        <div className="sidebar-brand">
          <div className="sidebar-brand__top">
            <div className="sidebar-brand__logo">
              <span className="sidebar-brand__icon">
                <HomeCarexMark size={22} />
              </span>

              {!collapsed && (
                <span className="sidebar-brand__name">
                  HomeCareX
                </span>
              )}
            </div>
          </div>

          {!collapsed && (
            <p className="sidebar-brand__guide">
              {currentLabel
                ? `Partner / ${currentLabel}`
                : "Partner Console"}
            </p>
          )}
        </div>

        <nav className="sidebar-nav">
          {NAV_GROUPS.map((group) => {
            const items = NAV.filter((n) =>
              group.keys.includes(n.key)
            );

            const isOpen =
              collapsed ||
              openGroup === group.groupName;

            return (
              <div
                key={group.groupName}
                className="nav-group"
              >
                {!collapsed && (
                  <button
                    type="button"
                    className="nav-group__title nav-group__toggle"
                    aria-expanded={isOpen}
                    onClick={() =>
                      setOpenGroup((cur) =>
                        cur === group.groupName
                          ? ""
                          : group.groupName
                      )
                    }
                  >
                    <span>
                      {group.groupName}
                    </span>

                    <ChevronDown
                      size={14}
                      className={`nav-group__chevron${
                        isOpen
                          ? " is-open"
                          : ""
                      }`}
                    />
                  </button>
                )}

                {isOpen && (
                  <ul className="nav-list">
                    {items.map(
                      ({
                        key,
                        label,
                        to,
                        icon: Icon,
                        end,
                      }) => (
                        <li key={key}>
                          <NavLink
                            to={to}
                            end={end}
                            title={
                              collapsed
                                ? label
                                : undefined
                            }
                            className={({
                              isActive,
                            }) =>
                              `nav-link${
                                isActive
                                  ? " is-active"
                                  : ""
                              }`
                            }
                          >
                            <Icon
                              className="nav-link__icon"
                              size={20}
                              aria-hidden
                            />

                            {!collapsed && (
                              <span className="nav-link__label">
                                {label}
                              </span>
                            )}

                            {collapsed && (
                              <span className="sr-only">
                                {label}
                              </span>
                            )}
                          </NavLink>
                        </li>
                      )
                    )}
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
            title={
              collapsed
                ? displayName
                : undefined
            }
            onClick={() =>
              navigate("/partner/profile")
            }
          >
            <span className="avatar">
              {displayName
                .charAt(0)
                .toUpperCase()}
            </span>

            {!collapsed && (
              <span className="profile-name">
                {displayName}
              </span>
            )}
          </button>

          <button
            type="button"
            className="sidebar-signout-btn"
            title="Sign out"
            onClick={async () => {
              await logout();
              navigate("/login", {
                replace: true,
              });
            }}
          >
            <LogOut size={18} />

            {!collapsed && (
              <span>Sign out</span>
            )}
          </button>
        </div>
      </aside>
    </>
  );
}

// -----------------------------------------------------------------------------
// Partner Layout
// -----------------------------------------------------------------------------

export default function PartnerLayout() {
  const [online, setOnline] =
    useState(false);

  const [collapsedPref, setCollapsedPref] =
    useState(false);

  const [navVisible, setNavVisible] =
    useState(true);

  const isDesktop = useMediaQuery(
    "(min-width: 1024px)"
  );

  const collapsed =
    collapsedPref && isDesktop;

  const { pathname } = useLocation();
  const navigate = useNavigate();

  // Hide bottom nav when scrolling down,
  // show it when scrolling up
  useEffect(() => {
    setNavVisible(true);

    let last = window.scrollY;

    const onScroll = () => {
      const y = window.scrollY;
      const delta = y - last;

      if (Math.abs(delta) < 8) {
        return;
      }

      if (y <= 24) {
        setNavVisible(true);
      } else {
        setNavVisible(delta < 0);
      }

      last = y;
    };

    window.addEventListener(
      "scroll",
      onScroll,
      { passive: true }
    );

    return () =>
      window.removeEventListener(
        "scroll",
        onScroll
      );
  }, [pathname]);

  const cleanPath =
    pathname.replace(/\/+$/, "") || "/";

  const current = NAV.find((n) =>
    n.end
      ? pathname === n.to
      : pathname.startsWith(n.to)
  );

  const title =
    PAGE_TITLES[cleanPath] ??
    EXTRA_TITLES[cleanPath] ??
    current?.label ??
    "Partner";

  const minimalHeader =
    Object.keys(PAGE_TITLES).includes(
      cleanPath
    );

  const hideStatusPill =
    Object.keys(EXTRA_TITLES).includes(
      cleanPath
    );

  const hideBottomNav =
    HIDE_BOTTOM_NAV.includes(cleanPath);

  // Mobile back button
  const showBack =
    cleanPath !== "/partner";

  const isTabRoot =
    BOTTOM_NAV.some(
      (n) => n.to === cleanPath
    );

  const goBack = () => {
    if (isTabRoot) {
      return navigate("/partner");
    }

    const hasHistory = (
      window.history.state as {
        idx?: number;
      } | null
    )?.idx;

    if (hasHistory) {
      return navigate(-1);
    }

    navigate(
      current &&
        !BOTTOM_KEYS.includes(current.key)
        ? "/partner/profile"
        : "/partner"
    );
  };

  // ---------------------------------------------------------------------------
  // Render
  // ---------------------------------------------------------------------------

  return (
    <PartnerStatusContext.Provider
      value={{
        online,
        setOnline,
      }}
    >
      <div className="flex min-h-screen bg-slate-50 text-slate-900">
        <PartnerSidebar
          collapsed={collapsed}
          currentLabel={current?.label}
        />

        <div className="min-w-0 flex-1">
          {/* Header */}
          <header className="sticky top-0 z-20 flex h-14 items-center justify-between border-b border-slate-200 bg-white px-2 sm:h-16 sm:px-6">

            <div className="flex min-w-0 items-center gap-0.5 sm:gap-3">

              {showBack && (
                <button
                  onClick={goBack}
                  aria-label="Go back"
                  className="shrink-0 rounded-md p-2 text-slate-600 hover:bg-slate-100 focus-visible:outline focus-visible:outline-2 focus-visible:outline-[#4338ca] lg:hidden"
                >
                  <ArrowLeft size={20} />
                </button>
              )}

              <button
                onClick={() =>
                  setCollapsedPref(
                    (v) => !v
                  )
                }
                aria-label={
                  collapsed
                    ? "Expand sidebar"
                    : "Collapse sidebar"
                }
                className="hidden rounded-md p-2 text-slate-600 hover:bg-slate-100 focus-visible:outline focus-visible:outline-2 focus-visible:outline-[#4338ca] lg:inline-flex"
              >
                {collapsed ? (
                  <PanelLeftOpen size={20} />
                ) : (
                  <PanelLeftClose size={20} />
                )}
              </button>

              <h1 className="truncate text-base font-semibold text-[#4338ca] sm:text-lg">
                {title}
              </h1>
            </div>

            <div
              className={`shrink-0 items-center gap-0.5 sm:gap-3 ${
                minimalHeader
                  ? "hidden lg:flex"
                  : "flex"
              }`}
            >
              {!hideStatusPill && (
                <OnlineIndicator
                  online={online}
                  onChange={setOnline}
                />
              )}

              <button
                aria-label="Notifications"
                className="relative rounded-full p-2 text-slate-500 hover:bg-slate-100 focus-visible:outline focus-visible:outline-2 focus-visible:outline-[#4338ca]"
              >
                <Bell size={20} />
              </button>
            </div>
          </header>

          {/* Page content */}
          <main
            className={`px-4 py-6 sm:px-6 lg:pb-8 ${
              hideBottomNav
                ? "pb-8"
                : "pb-24"
            }`}
          >
            <PartnerErrorBoundary
              resetKey={pathname}
            >
              <Outlet />
            </PartnerErrorBoundary>
          </main>
        </div>

        {!hideBottomNav && (
          <BottomNav
            visible={navVisible}
            path={cleanPath}
          />
        )}
      </div>
    </PartnerStatusContext.Provider>
  );
}