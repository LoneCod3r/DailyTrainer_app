import AxeBuilder from '@axe-core/playwright';
import { test, expect } from './fixtures/base';
import { AUTH_STORAGE_STATE } from './fixtures/data';

// Real, deterministic checks rather than pixel-diffing: dark mode actually
// repaints (not just a class toggle with no visual effect), and axe-core's
// color-contrast rule — the automatable half of "no unreadable text /
// incorrect contrast in dark mode" — passes on each representative page.
async function enableDarkMode(page: import('@playwright/test').Page) {
  await page.getByRole('button', { name: 'Switch to dark mode' }).click();
  await expect(page.locator('html')).toHaveClass(/dark/);
}

async function assertNoContrastViolations(page: import('@playwright/test').Page) {
  const results = await new AxeBuilder({ page }).withRules(['color-contrast']).analyze();
  expect(results.violations, JSON.stringify(results.violations, null, 2)).toEqual([]);
}

test.describe('Theme — public pages', () => {
  for (const path of ['/', '/practices', '/community']) {
    test(`${path}: dark mode repaints and has no contrast violations`, async ({ page }) => {
      await page.goto(path);
      const bgLight = await page.evaluate(() => getComputedStyle(document.body).backgroundColor);

      await enableDarkMode(page);
      const bgDark = await page.evaluate(() => getComputedStyle(document.body).backgroundColor);
      expect(bgDark).not.toBe(bgLight);

      await assertNoContrastViolations(page);
    });
  }
});

test.describe('Theme — authenticated pages', () => {
  test.use({ storageState: AUTH_STORAGE_STATE });

  for (const path of ['/account', '/account/membership', '/account/billing']) {
    test(`${path}: dark mode has no contrast violations`, async ({ page }) => {
      await page.goto(path);
      await enableDarkMode(page);
      await assertNoContrastViolations(page);
    });
  }
});
