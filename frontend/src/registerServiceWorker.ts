import { registerSW } from 'virtual:pwa-register';

let isRegistered = false;

/**
 * Registers the HomeCareX Service Worker once at the application entry point.
 * Enables offline loading of the application shell (/login, /register, /forgot-password).
 */
export function registerServiceWorker(): void {
  if (isRegistered) {
    return;
  }

  if (typeof window === 'undefined' || !('serviceWorker' in navigator)) {
    return;
  }

  isRegistered = true;

  try {
    registerSW({
      immediate: true,
      onRegisteredSW(swScriptUrl, registration) {
        if (registration) {
          console.info('[HomeCareX SW] Service Worker registered at', swScriptUrl, 'scope:', registration.scope);
        }
      },
      onRegisterError(error) {
        console.warn('[HomeCareX SW] Service Worker registration failed:', error);
      },
    });
  } catch (err) {
    console.warn('[HomeCareX SW] Unable to register Service Worker:', err);
  }
}
