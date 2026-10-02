import { LEGAL_DOCUMENTS } from '@/modules/legal/documents';
import {
  CONSENT_COOKIE,
  NO_OPTIONAL_CONSENT,
  createConsent,
  parseConsent,
  serializeConsent,
} from '@/modules/legal/cookie-consent';

// A stored "necessary only" choice for the current Cookie Policy version.
// Journeys that aren't about cookie consent start with it, so the
// first-visit banner (a fixed overlay at the bottom of the viewport) never
// covers what they click. legal.spec.ts deliberately starts without it.
export function consentCookie(baseURL: string) {
  return {
    name: CONSENT_COOKIE,
    value: serializeConsent(createConsent(NO_OPTIONAL_CONSENT, LEGAL_DOCUMENTS.cookies.version)),
    url: baseURL,
  };
}

export function readConsent(cookies: { name: string; value: string }[]) {
  const raw = cookies.find((c) => c.name === CONSENT_COOKIE)?.value;
  return parseConsent(raw, LEGAL_DOCUMENTS.cookies.version);
}

export { CONSENT_COOKIE };
