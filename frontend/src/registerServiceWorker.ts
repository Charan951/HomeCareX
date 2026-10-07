let isRegistered = false;

/**
 * PWA Service Worker registration is disabled because
 * vite-plugin-pwa is not installed in this project.
 */
export function registerServiceWorker(): void {
  if (isRegistered) {
    return;
  }

  isRegistered = true;
}