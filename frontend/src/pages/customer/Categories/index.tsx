import PageShell from "../../../components/layout/PageShell";

/**
 * Categories — route: /categories
 * Default export so App.tsx can do: import Categories from "./pages/customer/Categories";
 */
export default function Categories() {
  return (
    <PageShell
      title="Categories"
      description="Browse service categories."
    />
  );
}
