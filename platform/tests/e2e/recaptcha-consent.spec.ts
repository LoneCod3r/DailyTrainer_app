import type { Page } from '@playwright/test';
import { test, expect } from './fixtures/base';
import { solveMathChallenge, ensureMinHumanFillTime } from './fixtures/auth-helpers';
import { NO_RECAPTCHA, STUB_EXECUTE_DELAY_MS, recaptchaFootprint, stubRecaptcha } from './fixtures/recaptcha-stub';
import { prisma } from '@/lib/prisma';

// reCAPTCHA lifecycle vs. cookie consent (components/auth/Recaptcha.tsx).
//
// Which describe block runs depends on the server's RECAPTCHA_CONSENT_CATEGORY,
// a server setting a spec can't switch:
//   - the default ('necessary'): the "default configuration" block runs;
//   - an optional category, e.g.
//       RECAPTCHA_CONSENT_CATEGORY=preferences RECAPTCHA_SECRET_KEY="" npm run dev
//     : the "consent-gated configuration" block runs (the audit scenario).
// The other block skips itself. The base fixture stores a "necessary only"
// cookie choice, so in gated mode the form starts behind the consent notice.
// Google is replaced by fixtures/recaptcha-stub.ts unless E2E_REAL_RECAPTCHA=1.

async function openRegister(page: Page): Promise<'gated' | 'necessary'> {
  await stubRecaptcha(page);
  await page.goto('/register');
  // Both modes first render the plain "protected by reCAPTCHA" notice, so wait
  // for a signal only one mode produces: the consent gate, or the loaded script.
  const gate = page.getByTestId('recaptcha-consent');
  await expect
    .poll(async () => (await gate.isVisible()) || (await page.evaluate(() => typeof window.grecaptcha !== 'undefined')), {
      timeout: 20_000,
    })
    .toBe(true);
  return (await gate.isVisible()) ? 'gated' : 'necessary';
}

// Client-side navigation through a footer link, proven not to reload the
// document: the marker set on `window` must survive.
async function clientNavigateToCookiePolicy(page: Page) {
  await page.evaluate(() => ((window as unknown as { __noReload: boolean }).__noReload = true));
  await page.getByRole('contentinfo').getByRole('link', { name: 'Cookie Policy' }).click();
  await expect(page).toHaveURL('/cookies');
}

async function assertNoReload(page: Page) {
  expect(await page.evaluate(() => (window as unknown as { __noReload?: boolean }).__noReload)).toBe(true);
}

async function rejectOptionalFromCookiePolicy(page: Page) {
  await page.getByRole('contentinfo').getByRole('button', { name: 'Cookie settings' }).click();
  await page.getByRole('dialog').getByRole('button', { name: 'Reject optional' }).click();
}

const loaded = (page: Page) => expect.poll(() => recaptchaFootprint(page).then((f) => f.grecaptcha && f.badge > 0 && f.scripts > 0), { timeout: 20_000 });

test.describe('reCAPTCHA consent — consent-gated configuration', () => {
  test.beforeEach(async ({ page }) => {
    test.skip((await openRegister(page)) !== 'gated', 'server runs with RECAPTCHA_CONSENT_CATEGORY=necessary (the default)');
  });

  test('nothing from Google is on the page before consent; "Allow and continue" loads it', async ({ page }) => {
    expect(await recaptchaFootprint(page)).toEqual(NO_RECAPTCHA);
    await expect(page.getByRole('button', { name: 'Create account' })).toBeDisabled();

    await page.getByRole('button', { name: 'Allow and continue' }).click();
    await loaded(page).toBe(true);
    await expect(page.getByRole('button', { name: 'Create account' })).toBeEnabled({ timeout: 20_000 });
  });

  test('withdrawing consent on another page, without a reload, removes the integration and nothing reappears', async ({
    page,
  }) => {
    // The exact audit scenario: allow, move on while Google's token request is
    // still in flight, then reject optional cookies on /cookies.
    await page.getByRole('button', { name: 'Allow and continue' }).click();
    await loaded(page).toBe(true);
    await clientNavigateToCookiePolicy(page);
    await rejectOptionalFromCookiePolicy(page);

    const immediately = await recaptchaFootprint(page);
    // Long enough for any request that was in flight to have completed.
    await page.waitForTimeout(STUB_EXECUTE_DELAY_MS + 2000);
    const later = await recaptchaFootprint(page);
    expect({ immediately, later }).toEqual({ immediately: NO_RECAPTCHA, later: NO_RECAPTCHA });
    await assertNoReload(page);
  });

  test('granting consent again restores the integration and registration completes', async ({ page }) => {
    await page.getByRole('button', { name: 'Allow and continue' }).click();
    await loaded(page).toBe(true);
    await clientNavigateToCookiePolicy(page);
    await rejectOptionalFromCookiePolicy(page);
    expect(await recaptchaFootprint(page)).toEqual(NO_RECAPTCHA);

    // Back to the form client-side, still the same document.
    await page.getByRole('link', { name: 'Join' }).first().click();
    await expect(page).toHaveURL('/register');
    await assertNoReload(page);
    await expect(page.getByTestId('recaptcha-consent')).toBeVisible();
    expect(await recaptchaFootprint(page)).toEqual(NO_RECAPTCHA);

    await page.getByRole('button', { name: 'Allow and continue' }).click();
    await loaded(page).toBe(true);
    await expect(page.getByRole('button', { name: 'Create account' })).toBeEnabled({ timeout: 20_000 });

    const email = `e2e.recaptcha-consent.${Date.now()}@example.dev`;
    try {
      await page.getByLabel('Name').fill('reCAPTCHA Consent User');
      await page.getByLabel('Email').fill(email);
      await page.getByLabel('Password', { exact: true }).fill('PlaywrightPass123!');
      await solveMathChallenge(page);
      await ensureMinHumanFillTime(page);
      await page.getByRole('button', { name: 'Create account' }).click();
      await expect(page.getByRole('heading', { name: 'Check your email' })).toBeVisible({ timeout: 20_000 });
    } finally {
      await prisma.user.delete({ where: { email } }).catch(() => undefined);
    }
  });
});

test.describe('reCAPTCHA consent — default configuration (necessary)', () => {
  test.beforeEach(async ({ page }) => {
    test.skip((await openRegister(page)) !== 'necessary', 'server runs with an optional RECAPTCHA_CONSENT_CATEGORY');
  });

  test('loads without asking, and rejecting optional cookies elsewhere leaves it working', async ({ page }) => {
    await loaded(page).toBe(true);
    await expect(page.getByRole('button', { name: 'Create account' })).toBeEnabled({ timeout: 20_000 });

    await clientNavigateToCookiePolicy(page);
    await rejectOptionalFromCookiePolicy(page);
    // Unchanged default: reCAPTCHA is "necessary", so withdrawing optional
    // categories doesn't touch it.
    expect((await recaptchaFootprint(page)).grecaptcha).toBe(true);

    await page.getByRole('link', { name: 'Join' }).first().click();
    await expect(page).toHaveURL('/register');
    await assertNoReload(page);
    await expect(page.getByTestId('recaptcha-consent')).toHaveCount(0);
    await expect(page.getByRole('button', { name: 'Create account' })).toBeEnabled({ timeout: 20_000 });
  });
});
