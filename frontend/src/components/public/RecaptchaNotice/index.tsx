import React, { useEffect, useRef, useState } from 'react';
import { AlertCircle, LoaderCircle, ShieldCheck } from 'lucide-react';
import { isRecaptchaConfigured, loadRecaptcha } from '@/features/public/recaptcha';

type CaptchaState = 'loading' | 'ready' | 'verified' | 'unconfigured' | 'unavailable';

interface RecaptchaCheckboxProps {
  onTokenChange: (token: string | null, reason?: 'expired' | 'error') => void;
  resetKey: number;
}

const RecaptchaNotice: React.FC<RecaptchaCheckboxProps> = ({ onTokenChange, resetKey }) => {
  const hostRef = useRef<HTMLDivElement>(null);
  const [state, setState] = useState<CaptchaState>(isRecaptchaConfigured ? 'loading' : 'unconfigured');

  useEffect(() => {
    if (!isRecaptchaConfigured) {
      setState('unconfigured');
      onTokenChange(null);
      return;
    }
    let active = true;
    let widgetId: number | undefined;
    let widgetContainer: HTMLDivElement | undefined;
    onTokenChange(null);
    setState('loading');

    void loadRecaptcha().then((api) => {
      if (!active || !hostRef.current) return;
      try {
        widgetContainer = document.createElement('div');
        hostRef.current.replaceChildren(widgetContainer);
        widgetId = api.render(widgetContainer, {
          sitekey: import.meta.env.VITE_RECAPTCHA_SITE_KEY?.trim() ?? '',
          theme: 'light',
          callback: (token) => {
            if (!active) return;
            onTokenChange(token);
            setState('verified');
          },
          'expired-callback': () => {
            if (!active) return;
            onTokenChange(null, 'expired');
            if (widgetId !== undefined) api.reset(widgetId);
            setState('ready');
          },
          'error-callback': () => {
            if (!active) return;
            onTokenChange(null, 'error');
            setState('unavailable');
          },
        });
        setState('ready');
      } catch (error) {
        console.error('Unable to render the reCAPTCHA checkbox.', error);
        if (active) setState('unavailable');
      }
    }).catch((error: unknown) => {
      console.error('Unable to load reCAPTCHA.', error);
      if (active) setState('unavailable');
    });

    return () => {
      active = false;
      onTokenChange(null);
      if (widgetId !== undefined && window.grecaptcha?.reset) window.grecaptcha.reset(widgetId);
      widgetContainer?.remove();
    };
  }, [onTokenChange, resetKey]);

  return (
    <div className={`recaptcha-notice recaptcha-notice--${state}`} aria-live="polite">
      <span className="recaptcha-notice__icon" aria-hidden="true">
        {state === 'loading' ? <LoaderCircle size={16} className="animate-spin" /> : state === 'unavailable' || state === 'unconfigured' ? <AlertCircle size={16} /> : <ShieldCheck size={17} />}
      </span>
      <span className="recaptcha-notice__copy">
        <strong>{state === 'unconfigured' ? 'reCAPTCHA setup required' : state === 'unavailable' ? 'CAPTCHA is unavailable' : state === 'verified' ? 'Security check complete' : 'Complete the security check'}</strong>
        <small>
          {state === 'unconfigured'
            ? 'Add the reCAPTCHA v2 checkbox site key to frontend/.env and restart the frontend.'
            : state === 'unavailable'
              ? 'Google rejected or could not reach this key. Confirm it is a v2 Checkbox key and allow this hostname.'
              : state === 'verified' ? 'You can submit the form now.' : 'Select the checkbox to confirm you are human.'}
        </small>
      </span>
      <div ref={hostRef} className="recaptcha-notice__widget" />
      <span className="recaptcha-notice__links">
        <a href="https://policies.google.com/privacy" target="_blank" rel="noreferrer">Privacy</a>
        <span aria-hidden="true">·</span>
        <a href="https://policies.google.com/terms" target="_blank" rel="noreferrer">Terms</a>
      </span>
    </div>
  );
};

export default RecaptchaNotice;
