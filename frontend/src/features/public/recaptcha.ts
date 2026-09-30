const siteKey = import.meta.env.VITE_RECAPTCHA_SITE_KEY?.trim();

interface RecaptchaWidgetOptions {
  sitekey: string;
  callback: (token: string) => void;
  'expired-callback': () => void;
  'error-callback': () => void;
  theme?: 'light' | 'dark';
}

interface RecaptchaApi {
  ready: (callback: () => void) => void;
  render: (container: HTMLElement, options: RecaptchaWidgetOptions) => number;
  reset: (widgetId?: number) => void;
}

declare global {
  interface Window {
    grecaptcha?: RecaptchaApi;
  }
}

let scriptPromise: Promise<RecaptchaApi> | undefined;

export const isRecaptchaConfigured = Boolean(siteKey);

export const loadRecaptcha = (): Promise<RecaptchaApi> => {
  if (!siteKey) return Promise.reject(new Error('CAPTCHA is not configured. Please contact support.'));
  if (typeof window.grecaptcha?.render === 'function') return Promise.resolve(window.grecaptcha);
  if (scriptPromise) return scriptPromise;

  scriptPromise = new Promise<RecaptchaApi>((resolve, reject) => {
    const existingScript = document.querySelector<HTMLScriptElement>('script[data-homecarex-recaptcha]');
    const script = existingScript ?? document.createElement('script');
    const cleanup = () => {
      script.removeEventListener('load', onLoad);
      script.removeEventListener('error', onError);
      scriptPromise = undefined;
    };
    const onLoad = () => {
      const api = window.grecaptcha;
      if (!api) {
        cleanup();
        reject(new Error('reCAPTCHA checkbox could not be loaded. Please reload and try again.'));
        return;
      }
      api.ready(() => {
        if (typeof window.grecaptcha?.render !== 'function') {
          cleanup();
          reject(new Error('reCAPTCHA checkbox could not be loaded. Please reload and try again.'));
          return;
        }
        const readyApi = window.grecaptcha;
        cleanup();
        resolve(readyApi);
      });
    };
    const onError = () => {
      cleanup();
      reject(new Error('reCAPTCHA could not be loaded. Check your connection and try again.'));
    };
    script.addEventListener('load', onLoad, { once: true });
    script.addEventListener('error', onError, { once: true });
    if (!existingScript) {
      script.src = 'https://www.google.com/recaptcha/api.js?render=explicit';
      script.async = true;
      script.defer = true;
      script.dataset.homecarexRecaptcha = 'true';
      document.head.appendChild(script);
    } else if (window.grecaptcha) {
      onLoad();
    }
  });
  return scriptPromise;
};

export const getRecaptchaErrorMessage = (error: unknown): string => {
  if (error instanceof Error && error.message.startsWith('CAPTCHA')) return error.message;
  return 'CAPTCHA verification failed. Please try again.';
};
