import PageShell from "../../../components/layout/PageShell";

/**
 * Addresses — route: /addresses
 * Default export so App.tsx can do: import Addresses from "./pages/customer/Addresses";
 */
export default function Addresses() {
  return (
    <PageShell
      title="Addresses"
      description="Manage your saved addresses."
    />
  );
}
