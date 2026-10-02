import { describe, it, expect } from 'vitest';
import {
  ALL_OPTIONAL_CONSENT,
  NO_OPTIONAL_CONSENT,
  createConsent,
  hasCategoryConsent,
  parseConsent,
  serializeConsent,
} from '@/modules/legal/cookie-consent';
import { getStorageInventory } from '@/modules/legal/storage-inventory';

const NOW = new Date('2026-10-02T12:00:00.000Z');

describe('cookie consent value', () => {
  it('has no optional category pre-selected by default', () => {
    expect(NO_OPTIONAL_CONSENT).toEqual({ preferences: false, analytics: false, marketing: false });
  });

  it('round-trips through the cookie value', () => {
    const consent = createConsent({ preferences: true, analytics: false, marketing: false }, '1.0', NOW);
    expect(parseConsent(serializeConsent(consent), '1.0')).toEqual({
      policyVersion: '1.0',
      decidedAt: NOW.toISOString(),
      choices: { preferences: true, analytics: false, marketing: false },
    });
  });

  it('treats a choice made for another Cookie Policy version as no choice (asks again)', () => {
    const consent = createConsent(ALL_OPTIONAL_CONSENT, '1.0', NOW);
    expect(parseConsent(serializeConsent(consent), '1.1')).toBeNull();
  });

  it.each([
    ['missing', undefined],
    ['empty', ''],
    ['not JSON', 'garbage'],
    ['wrong schema', encodeURIComponent(JSON.stringify({ s: 99, p: '1.0', t: NOW.toISOString(), c: {} }))],
    ['bad timestamp', encodeURIComponent(JSON.stringify({ s: 1, p: '1.0', t: 'nope', c: {} }))],
  ])('ignores a %s cookie value instead of guessing', (_label, raw) => {
    expect(parseConsent(raw, '1.0')).toBeNull();
  });

  it('only grants a category on an explicit true/1 flag', () => {
    const raw = encodeURIComponent(
      JSON.stringify({ s: 1, p: '1.0', t: NOW.toISOString(), c: { preferences: 'yes', analytics: 1, marketing: true } }),
    );
    expect(parseConsent(raw, '1.0')?.choices).toEqual({ preferences: false, analytics: true, marketing: true });
  });

  it('always grants "necessary" and nothing optional without a choice', () => {
    expect(hasCategoryConsent(null, 'necessary')).toBe(true);
    expect(hasCategoryConsent(null, 'preferences')).toBe(false);
    expect(hasCategoryConsent(null, 'analytics')).toBe(false);
    expect(hasCategoryConsent(null, 'marketing')).toBe(false);
  });
});

describe('storage inventory', () => {
  const inventory = getStorageInventory({ recaptchaCategory: 'necessary' });
  const byName = (name: string) => inventory.find((i) => i.names.includes(name));

  it('lists the cookies the app actually sets', () => {
    for (const name of ['next-auth.session-token', 'next-auth.csrf-token', 'next-auth.callback-url', 'ptd_locale', 'kw_cookie_consent', '_GRECAPTCHA']) {
      expect(byName(name)?.kind).toBe('cookie');
    }
  });

  it('lists localStorage as localStorage, never as a cookie', () => {
    for (const name of ['theme', 'ptd:completed:*', 'admin-sidebar-collapsed', 'moderation-sidebar-collapsed', 'nextauth.message', '_grecaptcha']) {
      expect(byName(name)?.kind).toBe('localStorage');
    }
  });

  it('has nothing in analytics or marketing (no such scripts exist)', () => {
    expect(inventory.filter((i) => i.category === 'analytics' || i.category === 'marketing')).toEqual([]);
  });

  it('puts both reCAPTCHA items in the configured category', () => {
    const configured = getStorageInventory({ recaptchaCategory: 'preferences' });
    expect(configured.filter((i) => i.provider === 'google').map((i) => i.category)).toEqual(['preferences', 'preferences']);
  });
});
