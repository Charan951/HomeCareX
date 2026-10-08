import { defineConfig } from "vitest/config";
import react from "@vitejs/plugin-react";
import path from "path";

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [react()],

  resolve: {
    alias: {
      "@": path.resolve(import.meta.dirname, "./src"),
    },
  },

  optimizeDeps: {
    exclude: ["jspdf"],
  },

  build: {
    rollupOptions: {
      external: ["jspdf"],
    },
  },

  server: {
    port: 3000,
    open: true,

    // Same-origin API calls in dev, so the refresh cookie works without CORS.
    proxy: {
      "/api": {
        target: "http://localhost:5000",
        changeOrigin: true,
      },
    },
  },

  preview: {
    port: 3000,
    proxy: {
      "/api": { target: "http://localhost:5000", changeOrigin: true },
    },
  },

  // Vitest configuration
  test: {
    globals: true,
    environment: "jsdom",
    setupFiles: "./src/test/setup.ts",
  },
});
