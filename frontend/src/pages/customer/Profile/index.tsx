import { useAuth } from "@/hooks/useAuth";
import { useAddresses, useCustomerDashboard } from "@/features/customer";
import AccountMenu, { type RowBadges } from "./AccountMenu";
import LogoutCard from "./LogoutCard";
import ProfileDesktop from "./ProfileDesktop";
import ProfileHero, { statLinks, type ProfileStat } from "./ProfileHero";

/**
 * Profile.
 *  - mobile: the account hub that replaced the hamburger menu — gradient header with live stats,
 *            grouped menu cards (Bookings / Account / Support) and Log out.
 *  - md+   : ProfileDesktop — hero header with live stats, then Contact / Default address / Shortcuts cards
 *            (the sidebar already carries navigation and Log out).
 * Name, email and phone come from the signed-in user; counts come from the dashboard and address APIs.
 */
export default function Profile() {
  const { user } = useAuth();
  const dashboard = useCustomerDashboard();
  const addresses = useAddresses();

  const name = user?.name ?? "Guest";
  const defaultAddress = addresses.data?.find((a) => a.isDefault) ?? addresses.data?.[0];

  // Counts: undefined while loading, null if the request failed (shown as "–").
  const fromDashboard = (n: number | undefined) => (dashboard.isError ? null : n);
  const active = dashboard.data?.activeBookings.length;
  const upcoming = dashboard.data?.upcomingBookings.length;
  const places = addresses.isError ? null : addresses.data?.length;

  const stats: ProfileStat[] = [
    { label: "Active", value: fromDashboard(active), to: statLinks.active },
    { label: "Upcoming", value: fromDashboard(upcoming), to: statLinks.upcoming },
    { label: "Saved places", value: places, to: statLinks.places },
  ];

  const badges: RowBadges = {};
  if (active) badges["Active Booking"] = { text: `${active} live`, live: true };
  if (places) badges.Addresses = { text: `${places} saved` };

  return (
    <div className="profile-page space-y-5 md:space-y-6">
      {/* ---------- mobile ---------- */}
      <ProfileHero name={name} email={user?.email} phone={user?.phone} stats={stats} />
      <AccountMenu badges={badges} />
      <LogoutCard />

      {/* ---------- desktop ---------- */}
      <ProfileDesktop
        name={name}
        email={user?.email}
        phone={user?.phone}
        addressLabel={defaultAddress?.label}
        addressText={defaultAddress ? [defaultAddress.line1, defaultAddress.city].filter(Boolean).join(", ") : undefined}
        addressLoading={addresses.isPending}
        stats={stats}
      />
    </div>
  );
}
