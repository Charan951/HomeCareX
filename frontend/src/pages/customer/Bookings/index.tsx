import PageShell from "../../../components/layout/PageShell";

/**
 * Bookings — route: /bookings
 * Default export so App.tsx can do: import Bookings from "./pages/customer/Bookings";
 */
export default function Bookings() {
  return (
    <PageShell
      title="Bookings"
      description="View and manage your bookings."
    />
  );
}
