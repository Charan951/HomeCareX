import { useMemo, useState } from "react";
import { Link } from "react-router-dom";
import { useMockAsync } from "@/hooks/useMockAsync";
import { customerPath } from "@/routes/customerPath";
import { ADDRESSES, BOOKINGS, CATEGORIES, OFFERS, PROFILE, SERVICES } from "@/mocks/customerMockData";
import DashboardSkeleton from "./sections/DashboardSkeleton";
import LocationSearchBar from "./sections/LocationSearchBar";
import ActiveBookingCard from "./sections/ActiveBookingCard";
import QuickActions from "./sections/QuickActions";
import RecommendedServices from "./sections/RecommendedServices";
import OffersCarousel from "./sections/OffersCarousel";
import UpcomingBookings from "./sections/UpcomingBookings";
import NewCustomerEmptyState from "./sections/NewCustomerEmptyState";

const ACTIVE_STATUSES = new Set(["Confirmed", "Partner Assigned", "En Route", "Arrived", "In Progress"]);

export default function Dashboard() {
  // Dev-only toggle so the new-customer empty state can be reviewed/screenshotted
  // without editing mock data. Remove once a real "no bookings yet" account exists.
  const [previewNewCustomer] = useState(false);

  const bookings = previewNewCustomer ? [] : BOOKINGS;
  const { data, loading } = useMockAsync({ bookings, categories: CATEGORIES, services: SERVICES, offers: OFFERS });

  const upcoming = useMemo(() => data.bookings.filter((b) => ACTIVE_STATUSES.has(b.status)), [data.bookings]);
  const activeBooking = useMemo(() => data.bookings.find((b) => b.status === "In Progress"), [data.bookings]);
  const hasCompletedBooking = data.bookings.some((b) => b.status === "Completed");
  const isNewCustomer = data.bookings.length === 0;
  const defaultAddress = ADDRESSES.find((a) => a.isDefault);
  const recommended = data.services.slice(0, 5);

  if (loading) return <DashboardSkeleton />;

  return (
    <div className="space-y-6">
      <div className="flex items-start justify-between gap-3">
        <div>
          <h1 className="text-xl font-semibold text-ink">Welcome back, {PROFILE.name.split(" ")[0]} 👋</h1>
          <p className="mt-1 text-sm text-muted">Here's an overview of your account.</p>
        </div>
     
      </div>

      <LocationSearchBar address={defaultAddress} />

      {activeBooking && <ActiveBookingCard booking={activeBooking} />}

      <QuickActions hasActiveBooking={Boolean(activeBooking)} hasCompletedBooking={hasCompletedBooking} />

      {isNewCustomer ? (
        <NewCustomerEmptyState categories={data.categories} />
      ) : (
        <div className="rounded border border-line bg-panel p-6">
          <div className="mb-4 flex items-center justify-between">
            <h2 className="font-semibold text-ink">Upcoming</h2>
            <Link to={customerPath("/bookings")} className="text-sm font-medium text-brand">
              View all
            </Link>
          </div>
          {upcoming.length > 0 ? (
            <UpcomingBookings bookings={upcoming} />
          ) : (
            <p className="py-4 text-center text-sm text-muted">No upcoming bookings. Book a service to see it here.</p>
          )}
        </div>
      )}

      <div>
        <div className="mb-3 flex items-center justify-between">
          <h2 className="font-semibold text-ink">Browse categories</h2>
          <Link to={customerPath("/categories")} className="text-sm font-medium text-brand">
            View all
          </Link>
        </div>
        <div className="grid grid-cols-2 gap-4 md:grid-cols-4">
          {data.categories.slice(0, 4).map((c) => (
            <Link
              key={c.id}
              to={customerPath("/services")}
              className="rounded border border-line bg-panel p-4 transition-colors hover:border-brand"
            >
              <div className="mb-2 text-2xl">{c.icon}</div>
              <div className="text-sm font-medium text-ink">{c.name}</div>
              <div className="mt-1 text-xs text-muted">{c.serviceCount} services</div>
            </Link>
          ))}
        </div>
      </div>

      <div>
        <h2 className="mb-3 font-semibold text-ink">Recommended for you</h2>
        <RecommendedServices services={recommended} categories={data.categories} />
      </div>

      <div>
        <h2 className="mb-3 font-semibold text-ink">Offers for you</h2>
        <OffersCarousel offers={data.offers} />
      </div>
    </div>
  );
}
