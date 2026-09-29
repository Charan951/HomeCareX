import type { LucideIcon } from "lucide-react";
import {
  CalendarCheck,
  CreditCard,
  Gift,
  Headset,
  Home,
  LayoutDashboard,
  LayoutGrid,
  LifeBuoy,
  MapPin,
  Navigation,
  Star,
  Ticket,
  User,
  Wallet,
  Wrench,
} from "lucide-react";
import { customerPath } from "@/routes/customerPath";

export interface CustomerNavItem {
  label: string;
  to: string;
  icon: LucideIcon;
  /** Match the exact path only (so a parent link isn't active on its children). */
  end?: boolean;
}

export interface CustomerNavGroup {
  heading: string;
  items: CustomerNavItem[];
}

/** Desktop sidebar — single source of truth for grouped navigation. */
export const SIDEBAR_GROUPS: CustomerNavGroup[] = [
  {
    heading: "Home",
    items: [
      { label: "Dashboard", to: customerPath(), icon: LayoutDashboard, end: true },
      { label: "Categories", to: customerPath("/categories"), icon: LayoutGrid },
      { label: "Services", to: customerPath("/services"), icon: Wrench },
    ],
  },
  {
    heading: "Bookings",
    items: [
      { label: "My Bookings", to: customerPath("/bookings"), icon: CalendarCheck },
      { label: "Active Booking", to: customerPath("/tracking"), icon: Navigation },
    ],
  },
  {
    heading: "Account",
    items: [
      { label: "Addresses", to: customerPath("/addresses"), icon: MapPin },
      { label: "Profile", to: customerPath("/profile"), icon: User },
      { label: "Payments", to: customerPath("/payments"), icon: CreditCard },
      { label: "Wallet", to: customerPath("/wallet"), icon: Wallet },
      { label: "Reviews", to: customerPath("/reviews"), icon: Star },
    ],
  },
  {
    heading: "Support",
    items: [
      { label: "Help Center", to: customerPath("/support"), icon: LifeBuoy, end: true },
      { label: "My Tickets", to: customerPath("/support/tickets"), icon: Ticket },
      { label: "Referrals", to: customerPath("/referrals"), icon: Gift },
    ],
  },
];

/** Mobile bottom navigation — exactly four tabs. */
export const BOTTOM_NAV_ITEMS: CustomerNavItem[] = [
  { label: "Home", to: customerPath(), icon: Home, end: true },
  { label: "Bookings", to: customerPath("/bookings"), icon: CalendarCheck },
  { label: "Support", to: customerPath("/support"), icon: Headset },
  { label: "Profile", to: customerPath("/profile"), icon: User },
];
