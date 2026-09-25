import PageShell from "../../../components/layout/PageShell";

/**
 * Dashboard — route: /
 * Default export so App.tsx can do: import Dashboard from "./pages/customer/Dashboard";
 */
export default function Dashboard() {
  return (
    <PageShell
      title="Overview"
      description="Overview of your account at a glance."
    />
  );
}
