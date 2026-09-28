import { customerPath } from "@/routes/customerPath";
import { ACTIVE_BOOKING } from "../../mocks/customerMockData";

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
  { to: customerPath(), label: "Overview", end: true, icon: "home" },
  { to: customerPath("/bookings"), label: "Bookings", icon: "calendar" },
 { to: customerPath("/tracking"), label: "Live Tracking", icon: "map-pin" },
  { to: customerPath("/services"), label: "Services", icon: "grid" },
  { to: customerPath("/profile"), label: "Profile", icon: "user" },
];
