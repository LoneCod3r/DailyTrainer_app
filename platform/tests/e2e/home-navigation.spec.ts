import { test, expect } from './fixtures/base';
import { switchLanguage } from './fixtures/language-helpers';
import { AUTH_STORAGE_STATE } from './fixtures/data';

test.describe('Home / public navigation', () => {
  test('@smoke home loads with visible primary navigation', async ({ page }) => {
    await page.goto('/');
    await expect(page).toHaveTitle(/KUKO WAY/);
    // Signed-out visitors get a real KUKO WAY philosophy quote as the hero
    // heading (see app/(app)/page.tsx) rather than a personalized greeting.
    await expect(page.getByRole('heading', { name: /power to change your body/i })).toBeVisible();

    const nav = page.getByRole('navigation', { name: 'Main' });
    await expect(nav).toBeVisible();
    await expect(nav.getByRole('link', { name: 'Home' })).toBeVisible();
    await expect(nav.getByRole('link', { name: 'Practices' })).toBeVisible();
    await expect(nav.getByRole('link', { name: 'Community' })).toBeVisible();
  });

  test('practices navigation works', async ({ page }) => {
    await page.goto('/');
    await page.getByRole('navigation', { name: 'Main' }).getByRole('link', { name: 'Practices' }).click();
    await expect(page).toHaveURL('/practices');
    await expect(page.getByRole('heading', { name: 'Practices' })).toBeVisible();
  });

  test('community navigation works', async ({ page }) => {
    await page.goto('/');
    await page.getByRole('navigation', { name: 'Main' }).getByRole('link', { name: 'Community' }).click();
    await expect(page).toHaveURL('/community');
    await expect(page.getByRole('heading', { name: 'Community' })).toBeVisible();
  });

  test('theme toggle switches between light and dark', async ({ page }) => {
    await page.goto('/');
    const toggle = page.getByRole('button', { name: 'Switch to dark mode' });
    await expect(toggle).toBeVisible();

    const bgBefore = await page.evaluate(() => getComputedStyle(document.body).backgroundColor);
    await toggle.click();

    const darkToggle = page.getByRole('button', { name: 'Switch to light mode' });
    await expect(darkToggle).toBeVisible();
    await expect(page.locator('html')).toHaveClass(/dark/);

    const bgAfter = await page.evaluate(() => getComputedStyle(document.body).backgroundColor);
    expect(bgAfter).not.toBe(bgBefore);

    await darkToggle.click();
    await expect(page.locator('html')).not.toHaveClass(/dark/);
  });

  test('language switch (EN -> BG -> EN) updates visible navigation text', async ({ page }) => {
    await page.goto('/');
    await expect(page.getByRole('heading', { name: /power to change your body/i })).toBeVisible();

    await switchLanguage(page, 'en', 'bg');
    await expect(page.getByRole('heading', { name: /Силата да променяте тялото/i })).toBeVisible();
    await expect(page.getByRole('navigation', { name: 'Main' }).getByRole('link', { name: 'Практики' })).toBeVisible();

    await switchLanguage(page, 'bg', 'en');
    await expect(page.getByRole('heading', { name: /power to change your body/i })).toBeVisible();
  });

  test('navbar arrow shows/hides the Practices and Community flyouts, and never auto-opens from navigation', async ({ page }) => {
    await page.goto('/');
    const nav = page.getByRole('navigation', { name: 'Main' });

    // Neither section is the active page here, so both start collapsed.
    await expect(nav.getByRole('button', { name: 'Practices: Show' })).toBeVisible();
    await expect(nav.getByRole('link', { name: 'Start Here' })).toBeHidden();

    // Clicking the arrow toggles the flyout without navigating away.
    await nav.getByRole('button', { name: 'Practices: Show' }).click();
    await expect(nav.getByRole('link', { name: 'Start Here' })).toBeVisible();
    await expect(page).toHaveURL('/');

    await nav.getByRole('button', { name: 'Practices: Hide' }).click();
    await expect(nav.getByRole('link', { name: 'Start Here' })).toBeHidden();

    // Navigating to a page under a section (even via the nav link itself)
    // must NOT auto-open its flyout — a floating dropdown popping open
    // unprompted, just because you're on that page, is exactly the bug
    // this test guards against (it was fine for the old inline sidebar
    // list, not for a flyout menu).
    await nav.getByRole('link', { name: 'Community' }).click();
    await expect(page).toHaveURL('/community');
    await expect(nav.getByRole('link', { name: 'Discussions' })).toBeHidden();
    await expect(nav.getByRole('button', { name: 'Community: Show' })).toBeVisible();

    // The arrow still works normally while that page is active.
    await nav.getByRole('button', { name: 'Community: Show' }).click();
    await expect(nav.getByRole('link', { name: 'Discussions' })).toBeVisible();
    await expect(page.getByRole('heading', { name: 'Community' })).toBeVisible();
  });

  test('a Home page link into a section does not leave that section\'s navbar flyout open', async ({ page }) => {
    await page.goto('/');
    const nav = page.getByRole('navigation', { name: 'Main' });

    // This is the exact bug reported: opening "Start Here" from the Home
    // page's Explore section used to leave the Practices flyout open.
    await page.getByRole('main').getByRole('link', { name: 'Start Here' }).first().click();
    await expect(page).toHaveURL('/practices/start-here');
    await expect(nav.getByRole('link', { name: 'Feel Better Now' })).toBeHidden();
    await expect(nav.getByRole('button', { name: 'Practices: Show' })).toBeVisible();
  });

  test('locale persists after navigation and reload', async ({ page }) => {
    await page.goto('/');
    await switchLanguage(page, 'en', 'bg');
    await expect(page.getByRole('heading', { name: /Силата да променяте тялото/i })).toBeVisible();

    await page.getByRole('navigation', { name: 'Main' }).getByRole('link', { name: 'Практики' }).click();
    await expect(page).toHaveURL('/practices');
    await expect(page.getByRole('heading', { name: 'Практики' })).toBeVisible();

    await page.reload();
    await expect(page.getByRole('heading', { name: 'Практики' })).toBeVisible();
  });

  test('language dropdown closes when clicking elsewhere on the page', async ({ page }) => {
    await page.goto('/');
    const trigger = page.locator('button[aria-haspopup="listbox"]');
    await trigger.click();
    await expect(page.getByRole('option').first()).toBeVisible();

    // Clicking page content (not the dropdown) should close it — a
    // full-screen overlay nested inside the sticky header used to fail to
    // catch this (see lib/useClickOutside.ts).
    await page.getByRole('heading', { level: 1 }).click({ position: { x: 5, y: 5 } });
    await expect(page.getByRole('option').first()).toBeHidden();
  });
});

test.describe('Home / account menu (authenticated)', () => {
  test.use({ storageState: AUTH_STORAGE_STATE });

  test('profile dropdown closes when clicking elsewhere on the page', async ({ page }) => {
    await page.goto('/');
    await page.getByRole('button', { name: /Demo Member/i }).click();
    const overviewLink = page.getByRole('link', { name: 'Overview' });
    await expect(overviewLink).toBeVisible();

    await page.getByRole('heading', { name: 'Welcome, Demo' }).click({ position: { x: 5, y: 5 } });
    await expect(overviewLink).toBeHidden();
  });
});
