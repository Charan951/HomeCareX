import PageShell from "../../../components/layout/PageShell";

/**
 * BookingDetails — route: /bookings/
 * Default export so App.tsx can do: import BookingDetails from "./pages/customer/BookingDetails";
 */
export default function BookingDetails() {
  return (
    <PageShell
      title="BookingDetails"
      description="id:Details for a single booking."
    />
  );
}
