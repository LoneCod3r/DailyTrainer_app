'use client';

import { createContext, useCallback, useContext, useMemo, useState, type ReactNode } from 'react';
import type { PublicLegalConfig } from '@/modules/legal/legal.service';
import {
  ALL_OPTIONAL_CONSENT,
  CONSENT_COOKIE,
  CONSENT_MAX_AGE_SECONDS,
  NO_OPTIONAL_CONSENT,
  createConsent,
  hasCategoryConsent,
  serializeConsent,
  type CookieCategory,
  type CookieChoices,
  type CookieConsent,
} from '@/modules/legal/cookie-consent';
import { getStorageInventory } from '@/modules/legal/storage-inventory';
import { useT } from '@/lib/i18n/LocaleProvider';
import { CookieBanner } from './CookieBanner';
import { CookieSettingsDialog } from './CookieSettingsDialog';

// Fired on window after every saved choice, for code outside React that
// needs to react to consent changes, e.g. a future analytics loader.
export const CONSENT_CHANGE_EVENT = 'kw:cookie-consent-change';

type LegalContextValue = {
  config: PublicLegalConfig;
  // null until the visitor has made a valid choice for the current Cookie Policy version.
  consent: CookieConsent | null;
  hasConsent: (category: CookieCategory) => boolean;
  saveChoices: (choices: CookieChoices) => void;
  acceptAll: () => void;
  rejectOptional: () => void;
  // Allows one category on top of the current choice, e.g. "Allow and
  // continue" for reCAPTCHA on the registration form.
  allowCategory: (category: CookieCategory) => void;
  settingsOpen: boolean;
  openSettings: () => void;
  closeSettings: () => void;
};

const LegalContext = createContext<LegalContextValue | null>(null);

function writeConsentCookie(consent: CookieConsent) {
  const secure = window.location.protocol === 'https:' ? '; Secure' : '';
  document.cookie = `${CONSENT_COOKIE}=${serializeConsent(consent)}; path=/; max-age=${CONSENT_MAX_AGE_SECONDS}; SameSite=Lax${secure}`;
}

// Removes first-party browser storage that belongs to a category the visitor
// has just withdrawn. Third-party cookies on another domain (e.g. Google's
// `_GRECAPTCHA`) can't be removed from here. Not loading their script any
// more is what stops them being refreshed.
function cleanupWithdrawn(config: PublicLegalConfig, consent: CookieConsent) {
  for (const item of getStorageInventory({ recaptchaCategory: config.recaptchaCategory })) {
    if (!item.cleanup || hasCategoryConsent(consent, item.category)) continue;
    try {
      if (item.cleanup.localStorageKey) localStorage.removeItem(item.cleanup.localStorageKey);
      if (item.cleanup.localStoragePrefix) {
        Object.keys(localStorage)
          .filter((k) => k.startsWith(item.cleanup!.localStoragePrefix!))
          .forEach((k) => localStorage.removeItem(k));
      }
    } catch {
      // localStorage unavailable (private mode, etc.): nothing to remove.
    }
  }
}

// The config is computed on the server per request (root layout), and so is
// `initialConsent`, parsed from the consent cookie. The banner's
// shown/hidden state is therefore already right in the server-rendered HTML,
// with no flash after hydration.
export function LegalProvider({
  config,
  initialConsent,
  children,
}: {
  config: PublicLegalConfig;
  initialConsent: CookieConsent | null;
  children: ReactNode;
}) {
  const t = useT();
  const [consent, setConsent] = useState<CookieConsent | null>(initialConsent);
  const [settingsOpen, setSettingsOpen] = useState(false);
  const [announcement, setAnnouncement] = useState('');

  const saveChoices = useCallback(
    (choices: CookieChoices) => {
      const next = createConsent(choices, config.cookiePolicyVersion);
      writeConsentCookie(next);
      cleanupWithdrawn(config, next);
      setConsent(next);
      setSettingsOpen(false);
      setAnnouncement(t('cookieConsent.saved'));
      window.dispatchEvent(new CustomEvent(CONSENT_CHANGE_EVENT, { detail: next }));
    },
    [config, t],
  );

  const value = useMemo<LegalContextValue>(
    () => ({
      config,
      consent,
      hasConsent: (category) => hasCategoryConsent(consent, category),
      saveChoices,
      acceptAll: () => saveChoices(ALL_OPTIONAL_CONSENT),
      rejectOptional: () => saveChoices(NO_OPTIONAL_CONSENT),
      allowCategory: (category) => {
        if (category === 'necessary') return;
        saveChoices({ ...(consent?.choices ?? NO_OPTIONAL_CONSENT), [category]: true });
      },
      settingsOpen,
      openSettings: () => setSettingsOpen(true),
      closeSettings: () => setSettingsOpen(false),
    }),
    [config, consent, saveChoices, settingsOpen],
  );

  return (
    <LegalContext.Provider value={value}>
      {children}
      {consent === null && !settingsOpen && <CookieBanner />}
      <CookieSettingsDialog />
      <p className="sr-only" aria-live="polite">
        {announcement}
      </p>
    </LegalContext.Provider>
  );
}

export function useLegal() {
  const ctx = useContext(LegalContext);
  if (!ctx) throw new Error('useLegal must be used within LegalProvider');
  return ctx;
}
