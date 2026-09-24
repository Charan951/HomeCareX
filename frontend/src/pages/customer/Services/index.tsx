import PageShell from "../../../components/layout/PageShell";

/**
 * Services — route: /services
 * Default export so App.tsx can do: import Services from "./pages/customer/Services";
 */
export default function Services() {
  return (
    <PageShell
      title="Services"
      description="Browse available services."
    />
  );
}
