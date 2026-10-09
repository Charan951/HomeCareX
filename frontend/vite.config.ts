import { defineConfig } from 'vitest/config';
import react from '@vitejs/plugin-react';
import path from 'node:path';

export default defineConfig({
  plugins: [
    react(),
  ],

  resolve: {
    alias: {
      '@': path.resolve(
        import.meta.dirname,
        './src',
      ),
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

    proxy: {
      '/api': {
        target: 'http://localhost:5000',
        changeOrigin: true,
      },
    },
  },

  preview: {
    port: 3000,

    proxy: {
      '/api': {
        target: 'http://localhost:5000',
        changeOrigin: true,
      },
    },
  },

  test: {
    globals: true,
    environment: 'jsdom',
    setupFiles: './src/test/setup.ts',
  },
});