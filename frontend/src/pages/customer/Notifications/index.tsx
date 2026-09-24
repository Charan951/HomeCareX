import PageShell from "../../../components/layout/PageShell";

/**
 * Notifications — route: /notifications
 * Default export so App.tsx can do: import Notifications from "./pages/customer/Notifications";
 */
export default function Notifications() {
  return (
    <PageShell
      title="Notifications"
      description="Your notifications."
    />
  );
}
