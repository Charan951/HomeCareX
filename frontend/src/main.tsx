import React from "react";
import ReactDOM from "react-dom/client";
import { BrowserRouter } from "react-router-dom";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import App from "./App";
import { AuthProvider } from "./context/AuthContext";
import ErrorBoundary from "./components/common/ErrorBoundary";
import { registerServiceWorker } from "./registerServiceWorker";

import "./index.css";

// Register the service worker in production builds only. In dev (Vite) a service worker can
// serve stale bundles or cached API responses and make auth bugs very hard to reproduce.
if (import.meta.env.PROD) {
  registerServiceWorker();
}

// One retry (not the default 3) so a failed request shows its error state within a couple of
// seconds instead of spinning for ~7s; no refetch every time the tab regains focus.
const queryClient = new QueryClient({
  defaultOptions: {
    queries: { retry: 1, refetchOnWindowFocus: false },
  },
});

ReactDOM.createRoot(document.getElementById("root")!).render(
  <React.StrictMode>
    <BrowserRouter>
      <ErrorBoundary>
        <QueryClientProvider client={queryClient}>
          <AuthProvider>
            <App />
          </AuthProvider>
        </QueryClientProvider>
      </ErrorBoundary>
    </BrowserRouter>
  </React.StrictMode>,
);
