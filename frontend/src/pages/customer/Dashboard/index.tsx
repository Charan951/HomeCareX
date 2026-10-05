import { Link } from "react-router-dom";
import { customerPath } from "@/routes/customerPath";
import { ErrorState, OfflineState } from "@/components/customer";
import { useOnlineStatus } from "@/hooks/useOnlineStatus";
import { useCustomerDashboard } from "@/features/customer";
import { OFFERS } from "@/mocks/customerMockData"; // no offers endpoint yet — promos stay static
import DashboardSkeleton from "./sections/DashboardSkeleton";
import GreetingSection from "./sections/GreetingSection";
import SearchBar from "./sections/SearchBar";
import ActiveBookingCard from "./sections/ActiveBookingCard";
import QuickActions from "./sections/QuickActions";
import UpcomingBookings from "./sections/UpcomingBookings";
import CategoryCard from "./sections/CategoryCard";
import RecommendedServices from "./sections/RecommendedServices";
import OffersCarousel from "./sections/OffersCarousel";
import NewCustomerEmptyState from "./sections/NewCustomerEmptyState";

function SectionHeader({ title, to }: { title: string; to?: string }) {
  return (
    <div className="mb-3 flex items-center justify-between">
      <h2 className="text-base font-semibold text-ink">{title}</h2>
      {to && (
        <Link to={to} className="text-sm font-medium text-brand hover:underline">
          View all
        </Link>
      )}
    </div>
  );
}

export default function Dashboard() {
  const { data, isPending, isError, error, refetch } = useCustomerDashboard();
  const online = useOnlineStatus();

  if (isPending) return <DashboardSkeleton />;

  // Failed and nothing cached to fall back on. (If we already have data, a failed
  // background refetch keeps showing it — the layout's offline banner covers "you're offline".)
  if (isError || !data) {
    const noConnection = !online || error?.code === "NETWORK_ERROR";
    return noConnection ? (
      <OfflineState onRetry={() => void refetch()} />
    ) : (
      <ErrorState
        title="We couldn't load your dashboard"
        message={error?.message ?? "Please try again. If the problem continues, contact support."}
        onRetry={() => void refetch()}
      />
    );
  }

  const { activeBookings, upcomingBookings, categories, recommendedServices, isNewCustomer } = data;

  return (
    <div className="dashboard-mobile space-y-6">
      <GreetingSection firstName={data.greeting.firstName} isNewCustomer={isNewCustomer}>
        <SearchBar services={recommendedServices} />
      </GreetingSection>

      {activeBookings.length > 0 && <ActiveBookingCard bookings={activeBookings} />}

      <QuickActions hasActiveBooking={activeBookings.length > 0} hasBookingHistory={!isNewCustomer} />

      {isNewCustomer ? (
        <NewCustomerEmptyState categories={categories} />
      ) : (
        upcomingBookings.length > 0 && (
          <section className="rounded-lg border border-line bg-panel p-4 shadow-sm sm:p-5">
            <SectionHeader title="Upcoming" to={customerPath("/bookings")} />
            <UpcomingBookings bookings={upcomingBookings} />
          </section>
        )
      )}

      {categories.length > 0 && (
        <section className="dashboard-section dashboard-section--categories">
          <SectionHeader title="Browse categories" to={customerPath("/categories")} />
          <div className="grid grid-cols-2 gap-3 md:grid-cols-4">
            {categories.slice(0, 4).map((c) => (
              <CategoryCard key={c.id} category={c} />
            ))}
          </div>
        </section>
      )}

      {recommendedServices.length > 0 && (
        <section className="dashboard-section">
          <SectionHeader title="Recommended for you" />
          <RecommendedServices services={recommendedServices} />
        </section>
      )}

      <section className="dashboard-section dashboard-section--offers">
        <SectionHeader title="Offers for you" />
        <OffersCarousel offers={OFFERS} />
      </section>
    </div>
  );
}
