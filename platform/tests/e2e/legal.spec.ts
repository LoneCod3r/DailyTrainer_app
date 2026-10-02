import AxeBuilder from '@axe-core/playwright';
import type { BrowserContext, Page } from '@playwright/test';
import { test, expect } from './fixtures/base';
import { CONSENT_COOKIE, readConsent } from './fixtures/consent-helpers';
import { prisma } from '@/lib/prisma';
import { LEGAL_DOCUMENTS } from '@/modules/legal/documents';
import { serializeConsent, createConsent, ALL_OPTIONAL_CONSENT } from '@/modules/legal/cookie-consent';

// Legal pages, footer, cookie consent and registration consent, as they
// behave in the CURRENT state: Terms/Privacy/Cookie Policy are unapproved
// drafts (modules/legal/documents.ts) and LEGAL_DOCUMENTS_PUBLISHED is off.
// The activation path itself (published documents, mandatory acceptance,
// recorded versions) is covered by unit tests (tests/legal-documents.test.ts,
// tests/auth-service.test.ts), because it needs approved content this
// repository deliberately doesn't contain.

const PAGES = [
  { path: '/terms', en: 'Terms & Conditions', bg: 'Общи условия' },
  { path: '/privacy', en: 'Privacy Policy', bg: 'Политика за поверителност' },
  { path: '/cookies', en: 'Cookie Policy', bg: 'Политика за бисквитките' },
];

// Text that would mean draft wording leaked onto a public page.
const DRAFT_MARKERS = [/DRAFT/, /ЧЕРНОВА/, /\[LEGAL ENTITY NAME\]/, /\[ИМЕ НА ЮРИДИЧЕСКОТО ЛИЦЕ\]/, /REQUIRES LEGAL REVIEW/];

async function withoutStoredConsent(context: BrowserContext) {
  await context.clearCookies({ name: CONSENT_COOKIE });
}

function banner(page: Page) {
  return page.getByRole('region', { name: 'Cookie consent' });
}

function settingsDialog(page: Page) {
  return page.getByRole('dialog', { name: 'Cookie settings' });
}

test.describe('Legal pages', () => {
  for (const { path, en } of PAGES) {
    test(`${path} renders in English as "not yet published", without draft text, and is not indexable`, async ({ page }) => {
      const res = await page.goto(path);
      expect(res?.status()).toBe(200);
      await expect(page.getByRole('heading', { level: 1, name: en })).toBeVisible();
      await expect(page.getByTestId('legal-document-unpublished')).toContainText('Not yet published');
      await expect(page.getByTestId('legal-document-content')).toHaveCount(0);
      await expect(page.locator('meta[name="robots"]')).toHaveAttribute('content', /noindex/);
      const text = await page.locator('main').innerText();
      for (const marker of DRAFT_MARKERS) expect(text).not.toMatch(marker);
    });
  }

  test('all three pages render in Bulgarian', async ({ page, context, baseURL }) => {
    await context.addCookies([{ name: 'ptd_locale', value: 'bg', url: baseURL! }]);
    for (const { path, bg } of PAGES) {
      await page.goto(path);
      await expect(page.getByRole('heading', { level: 1, name: bg })).toBeVisible();
      await expect(page.getByTestId('legal-document-unpublished')).toContainText('Все още не е публикуван');
    }
  });
});

test.describe('Footer legal links', () => {
  for (const start of ['/', '/practices', '/login', '/register']) {
    test(`footer on ${start} links to Terms, Privacy and Cookie Policy`, async ({ page }) => {
      await page.goto(start);
      const nav = page.getByRole('contentinfo').getByRole('navigation', { name: 'Legal' });
      for (const { path, en } of PAGES) {
        await expect(nav.getByRole('link', { name: en })).toHaveAttribute('href', path);
      }
      await expect(nav.getByRole('button', { name: 'Cookie settings' })).toBeVisible();
    });
  }

  test('footer links navigate to each page', async ({ page }) => {
    for (const { path, en } of PAGES) {
      await page.goto('/');
      await page.getByRole('contentinfo').getByRole('link', { name: en }).click();
      await expect(page).toHaveURL(path);
      await expect(page.getByRole('heading', { level: 1, name: en })).toBeVisible();
    }
  });

  test('footer is translated in Bulgarian', async ({ page, context, baseURL }) => {
    await context.addCookies([{ name: 'ptd_locale', value: 'bg', url: baseURL! }]);
    await page.goto('/');
    const nav = page.getByRole('contentinfo').getByRole('navigation', { name: 'Правна информация' });
    for (const { path, bg } of PAGES) await expect(nav.getByRole('link', { name: bg })).toHaveAttribute('href', path);
    await expect(nav.getByRole('button', { name: 'Настройки на бисквитките' })).toBeVisible();
  });
});

test.describe('Cookie consent banner', () => {
  test.beforeEach(async ({ context }) => {
    await withoutStoredConsent(context);
  });

  test('@smoke shows on a first visit with equal Accept/Reject choices and a Cookie Policy link', async ({ page }) => {
    await page.goto('/');
    const region = banner(page);
    await expect(region).toBeVisible();
    await expect(region.getByRole('button', { name: 'Accept all' })).toBeVisible();
    await expect(region.getByRole('button', { name: 'Reject optional' })).toBeVisible();
    await expect(region.getByRole('button', { name: 'Customize' })).toBeVisible();
    await expect(region.getByRole('link', { name: 'Cookie Policy' })).toHaveAttribute('href', '/cookies');
    // Same visual weight: rejecting is never styled as the lesser option.
    const acceptClass = await region.getByRole('button', { name: 'Accept all' }).getAttribute('class');
    const rejectClass = await region.getByRole('button', { name: 'Reject optional' }).getAttribute('class');
    expect(rejectClass).toBe(acceptClass);
  });

  test('is translated in Bulgarian', async ({ page, context, baseURL }) => {
    await context.addCookies([{ name: 'ptd_locale', value: 'bg', url: baseURL! }]);
    await page.goto('/');
    const region = page.getByRole('region', { name: 'Съгласие за бисквитки' });
    await expect(region.getByRole('button', { name: 'Приемам всички' })).toBeVisible();
    await expect(region.getByRole('button', { name: 'Отказвам незадължителните' })).toBeVisible();
    await expect(region.getByRole('link', { name: 'Политика за бисквитките' })).toBeVisible();
  });

  test('"Reject optional" stores necessary-only, hides the banner, and the choice persists across reloads and pages', async ({
    page,
    context,
  }) => {
    await page.goto('/');
    await banner(page).getByRole('button', { name: 'Reject optional' }).click();
    await expect(banner(page)).toHaveCount(0);

    const consent = readConsent(await context.cookies());
    expect(consent?.choices).toEqual({ preferences: false, analytics: false, marketing: false });
    expect(consent?.policyVersion).toBe(LEGAL_DOCUMENTS.cookies.version);
    expect(Date.parse(consent!.decidedAt)).toBeGreaterThan(Date.now() - 60_000);

    await page.reload();
    await expect(banner(page)).toHaveCount(0);
    await page.goto('/practices');
    await expect(banner(page)).toHaveCount(0);
  });

  test('"Accept all" stores every optional category', async ({ page, context }) => {
    await page.goto('/');
    await banner(page).getByRole('button', { name: 'Accept all' }).click();
    await expect(banner(page)).toHaveCount(0);
    expect(readConsent(await context.cookies())?.choices).toEqual({ preferences: true, analytics: true, marketing: true });
  });

  test('a choice made under another Cookie Policy version is ignored and the banner asks again', async ({
    page,
    context,
    baseURL,
  }) => {
    await context.addCookies([
      { name: CONSENT_COOKIE, value: serializeConsent(createConsent(ALL_OPTIONAL_CONSENT, 'an-older-version')), url: baseURL! },
    ]);
    await page.goto('/');
    await expect(banner(page)).toBeVisible();
  });
});

test.describe('Cookie settings', () => {
  test.beforeEach(async ({ context }) => {
    await withoutStoredConsent(context);
  });

  test('nothing optional is pre-checked; necessary is always on; a custom choice is saved', async ({ page, context }) => {
    await page.goto('/');
    await banner(page).getByRole('button', { name: 'Customize' }).click();
    const dialog = settingsDialog(page);
    await expect(dialog).toBeVisible();

    const necessary = dialog.getByRole('checkbox', { name: /Necessary/ });
    await expect(necessary).toBeChecked();
    await expect(necessary).toBeDisabled();
    for (const name of ['Preferences', 'Analytics', 'Marketing']) {
      await expect(dialog.getByRole('checkbox', { name })).not.toBeChecked();
    }

    await dialog.getByRole('checkbox', { name: 'Preferences' }).check();
    await dialog.getByRole('button', { name: 'Save choices' }).click();
    await expect(dialog).toBeHidden();
    await expect(banner(page)).toHaveCount(0);
    expect(readConsent(await context.cookies())?.choices).toEqual({ preferences: true, analytics: false, marketing: false });
  });

  test('preferences can be changed later from the footer, and the dialog reflects the saved choice', async ({
    page,
    context,
  }) => {
    await page.goto('/');
    await banner(page).getByRole('button', { name: 'Accept all' }).click();

    await page.getByRole('contentinfo').getByRole('button', { name: 'Cookie settings' }).click();
    const dialog = settingsDialog(page);
    for (const name of ['Preferences', 'Analytics', 'Marketing']) {
      await expect(dialog.getByRole('checkbox', { name })).toBeChecked();
    }
    await dialog.getByRole('checkbox', { name: 'Analytics' }).uncheck();
    await dialog.getByRole('checkbox', { name: 'Marketing' }).uncheck();
    await dialog.getByRole('button', { name: 'Save choices' }).click();
    expect(readConsent(await context.cookies())?.choices).toEqual({ preferences: true, analytics: false, marketing: false });

    // Persisted: a fresh page load reopens with the saved state.
    await page.reload();
    await page.getByRole('contentinfo').getByRole('button', { name: 'Cookie settings' }).click();
    await expect(dialog.getByRole('checkbox', { name: 'Preferences' })).toBeChecked();
    await expect(dialog.getByRole('checkbox', { name: 'Analytics' })).not.toBeChecked();

    // Withdraw everything optional from inside the dialog.
    await dialog.getByRole('button', { name: 'Reject optional' }).click();
    expect(readConsent(await context.cookies())?.choices).toEqual({ preferences: false, analytics: false, marketing: false });
  });

  test('Cookie Policy page has a single entry point (the footer), which opens the dialog and returns focus on Escape', async ({
    page,
  }) => {
    await page.goto('/cookies');
    await banner(page).getByRole('button', { name: 'Reject optional' }).click();
    await expect(page.getByRole('main').getByRole('button', { name: 'Cookie settings' })).toHaveCount(0);
    const opener = page.getByRole('contentinfo').getByRole('button', { name: 'Cookie settings' });
    await opener.click();
    await expect(settingsDialog(page)).toBeVisible();
    await page.keyboard.press('Escape');
    await expect(settingsDialog(page)).toBeHidden();
    await expect(opener).toBeFocused();
  });

  test('lists what each category actually contains, distinguishing browser storage from cookies', async ({ page }) => {
    await page.goto('/');
    await banner(page).getByRole('button', { name: 'Customize' }).click();
    const dialog = settingsDialog(page);
    await dialog.locator('summary', { hasText: 'Currently used' }).click();
    await expect(dialog.getByText('ptd_locale')).toBeVisible();
    await expect(dialog.getByText('next-auth.session-token', { exact: false })).toBeVisible();
    await expect(dialog.getByText('Browser storage (not a cookie)').first()).toBeVisible();
    // No analytics/marketing scripts exist, and the dialog says so.
    await expect(dialog.getByText('Nothing in this category is currently used.')).toHaveCount(3);
  });

  test('banner and settings dialog have no serious/critical axe violations', async ({ page }) => {
    await page.goto('/cookies');
    await expect(banner(page)).toBeVisible();
    let results = await new AxeBuilder({ page }).analyze();
    let serious = results.violations.filter((v) => v.impact === 'serious' || v.impact === 'critical');
    expect(serious, JSON.stringify(serious, null, 2)).toEqual([]);

    await banner(page).getByRole('button', { name: 'Customize' }).click();
    await expect(settingsDialog(page)).toBeVisible();
    results = await new AxeBuilder({ page }).include('dialog').analyze();
    serious = results.violations.filter((v) => v.impact === 'serious' || v.impact === 'critical');
    expect(serious, JSON.stringify(serious, null, 2)).toEqual([]);
  });
});

test.describe('Registration consent (documents unpublished)', () => {
  test('the register form shows no Terms/Privacy fields while the documents are unpublished', async ({ page }) => {
    await page.goto('/register');
    await expect(page.getByRole('heading', { name: 'Create your account' })).toBeVisible();
    await expect(page.getByTestId('registration-consent')).toHaveCount(0);
    await expect(page.getByRole('checkbox')).toHaveCount(0);
  });

  test('registering never requires, nor records, agreement to an unpublished document', async ({ page }) => {
    const challenge = await (await page.request.post('/api/auth/math-challenge')).json();
    const [a, b] = String(challenge.question).split(' + ').map(Number);
    const email = `e2e.legal.${Date.now()}@example.dev`;

    const res = await page.request.post('/api/auth/register', {
      data: {
        name: 'Legal Draft User',
        email,
        password: 'PlaywrightPass123!',
        captchaToken: 'e2e-test-recaptcha-token',
        mathChallengeId: challenge.challengeId,
        mathAnswer: a + b,
        formRenderedAt: Date.now() - 5000,
        // Even an explicit "accepted" for a draft must not be stored.
        legalConsent: { termsAccepted: true, termsVersion: LEGAL_DOCUMENTS.terms.version },
      },
    });
    expect(res.status(), await res.text()).toBe(201);

    const user = await prisma.user.findUniqueOrThrow({ where: { email }, select: { id: true } });
    expect(await prisma.legalAgreement.count({ where: { userId: user.id } })).toBe(0);
  });
});
