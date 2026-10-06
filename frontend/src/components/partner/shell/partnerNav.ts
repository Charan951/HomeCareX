import type { LucideIcon } from "lucide-react";
import {
  Ban, Banknote, Briefcase, CalendarClock, CalendarDays, CheckCircle2, Clock, FileText, Gift,
  Headset, Home, LayoutDashboard, LifeBuoy, ListChecks, Settings, ShieldAlert, Star, Ticket, User,
  UserCheck, Wallet, Wrench, Inbox, Navigation, TrendingUp,
} from "lucide-react";

export const PARTNER_BASE = "/partner";
export const partnerPath = (path = ""): string =>
  path === "" || path === "/" ? PARTNER_BASE : `${PARTNER_BASE}${path}`;

export interface PartnerNavItem {
  label: string;
  to: string;
  icon: LucideIcon;
  end?: boolean;
}
export interface PartnerNavGroup {
  heading: string;
  items: PartnerNavItem[];
}

/** Sidebar + drawer — single source of truth for partner navigation. */
export const PARTNER_SIDEBAR_GROUPS: PartnerNavGroup[] = [
  {
    heading: "Home",
    items: [{ label: "Dashboard", to: partnerPath(), icon: LayoutDashboard, end: true }],
  },
  {
    heading: "Work",
    items: [
      { label: "Job Requests", to: partnerPath("/work/requests"), icon: Inbox },
      { label: "Active Job", to: partnerPath("/work/active"), icon: Navigation },
      { label: "Today's Jobs", to: partnerPath("/work/today"), icon: ListChecks },
      { label: "Completed", to: partnerPath("/work/completed"), icon: CheckCircle2 },
      { label: "Cancelled", to: partnerPath("/work/cancelled"), icon: Ban },
    ],
  },
  {
    heading: "Schedule",
    items: [
      { label: "Availability", to: partnerPath("/availability"), icon: CalendarClock, end: true },
      { label: "Working Hours", to: partnerPath("/availability/hours"), icon: Clock },
      { label: "Blackout Dates", to: partnerPath("/availability/blackout-dates"), icon: CalendarDays },
      { label: "Services", to: partnerPath("/services"), icon: Wrench },
    ],
  },
  {
    heading: "Earnings",
    items: [
      { label: "Overview", to: partnerPath("/earnings"), icon: Wallet, end: true },
      { label: "Payout History", to: partnerPath("/earnings/payouts"), icon: Banknote },
      { label: "Incentives", to: partnerPath("/earnings/incentives"), icon: Gift },
      { label: "Performance", to: partnerPath("/performance"), icon: TrendingUp, end: true },
      { label: "Reviews", to: partnerPath("/performance/reviews"), icon: Star },
    ],
  },
  {
    heading: "Account",
    items: [
      { label: "Profile", to: partnerPath("/profile"), icon: User, end: true },
      { label: "Documents", to: partnerPath("/profile/documents"), icon: FileText },
      { label: "Verification", to: partnerPath("/profile/verification"), icon: UserCheck },
      { label: "Settings", to: partnerPath("/system"), icon: Settings },
    ],
  },
  {
    heading: "Support",
    items: [
      { label: "Help Center", to: partnerPath("/support"), icon: LifeBuoy, end: true },
      { label: "My Tickets", to: partnerPath("/support/tickets"), icon: Ticket },
      { label: "Safety & SOS", to: partnerPath("/support/safety"), icon: ShieldAlert },
    ],
  },
];

/** Mobile bottom navigation — exactly four tabs. */
export const PARTNER_BOTTOM_NAV: PartnerNavItem[] = [
  { label: "Home", to: partnerPath(), icon: Home, end: true },
  { label: "Jobs", to: partnerPath("/work/requests"), icon: Briefcase },
  { label: "Earnings", to: partnerPath("/earnings"), icon: Wallet },
  { label: "Support", to: partnerPath("/support"), icon: Headset },
];

/** Top-bar title for the current path. */
export function getPartnerTitle(pathname: string): string {
  const path = pathname.replace(/\/+$/, "");
  if (path === partnerPath("/earnings/payouts") || path === partnerPath("/payouts")) {
    return "Partner Payouts";
  }
  return "Partner Dashboard";
}