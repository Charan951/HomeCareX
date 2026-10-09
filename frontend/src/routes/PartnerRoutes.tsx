import { Routes, Route } from "react-router-dom";

import ProfileMenu from "../components/partner/ProfileMenu";
import PartnerLayout from "../layouts/PartnerLayout";

import PartnerDashboard from "../pages/partner/Dashboard";
import PartnerJobsPage from "../pages/partner/Jobs";
import PartnerAvailabilityPage from "../pages/partner/Availability";
import PartnerWorkingHoursPage from "../pages/partner/WorkingHours";
import PartnerBlackoutDatesPage from "../pages/partner/BlackoutDates";
import PartnerSchedulePage from "../pages/partner/Schedule";
import PartnerEarningsPage from "../pages/partner/Earnings";
import PartnerIncentivesPage from "../pages/partner/Incentives";
import PartnerPayoutsPage from "../pages/partner/Payouts";
import PartnerWalletPage from "../pages/partner/Wallet";
import PartnerTransactionsPage from "../pages/partner/Transactions";

import "../styles/calm-overrides.css";
import "../styles/mobile-plain.css";

// Placeholder for pages that have not been implemented yet.
const Placeholder = ({ title }: { title: string }) => (
  <div className="rounded border border-dashed border-line bg-panel p-8 text-center">
    <h2 className="text-lg font-semibold text-brand">{title}</h2>
    <p className="mt-1 text-sm text-muted">
      This page is coming soon.
    </p>
  </div>
);

// Placeholder routes + dashboard index
export const PARTNER_PAGES: {
  path: string;
  title: string;
}[] = [
  // Work
  { path: "work", title: "Work" },
  { path: "work/requests", title: "Job requests" },
  { path: "work/active", title: "Active job" },
  { path: "work/today", title: "Today's jobs" },
  { path: "work/completed", title: "Completed jobs" },
  { path: "work/cancelled", title: "Cancelled jobs" },
  { path: "work/:jobId", title: "Job details" },

  // Availability pages
  // availability, working hours, blackout dates, schedule
  // are real routes below.

  // Services (4)
  { path: "services", title: "Services" },
  { path: "services/categories", title: "My categories" },
  { path: "services/radius", title: "Service radius" },
  { path: "services/training", title: "Training & certifications" },

  // Earnings
  { path: "earnings/payouts", title: "Payout history" },
  { path: "earnings/statements", title: "Earnings statements" },
  { path: "earnings/bank-details", title: "Bank / UPI details" },

  // Performance (3)
  { path: "performance", title: "Performance" },
  { path: "performance/reviews", title: "Customer reviews" },
  { path: "performance/improvement", title: "Improvement tips" },

  // Profile (5)
  { path: "profile", title: "Profile" },
  { path: "profile/edit", title: "Edit profile" },
  { path: "profile/documents", title: "Documents" },
  { path: "profile/verification", title: "Verification status" },
  { path: "profile/preferences", title: "Preferences" },

  // Support (5)
  { path: "support", title: "Support" },
  { path: "support/tickets", title: "My tickets" },
  { path: "support/tickets/new", title: "Raise a ticket" },
  { path: "support/tickets/:ticketId", title: "Ticket details" },
  { path: "support/safety", title: "Safety & SOS" },

  // System (2)
  { path: "system", title: "System settings" },
  { path: "system/notifications", title: "Notification settings" },
];

// Mounted by AppRoutes at /partner/*.
// Already wrapped in:
// <ProtectedRoute allowedRoles={["partner"]}>
//
// Wrong role -> /unauthorized.
// Errors inside a page are caught by PartnerErrorBoundary in the layout.
export default function PartnerRoutes() {
  return (
    <Routes>
      <Route element={<PartnerLayout />}>

        {/* Partner Dashboard */}
        <Route index element={<PartnerDashboard />} />

        {/* Availability */}
        <Route
          path="availability"
          element={<PartnerAvailabilityPage />}
        />

        <Route
          path="working-hours"
          element={<PartnerWorkingHoursPage />}
        />

        <Route
          path="availability/hours"
          element={<PartnerWorkingHoursPage />}
        />

        <Route
          path="blackout-dates"
          element={<PartnerBlackoutDatesPage />}
        />

        <Route
          path="availability/blackout-dates"
          element={<PartnerBlackoutDatesPage />}
        />

        <Route
          path="schedule"
          element={<PartnerSchedulePage />}
        />

        {/* Earnings */}
        <Route
          path="earnings"
          element={<PartnerEarningsPage />}
        />

        <Route
          path="incentives"
          element={<PartnerIncentivesPage />}
        />

        <Route
          path="earnings/incentives"
          element={<PartnerIncentivesPage />}
        />

        <Route
          path="payouts"
          element={<PartnerPayoutsPage />}
        />

        <Route
          path="earnings/payouts"
          element={<PartnerPayoutsPage />}
        />

        {/* Wallet / Transactions */}
        <Route
          path="wallet"
          element={<PartnerWalletPage />}
        />

        <Route
          path="transactions"
          element={<PartnerTransactionsPage />}
        />

        {/* =======================================================
            P02 - Job Requests & My Jobs
            ======================================================= */}

        {/* All jobs */}
        <Route
          path="jobs"
          element={<PartnerJobsPage />}
        />

        {/* Job requests */}
        <Route
          path="jobs/requests"
          element={<PartnerJobsPage />}
        />

        {/* =======================================================
            Remaining placeholder pages
            ======================================================= */}

        {PARTNER_PAGES
          .filter(({ path }) => path !== "earnings/payouts")
          .map(({ path, title }) => (
            <Route
              key={path}
              path={path}
              element={
                path === "profile" ? (
                  <ProfileMenu />
                ) : (
                  <Placeholder title={title} />
                )
              }
            />
          ))}

        {/* Catch-all */}
        <Route
          path="*"
          element={<Placeholder title="Page not found" />}
        />

      </Route>
    </Routes>
  );
}