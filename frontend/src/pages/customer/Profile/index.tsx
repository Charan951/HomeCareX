import { Link } from "react-router-dom";
import { Pencil } from "lucide-react";
import { useAuth } from "@/hooks/useAuth";
import { customerPath } from "@/routes/customerPath";
import { useAddresses, useCustomerDashboard } from "@/features/customer";
import { FOCUS_RING } from "@/components/customer/focusRing";
import AccountMenu, { type RowBadges } from "./AccountMenu";
import LogoutCard from "./LogoutCard";
import ProfileHero, { initialsOf, statLinks, type ProfileStat } from "./ProfileHero";

/**
 * Profile.
 *  - mobile: the account hub that replaced the hamburger menu — gradient header with live stats,
 *            grouped menu cards (Bookings / Account / Support) and Log out.
 *  - md+   : the details card (the sidebar already carries navigation and Log out).
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
      <div className="hidden space-y-6 md:block">
        <div>
          <h1 className="text-xl font-semibold text-ink">Profile</h1>
          <p className="mt-1 text-sm text-muted">Your account details.</p>
        </div>

        <div className="flex items-center gap-4 rounded border border-line bg-panel p-6">
          <div className="flex h-16 w-16 shrink-0 items-center justify-center rounded-full bg-brand-soft text-xl font-semibold text-brand" aria-hidden="true">
            {initialsOf(name)}
          </div>
          <div className="min-w-0 flex-1">
            <div className="font-semibold text-ink">{name}</div>
            <div className="text-sm text-muted">{user?.email ?? "HomeCareX customer"}</div>
          </div>
          <Link
            to={customerPath("/profile/edit")}
            className={`group inline-flex items-center gap-2 rounded-full px-3 py-2 text-sm font-semibold text-brand transition-colors hover:bg-brand-soft ${FOCUS_RING}`}
          >
            <Pencil className="h-4 w-4 transition-transform duration-200 group-hover:-rotate-12" aria-hidden="true" />
            <span className="bg-[linear-gradient(currentColor,currentColor)] bg-[length:0%_1.5px] bg-left-bottom bg-no-repeat pb-px transition-[background-size] duration-300 group-hover:bg-[length:100%_1.5px]">
              Edit profile
            </span>
          </Link>
        </div>

        <dl className="grid gap-4 rounded border border-line bg-panel p-6 text-sm sm:grid-cols-2">
          <div>
            <dt className="text-xs text-muted">Phone</dt>
            <dd className="mt-0.5 text-ink">{user?.phone ?? "Not added"}</dd>
          </div>
          <div>
            <dt className="text-xs text-muted">Email</dt>
            <dd className="mt-0.5 text-ink">{user?.email ?? "Not added"}</dd>
          </div>
          <div className="sm:col-span-2">
            <dt className="text-xs text-muted">Default address</dt>
            <dd className="mt-0.5 text-ink">
              {defaultAddress ? (
                <>
                  {defaultAddress.label} · {[defaultAddress.line1, defaultAddress.line2, defaultAddress.city].filter(Boolean).join(", ")}
                </>
              ) : addresses.isPending ? (
                "Loading…"
              ) : (
                <Link to={customerPath("/addresses")} className={`rounded font-medium text-brand hover:underline ${FOCUS_RING}`}>
                  Add an address
                </Link>
              )}
            </dd>
          </div>
        </dl>
      </div>
    </div>
  );
}
