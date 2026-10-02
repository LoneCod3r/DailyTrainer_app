'use client';

import { useEffect, useState } from 'react';
import { useLocale } from '@/lib/i18n/LocaleProvider';
import type { DictKey } from '@/lib/i18n/dictionaries';
import { CONSENT_CHANGE_EVENT, useLegal } from '@/components/legal/LegalProvider';
import { CookieSettingsButton } from '@/components/legal/CookieSettingsButton';
import { Button } from '@/components/ui';
import { hasCategoryConsent, type CookieCategory, type CookieConsent } from '@/modules/legal/cookie-consent';

declare global {
  interface Window {
    grecaptcha?: {
      ready: (cb: () => void) => void;
      execute: (siteKey: string, options: { action: string }) => Promise<string>;
    };
    ___grecaptcha_cfg?: unknown;
  }
}

const SCRIPT_SRC = 'https://www.google.com/recaptcha/api.js';
const ACTION = 'register';
let scriptLoadPromise: Promise<void> | null = null;
let scriptLoadLocale: string | null = null;
// Cookie category the loaded script depends on. Set only when that category is
// optional; see onConsentChange.
let scriptConsentCategory: CookieCategory | null = null;

// Google's api.js bootstraps once and no-ops on a second `<script>` load as
// long as `window.grecaptcha` (and its internal `___grecaptcha_cfg`
// registry) are still set — so simply appending a new script tag with a
// different `hl` does nothing once a badge is already up. To actually
// change the badge's language at runtime, or to stop it after consent is
// withdrawn, we remove that instance entirely: both of Google's scripts
// (api.js and the gstatic "release" script it injects), the badge with its
// iframe, and the globals Google uses to detect "already loaded". Removing the
// iframe also drops any token request still in flight. Without that, its
// response would recreate `_grecaptcha` in localStorage after it was removed.
function teardownRecaptcha() {
  document.querySelectorAll('script[src*="/recaptcha/"]').forEach((el) => el.remove());
  document.querySelectorAll('.grecaptcha-badge').forEach((el) => {
    // Google wraps the badge in an otherwise empty container on <body>.
    (el.parentElement && el.parentElement !== document.body ? el.parentElement : el).remove();
  });
  document.querySelectorAll('iframe[src*="/recaptcha/"]').forEach((el) => el.remove());
  delete window.grecaptcha;
  delete window.___grecaptcha_cfg;
  scriptLoadPromise = null;
  scriptLoadLocale = null;
  scriptConsentCategory = null;
  window.removeEventListener(CONSENT_CHANGE_EVENT, onConsentChange);
}

// The script outlives the registration form: navigating away (client-side)
// unmounts <Recaptcha> but leaves Google's code running. So the module itself
// listens for consent changes while a consent-gated script is loaded, and
// tears it down the moment its category is withdrawn, wherever the visitor is.
// LegalProvider dispatches this event synchronously right after removing the
// withdrawn category's storage, so nothing from Google runs in between.
function onConsentChange(event: Event) {
  const consent = (event as CustomEvent<CookieConsent>).detail;
  if (!scriptConsentCategory || hasCategoryConsent(consent, scriptConsentCategory)) return;
  teardownRecaptcha();
  try {
    localStorage.removeItem('_grecaptcha');
  } catch {
    // localStorage unavailable: nothing to remove.
  }
}

// Google renders its "protected by reCAPTCHA" badge in the language given
// by the script's `hl` param, falling back to the browser's locale (not the
// site's) when it's omitted — pass the app's current locale explicitly so
// the badge always matches the page it's shown on. Reloading for a *new*
// locale requires tearing down the previous instance first (see above); a
// remount at the *same* locale (e.g. retrying after a failed submit) keeps
// reusing the already-loaded script for a fast, network-free reload.
function loadRecaptchaScript(siteKey: string, hl: string, consentCategory: CookieCategory): Promise<void> {
  if (window.grecaptcha && scriptLoadLocale === hl) return Promise.resolve();
  if (scriptLoadPromise && scriptLoadLocale === hl) return scriptLoadPromise;

  if (scriptLoadLocale !== null) teardownRecaptcha();

  // 'necessary' (the default) can't be withdrawn, so nothing to listen for.
  if (consentCategory !== 'necessary') {
    scriptConsentCategory = consentCategory;
    window.addEventListener(CONSENT_CHANGE_EVENT, onConsentChange);
  }
  scriptLoadLocale = hl;
  scriptLoadPromise = new Promise((resolve, reject) => {
    const script = document.createElement('script');
    script.src = `${SCRIPT_SRC}?render=${siteKey}&hl=${hl}`;
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
//
// Consent: RECAPTCHA_CONSENT_CATEGORY (modules/legal/config.ts) decides
// whether Google's script may load straight away ('necessary', the default and
// the original behavior) or only after the visitor allows that cookie
// category. In the latter case the form explains why and offers an explicit
// "Allow and continue" button, so registration is never silently blocked.
export function Recaptcha({ onVerify }: { onVerify: (token: string) => void }) {
  const { locale, t } = useLocale();
  const { config, hasConsent, allowCategory } = useLegal();
  const consentCategory = config.recaptchaCategory;
  const allowed = hasConsent(consentCategory);
  const [status, setStatus] = useState<'loading' | 'ready' | 'error' | 'needs-consent'>('loading');

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

    if (!allowed) {
      // Not allowed (yet), or just withdrawn: make sure no Google script or
      // badge is left on the page, and drop any token it already produced.
      if (scriptLoadLocale !== null) teardownRecaptcha();
      setStatus('needs-consent');
      onVerify('');
      return;
    }

    setStatus('loading');
    let cancelled = false;

    loadRecaptchaScript(siteKey, locale, consentCategory)
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
  }, [locale, allowed]);

  if (status === 'needs-consent') {
    return (
      <div className="flex flex-col gap-2 rounded-xl border border-sand-200 p-3 text-xs text-ink-700" data-testid="recaptcha-consent">
        <p>
          {t('auth.recaptchaConsentNeeded', {
            category: t(`cookieConsent.categories.${consentCategory}` as DictKey),
          })}
        </p>
        <div className="flex flex-wrap items-center gap-3">
          <Button type="button" size="sm" variant="secondary" onClick={() => allowCategory(consentCategory)}>
            {t('auth.recaptchaConsentAllow')}
          </Button>
          <CookieSettingsButton className="font-medium text-link underline underline-offset-2" />
        </div>
      </div>
    );
  }

  return (
    <p className="text-xs text-ink-500" aria-live="polite">
      {status === 'error' ? t('auth.recaptchaError') : t('auth.recaptchaNotice')}
    </p>
  );
}
