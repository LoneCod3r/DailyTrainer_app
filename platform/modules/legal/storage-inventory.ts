// Inventory of every cookie and browser-storage item the application
// actually uses, found by inspecting the code and a running browser session
// (not copied from a template). The cookie settings dialog shows it, so
// visitors see what each category contains, and it decides what gets
// removed when a category is withdrawn.
//
// Cookies and localStorage are listed as different `kind`s on purpose:
// localStorage is not a cookie and must never be described as one.
//
// Each item's `category` is a classification decision for the owner and
// lawyer to confirm. The defaults follow the current draft Cookie Policy's
// approach: sign-in/session, security and choices the visitor explicitly
// made are "necessary". Nothing is in analytics or marketing, because the
// app runs no such scripts. ADD AN ENTRY HERE whenever a new cookie or
// storage key is introduced.
import type { DictKey } from '@/lib/i18n/dictionaries';
import { CONSENT_COOKIE, CONSENT_MAX_AGE_SECONDS, type CookieCategory } from './cookie-consent';

export type StorageKind = 'cookie' | 'localStorage';

export type StorageDuration =
  | { type: 'session' } // removed when the browser session ends
  | { type: 'days'; days: number }
  | { type: 'persistent' } // no expiry; kept until the visitor clears site data
  | { type: 'provider' }; // set and controlled by the third party

export interface StorageItem {
  // Stable identifier; also selects the i18n purpose text (cookieConsent.items.<id>).
  id: string;
  // Name as it appears in the browser. Production (HTTPS) names differ for
  // the NextAuth cookies; both are listed.
  names: string[];
  kind: StorageKind;
  provider: 'first-party' | 'google';
  category: CookieCategory;
  duration: StorageDuration;
  purposeKey: DictKey;
  // localStorage keys we can remove from our own origin when this item's
  // category is withdrawn. Cookies set by third parties on their own domain
  // can't be removed by us, so they have no cleanup.
  cleanup?: { localStorageKey?: string; localStoragePrefix?: string };
}

const DAYS_30 = 30;
const DAYS_365 = 365;

export function getStorageInventory({ recaptchaCategory }: { recaptchaCategory: CookieCategory }): StorageItem[] {
  return [
    // --- Cookies -----------------------------------------------------------
    {
      id: 'sessionToken',
      names: ['next-auth.session-token', '__Secure-next-auth.session-token'],
      kind: 'cookie',
      provider: 'first-party',
      category: 'necessary',
      duration: { type: 'days', days: DAYS_30 }, // lib/auth.ts session.maxAge
      purposeKey: 'cookieConsent.items.sessionToken',
    },
    {
      id: 'csrfToken',
      names: ['next-auth.csrf-token', '__Host-next-auth.csrf-token'],
      kind: 'cookie',
      provider: 'first-party',
      category: 'necessary',
      duration: { type: 'session' },
      purposeKey: 'cookieConsent.items.csrfToken',
    },
    {
      id: 'callbackUrl',
      names: ['next-auth.callback-url', '__Secure-next-auth.callback-url'],
      kind: 'cookie',
      provider: 'first-party',
      category: 'necessary',
      duration: { type: 'session' },
      purposeKey: 'cookieConsent.items.callbackUrl',
    },
    {
      id: 'locale',
      names: ['ptd_locale'],
      kind: 'cookie',
      provider: 'first-party',
      category: 'necessary',
      duration: { type: 'days', days: DAYS_365 }, // lib/i18n/LocaleProvider.tsx
      purposeKey: 'cookieConsent.items.locale',
    },
    {
      id: 'consent',
      names: [CONSENT_COOKIE],
      kind: 'cookie',
      provider: 'first-party',
      category: 'necessary',
      duration: { type: 'days', days: CONSENT_MAX_AGE_SECONDS / 86_400 },
      purposeKey: 'cookieConsent.items.consent',
    },
    {
      id: 'recaptchaCookie',
      names: ['_GRECAPTCHA'],
      kind: 'cookie',
      provider: 'google',
      category: recaptchaCategory,
      duration: { type: 'provider' },
      purposeKey: 'cookieConsent.items.recaptchaCookie',
    },
    // --- localStorage (not cookies) ----------------------------------------
    {
      id: 'theme',
      names: ['theme'],
      kind: 'localStorage',
      provider: 'first-party',
      category: 'necessary',
      duration: { type: 'persistent' },
      purposeKey: 'cookieConsent.items.theme',
    },
    {
      id: 'practiceProgress',
      names: ['ptd:completed:*', 'ptd:imported:*'],
      kind: 'localStorage',
      provider: 'first-party',
      category: 'necessary',
      duration: { type: 'persistent' },
      purposeKey: 'cookieConsent.items.practiceProgress',
    },
    {
      id: 'sidebarState',
      names: ['admin-sidebar-collapsed', 'moderation-sidebar-collapsed'],
      kind: 'localStorage',
      provider: 'first-party',
      category: 'necessary',
      duration: { type: 'persistent' },
      purposeKey: 'cookieConsent.items.sidebarState',
    },
    {
      id: 'sessionSync',
      names: ['nextauth.message'],
      kind: 'localStorage',
      provider: 'first-party',
      category: 'necessary',
      duration: { type: 'persistent' },
      purposeKey: 'cookieConsent.items.sessionSync',
    },
    {
      id: 'recaptchaStorage',
      names: ['_grecaptcha'],
      kind: 'localStorage',
      provider: 'google',
      category: recaptchaCategory,
      duration: { type: 'persistent' },
      purposeKey: 'cookieConsent.items.recaptchaStorage',
      cleanup: { localStorageKey: '_grecaptcha' },
    },
  ];
}
