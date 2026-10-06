import { Link } from "react-router-dom";
import clsx from "clsx";
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
    <div className="mb-3 flex items-center justify-between md:mb-4">
      <h2 className="text-base font-semibold text-ink md:text-lg">{title}</h2>
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
    <div className="dashboard-mobile mx-auto max-w-[1180px] space-y-6 md:space-y-8">
      <GreetingSection firstName={data.greeting.firstName} isNewCustomer={isNewCustomer}>
        <SearchBar services={recommendedServices} />
        {recommendedServices.length > 0 && (
          <div className="mt-3 flex flex-wrap gap-2" aria-label="Popular searches">
            {recommendedServices.slice(0, 4).map((s) => (
              <Link
                key={s.id}
                to={`${customerPath("/services")}?q=${encodeURIComponent(s.name)}`}
                className="rounded-full bg-white/15 px-3 py-1 text-xs font-medium text-white transition-colors hover:bg-white/25 focus-visible:outline focus-visible:outline-2 focus-visible:outline-white"
              >
                {s.name}
              </Link>
            ))}
          </div>
        )}
      </GreetingSection>

      {activeBookings.length > 0 && <ActiveBookingCard bookings={activeBookings} />}

      <div className="md:hidden">
        <QuickActions hasActiveBooking={activeBookings.length > 0} hasBookingHistory={!isNewCustomer} />
      </div>

      {isNewCustomer ? (
        <NewCustomerEmptyState categories={categories} />
      ) : (
        upcomingBookings.length > 0 && (
          <section className="rounded-[20px] border border-white bg-white p-4 shadow-[0_9px_26px_rgba(30,27,46,.07)] sm:p-5">
            <SectionHeader title="Upcoming" to={customerPath("/bookings")} />
            <UpcomingBookings bookings={upcomingBookings} />
          </section>
        )
      )}

      {categories.length > 0 && (
        <section className="dashboard-section dashboard-section--categories">
          <SectionHeader title="Browse categories" to={customerPath("/categories")} />
          <div className="grid grid-cols-2 gap-3 md:grid-cols-3 md:gap-4 xl:grid-cols-6">
            {categories.slice(0, 6).map((c, i) => (
              // Phones keep the compact 4; wider screens show all 6.
              <div key={c.id} className={clsx(i >= 4 && "hidden md:block")}>
                <CategoryCard category={c} index={i} />
              </div>
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
