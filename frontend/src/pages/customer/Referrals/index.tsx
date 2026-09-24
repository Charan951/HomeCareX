import PageShell from "../../../components/layout/PageShell";

/**
 * Referrals — route: /referrals
 * Default export so App.tsx can do: import Referrals from "./pages/customer/Referrals";
 */
export default function Referrals() {
  return (
    <PageShell
      title="Referrals"
      description="Invite friends and track referrals."
    />
  );
}
