import AxeBuilder from '@axe-core/playwright';
import { test, expect } from './fixtures/base';
import { AUTH_STORAGE_STATE } from './fixtures/data';

// Smoke-level accessibility coverage, not a full audit: a handful of
// representative pages checked with axe-core, plus a couple of manual
// keyboard-navigation checks for real flows. Only serious/critical
// violations fail the test — see the final report for anything found.
async function assertNoSeriousViolations(page: import('@playwright/test').Page) {
  const results = await new AxeBuilder({ page }).analyze();
  const serious = results.violations.filter((v) => v.impact === 'serious' || v.impact === 'critical');
  expect(serious, JSON.stringify(serious, null, 2)).toEqual([]);
}

test.describe('Accessibility smoke checks', () => {
  test('@smoke home page has no serious/critical axe violations', async ({ page }) => {
    await page.goto('/');
    await assertNoSeriousViolations(page);
  });

  test('login page has no serious/critical axe violations', async ({ page }) => {
    await page.goto('/login');
    await assertNoSeriousViolations(page);
  });

  test('practices page has no serious/critical axe violations', async ({ page }) => {
    await page.goto('/practices');
    await assertNoSeriousViolations(page);
  });

  test('discussion thread page has no serious/critical axe violations', async ({ page }) => {
    await page.goto('/community/discussions/how-did-you-start-your-daily-practice');
    await assertNoSeriousViolations(page);
  });

  test('every page has a document title and a single top-level heading', async ({ page }) => {
    for (const path of ['/', '/practices', '/community', '/blog', '/login']) {
      await page.goto(path);
      await expect(page).toHaveTitle(/.+/);
      await expect(page.getByRole('heading', { level: 1 })).toHaveCount(1);
    }
  });

  test('login form is fully operable by keyboard', async ({ page }) => {
    await page.goto('/login');
    await page.getByLabel('Email').focus();
    await page.keyboard.type('member@example.dev');
    await page.keyboard.press('Tab');
    await page.keyboard.type('DevPassword123!');
    await expect(page.getByLabel('Password', { exact: true })).toBeFocused();
    await page.keyboard.press('Tab');
    await expect(page.getByRole('link', { name: 'Forgot password?' })).toBeFocused();
    await page.keyboard.press('Tab');
    await expect(page.getByRole('button', { name: 'Log in' })).toBeFocused();
    await page.keyboard.press('Enter');
    await expect(page).toHaveURL('/');
  });

  test('theme toggle is keyboard-activatable', async ({ page }) => {
    await page.goto('/');
    await page.getByRole('button', { name: 'Switch to dark mode' }).focus();
    await page.keyboard.press('Enter');
    await expect(page.locator('html')).toHaveClass(/dark/);
  });

  test('mobile drawer opens, is keyboard-operable, and closes on Escape', async ({ page }) => {
    await page.setViewportSize({ width: 375, height: 812 });
    await page.goto('/');
    await page.getByRole('button', { name: 'Open menu' }).click();
    await expect(page.getByText('Menu', { exact: true })).toBeVisible();

    await page.keyboard.press('Escape');
    await expect(page.getByText('Menu', { exact: true })).toHaveCount(0);
  });
});

test.describe('Accessibility — authenticated pages', () => {
  test.use({ storageState: AUTH_STORAGE_STATE });

  test('account page has no serious/critical axe violations', async ({ page }) => {
    await page.goto('/account');
    await assertNoSeriousViolations(page);
  });
});
