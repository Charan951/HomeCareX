import { BrowserRouter } from "react-router-dom";
import CustomerRoutes from "./routes/CustomerRoutes";

/**
 * App — top-level shell. Only owns the BrowserRouter; each user surface
 * (Customer today, Partner/Admin later) gets its own Routes component under
 * src/routes/ so App.tsx doesn't grow into a dumping ground as more surfaces
 * are added.
 */
export default function App() {
  return (
    <BrowserRouter>
      <CustomerRoutes />
    </BrowserRouter>
  );
}
