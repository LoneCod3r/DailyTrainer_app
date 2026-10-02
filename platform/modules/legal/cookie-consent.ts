// Cookie-consent primitives shared by the server (root layout reads the
// stored choice so the banner never flashes) and the client (banner,
// settings dialog). No server-only or browser-only dependencies.

export type CookieCategory = 'necessary' | 'preferences' | 'analytics' | 'marketing';
export type OptionalCookieCategory = Exclude<CookieCategory, 'necessary'>;

export const COOKIE_CATEGORIES: CookieCategory[] = ['necessary', 'preferences', 'analytics', 'marketing'];
export const OPTIONAL_COOKIE_CATEGORIES: OptionalCookieCategory[] = ['preferences', 'analytics', 'marketing'];

export function isCookieCategory(value: unknown): value is CookieCategory {
  return typeof value === 'string' && (COOKIE_CATEGORIES as string[]).includes(value);
}

// The visitor's choice is itself kept in a first-party cookie. Remembering a
// consent decision is strictly necessary, and a cookie (unlike localStorage)
// can be read on the server, so the banner's initial state is right in the
// first HTML response.
export const CONSENT_COOKIE = 'kw_cookie_consent';
// How long a choice is remembered before the visitor is asked again (180 days).
export const CONSENT_MAX_AGE_SECONDS = 180 * 24 * 60 * 60;
// Bump this when the stored shape changes; older values are then ignored and
// the visitor is asked again.
const CONSENT_SCHEMA_VERSION = 1;

export type CookieChoices = Record<OptionalCookieCategory, boolean>;

export interface CookieConsent {
  // The Cookie Policy version the choice was made against. If it no longer
  // matches the current version, the stored choice is ignored and the
  // visitor is asked again.
  policyVersion: string;
  // ISO timestamp of when the choice was made.
  decidedAt: string;
  choices: CookieChoices;
}

// Nothing optional is ever pre-selected.
export const NO_OPTIONAL_CONSENT: CookieChoices = { preferences: false, analytics: false, marketing: false };
export const ALL_OPTIONAL_CONSENT: CookieChoices = { preferences: true, analytics: true, marketing: true };

export function hasCategoryConsent(consent: CookieConsent | null, category: CookieCategory): boolean {
  if (category === 'necessary') return true;
  return consent?.choices[category] === true;
}

export function createConsent(choices: CookieChoices, policyVersion: string, now: Date = new Date()): CookieConsent {
  return {
    policyVersion,
    decidedAt: now.toISOString(),
    // Copy only known keys, as strict booleans.
    choices: {
      preferences: choices.preferences === true,
      analytics: choices.analytics === true,
      marketing: choices.marketing === true,
    },
  };
}

// Compact cookie value: {"s":1,"p":"<policy>","t":"<iso>","c":{"preferences":0,...}}
export function serializeConsent(consent: CookieConsent): string {
  return encodeURIComponent(
    JSON.stringify({
      s: CONSENT_SCHEMA_VERSION,
      p: consent.policyVersion,
      t: consent.decidedAt,
      c: Object.fromEntries(OPTIONAL_COOKIE_CATEGORIES.map((k) => [k, consent.choices[k] ? 1 : 0])),
    }),
  );
}

// Returns null for a missing, malformed, outdated-schema, or
// different-policy-version value. Each of these counts as "no valid choice
// yet", so the visitor is asked again. A choice is never guessed from a
// value we can't read.
export function parseConsent(raw: string | undefined | null, currentPolicyVersion: string): CookieConsent | null {
  if (!raw) return null;
  try {
    const data = JSON.parse(decodeURIComponent(raw)) as unknown;
    if (!data || typeof data !== 'object') return null;
    const { s, p, t, c } = data as Record<string, unknown>;
    if (s !== CONSENT_SCHEMA_VERSION || typeof p !== 'string' || typeof t !== 'string') return null;
    if (p !== currentPolicyVersion) return null;
    if (Number.isNaN(Date.parse(t)) || !c || typeof c !== 'object') return null;
    const flags = c as Record<string, unknown>;
    const choices = Object.fromEntries(
      OPTIONAL_COOKIE_CATEGORIES.map((k) => [k, flags[k] === 1 || flags[k] === true]),
    ) as CookieChoices;
    return { policyVersion: p, decidedAt: t, choices };
  } catch {
    return null;
  }
}
