'use client';

import { useEffect, useState } from 'react';
import { useT } from '@/lib/i18n/LocaleProvider';

declare global {
  interface Window {
    grecaptcha?: {
      ready: (cb: () => void) => void;
      execute: (siteKey: string, options: { action: string }) => Promise<string>;
    };
  }
}

const SCRIPT_SRC = 'https://www.google.com/recaptcha/api.js';
const ACTION = 'register';
let scriptLoadPromise: Promise<void> | null = null;

function loadRecaptchaScript(siteKey: string): Promise<void> {
  if (window.grecaptcha) return Promise.resolve();
  if (scriptLoadPromise) return scriptLoadPromise;

  scriptLoadPromise = new Promise((resolve, reject) => {
    const script = document.createElement('script');
    script.src = `${SCRIPT_SRC}?render=${siteKey}`;
    script.async = true;
    script.defer = true;
    script.onload = () => resolve();
    script.onerror = () => reject(new Error('Failed to load reCAPTCHA'));
    document.head.appendChild(script);
  });
  return scriptLoadPromise;
}

// Google reCAPTCHA v3 — invisible, score-based, no puzzle for legitimate
// visitors (see lib/recaptcha.ts for why v3 over v2, and how the resulting
// token is verified server-side). This component only ever produces an
// opaque token via `onVerify`; it never decides pass/fail itself.
//
// v3 tokens expire quickly (~2 minutes) and are meant to be single-use per
// action, so the parent form remounts this component (via a changing `key`)
// after a failed submit — see app/(auth)/register/page.tsx.
export function Recaptcha({ onVerify }: { onVerify: (token: string) => void }) {
  const t = useT();
  const [status, setStatus] = useState<'loading' | 'ready' | 'error'>('loading');

  useEffect(() => {
    const siteKey = process.env.NEXT_PUBLIC_RECAPTCHA_SITE_KEY;

    // No site key configured: local dev without a Google reCAPTCHA account.
    // Google publishes no universal "always passes" test key pair that
    // works on an unregistered domain, so there is no real widget to render
    // here — synthesize a placeholder token instead. The server-side
    // verifier (lib/recaptcha.ts) independently refuses to accept this as a
    // bypass in production (it requires RECAPTCHA_SECRET_KEY to be set
    // there), so this can't become a production hole.
    if (!siteKey) {
      setStatus('ready');
      onVerify('dev-mode-recaptcha-placeholder-token');
      return;
    }

    let cancelled = false;

    loadRecaptchaScript(siteKey)
      .then(() => {
        if (cancelled || !window.grecaptcha) return;
        window.grecaptcha.ready(() => {
          if (cancelled || !window.grecaptcha) return;
          window.grecaptcha
            .execute(siteKey, { action: ACTION })
            .then((token) => {
              if (cancelled) return;
              setStatus('ready');
              onVerify(token);
            })
            .catch(() => {
              if (!cancelled) setStatus('error');
            });
        });
      })
      .catch(() => {
        if (!cancelled) setStatus('error');
      });

    return () => {
      cancelled = true;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return (
    <p className="text-xs text-ink-500" aria-live="polite">
      {status === 'error' ? t('auth.recaptchaError') : t('auth.recaptchaNotice')}
    </p>
  );
}
