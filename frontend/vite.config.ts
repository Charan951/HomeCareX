import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import { VitePWA } from 'vite-plugin-pwa';
import { fileURLToPath, URL } from 'node:url';

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [
    react(),
    VitePWA({
      registerType: 'autoUpdate',
      injectRegister: null, // Registered explicitly at application entry point (src/main.tsx)
      manifest: {
        name: 'HomeCareX',
        short_name: 'HomeCareX',
        description: 'HomeCareX Professional Home Services',
        theme_color: '#4338ca',
        background_color: '#ffffff',
        display: 'standalone',
        start_url: '/',
        icons: [
          {
            src: '/logo.png',
            sizes: '192x192',
            type: 'image/png',
          },
          {
            src: '/logo.png',
            sizes: '512x512',
            type: 'image/png',
          },
        ],
      },
      workbox: {
        cacheId: 'homecarex-auth-shell-v1',
        cleanupOutdatedCaches: true,
        clientsClaim: true,
        skipWaiting: true,
        // Precache HTML, scripts, styles, fonts, and required images (like /images/home-cleaning.jpg and /logo.png)
        globPatterns: ['**/*.{js,css,html,ico,png,svg,webp,woff2,jpg,jpeg}'],
        maximumFileSizeToCacheInBytes: 3 * 1024 * 1024, // 3MB limit
        // Offline App-Shell Navigation Fallback:
        // Serves cached index.html for SPA page navigation (/login, /register, /forgot-password)
        navigateFallback: '/index.html',
        // Crucial: NEVER intercept API routes with navigateFallback
        navigateFallbackDenylist: [/^\/api/],
        // Cache external Google Fonts stylesheets and font binaries for offline rendering
        runtimeCaching: [
          {
            urlPattern: /^https:\/\/fonts\.googleapis\.com\/.*/i,
            handler: 'StaleWhileRevalidate',
            options: {
              cacheName: 'homecarex-fonts-stylesheets',
              cacheableResponse: {
                statuses: [0, 200],
              },
            },
          },
          {
            urlPattern: /^https:\/\/fonts\.gstatic\.com\/.*/i,
            handler: 'CacheFirst',
            options: {
              cacheName: 'homecarex-fonts-webfonts',
              cacheableResponse: {
                statuses: [0, 200],
              },
              expiration: {
                maxEntries: 30,
                maxAgeSeconds: 60 * 60 * 24 * 365, // 1 year
              },
            },
          },
        ],
      },
    }),
  ],
  resolve: {
    alias: {
      '@': fileURLToPath(new URL('./src', import.meta.url)),
    },
  },
  server: {
    port: 3000,
    open: true,
    // Same-origin API calls in dev, so the refresh cookie works without CORS.
    proxy: {
      '/api': { target: 'http://localhost:5000', changeOrigin: true },
    },
  },
  preview: {
    port: 3000,
    proxy: {
      '/api': { target: 'http://localhost:5000', changeOrigin: true },
    },
  },
});
