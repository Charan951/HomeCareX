export type NavIconName = "home" | "calendar" | "grid" | "user" | "list" | "map-pin";

export interface NavItem {
  to: string;
  label: string;
  end?: boolean;
  icon: NavIconName;
}

// Single source of truth for customer nav — Sidebar (desktop) and BottomTabBar
// (mobile) both read from this so adding a route only means editing one file.
export const CUSTOMER_NAV_ITEMS: NavItem[] = [
  { to: "/", label: "Overview", end: true, icon: "home" },
  { to: "/bookings", label: "Bookings", icon: "calendar" },
  { to: "/tracking", label: "Live Tracking", icon: "map-pin" },
  { to: "/services", label: "Services", icon: "grid" },
  { to: "/profile", label: "Profile", icon: "user" },
];
