import PageShell from "../../../components/layout/PageShell";

/**
 * Wallet — route: /wallet
 * Default export so App.tsx can do: import Wallet from "./pages/customer/Wallet";
 */
export default function Wallet() {
  return (
    <PageShell
      title="Wallet"
      description="Your wallet balance and transactions."
    />
  );
}
