import PageShell from "../../../components/layout/PageShell";

/**
 * Profile — route: /profile
 * Default export so App.tsx can do: import Profile from "./pages/customer/Profile";
 */
export default function Profile() {
  return (
    <PageShell
      title="Profile"
      description="Your account profile."
    />
  );
}
