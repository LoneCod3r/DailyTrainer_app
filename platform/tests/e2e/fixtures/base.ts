import { test as base, expect } from '@playwright/test';
import { consentCookie } from './consent-helpers';

// Most journeys aren't what's being tested when they're rendered in
// Bulgarian (the app's default locale) — pinning English here keeps
// assertions readable and deterministic. The dedicated localization spec
// imports straight from '@playwright/test' instead, since it exercises the
// locale switch itself. A stored cookie choice is pre-set for the same
// reason: the first-visit consent banner is covered by legal.spec.ts, and
// elsewhere it would only overlay the page under test.
export const test = base.extend({
  context: async ({ context, baseURL }, use) => {
    await context.addCookies([{ name: 'ptd_locale', value: 'en', url: baseURL }, consentCookie(baseURL!)]);
    await use(context);
  },
});

export { expect };
