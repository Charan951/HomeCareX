import PageShell from "../../../components/layout/PageShell";

/**
 * Payments — route: /payments
 * Default export so App.tsx can do: import Payments from "./pages/customer/Payments";
 */
export default function Payments() {
  return (
    <PageShell
      title="Payments"
      description="Manage payment methods and history."
    />
  );
}
