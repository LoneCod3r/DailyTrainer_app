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

    // V1 IA (concept §2): Practice · Programs · Learn · Journey — the logo
    // is Home, and Community (a V2 area) moved to the footer.
    const nav = page.getByRole('navigation', { name: 'Main' });
    await expect(nav).toBeVisible();
    for (const label of ['Practice', 'Programs', 'Learn', 'Journey']) {
      await expect(nav.getByRole('link', { name: label, exact: true })).toBeVisible();
    }
    await expect(nav.getByRole('link', { name: 'Community', exact: true })).toHaveCount(0);
  });

  test('practice navigation works', async ({ page }) => {
    await page.goto('/');
    await page.getByRole('navigation', { name: 'Main' }).getByRole('link', { name: 'Practice', exact: true }).click();
    await expect(page).toHaveURL('/practices');
    await expect(page.getByRole('heading', { name: 'Practice', exact: true })).toBeVisible();
  });

  test('programs, learn and journey navigation work', async ({ page }) => {
    const nav = page.getByRole('navigation', { name: 'Main' });
    for (const [label, url, heading] of [
      ['Programs', '/practices/programs', 'Reset Programs'],
      ['Learn', '/learn', 'Learn'],
      ['Journey', '/journey', 'Your journey'],
    ] as const) {
      await page.goto('/');
      await nav.getByRole('link', { name: label, exact: true }).click();
      await expect(page).toHaveURL(url);
      await expect(page.getByRole('heading', { name: heading, exact: true })).toBeVisible();
    }
  });

  test('community stays reachable from the footer', async ({ page }) => {
    await page.goto('/');
    await page.getByRole('contentinfo').getByRole('link', { name: 'Community', exact: true }).click();
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
    await expect(page.getByRole('navigation', { name: 'Main' }).getByRole('link', { name: 'Практика', exact: true })).toBeVisible();

    await switchLanguage(page, 'bg', 'en');
    await expect(page.getByRole('heading', { name: /power to change your body/i })).toBeVisible();
  });

  test('navbar arrow shows/hides the Practice flyout, and never auto-opens from navigation', async ({ page }) => {
    await page.goto('/');
    const nav = page.getByRole('navigation', { name: 'Main' });

    // Practice isn't the active page here, so it starts collapsed.
    await expect(nav.getByRole('button', { name: 'Practice: Show' })).toBeVisible();
    await expect(nav.getByRole('link', { name: 'Start Here' })).toBeHidden();

    // Clicking the arrow toggles the flyout without navigating away.
    await nav.getByRole('button', { name: 'Practice: Show' }).click();
    await expect(nav.getByRole('link', { name: 'Start Here' })).toBeVisible();
    await expect(page).toHaveURL('/');

    await nav.getByRole('button', { name: 'Practice: Hide' }).click();
    await expect(nav.getByRole('link', { name: 'Start Here' })).toBeHidden();

    // Navigating to a page under a section (even via the nav link itself)
    // must NOT auto-open its flyout — a floating dropdown popping open
    // unprompted, just because you're on that page, is exactly the bug
    // this test guards against (it was fine for the old inline sidebar
    // list, not for a flyout menu).
    await nav.getByRole('link', { name: 'Practice', exact: true }).click();
    await expect(page).toHaveURL('/practices');
    await expect(nav.getByRole('link', { name: 'Start Here' })).toBeHidden();
    await expect(nav.getByRole('button', { name: 'Practice: Show' })).toBeVisible();

    // The arrow still works normally while that page is active.
    await nav.getByRole('button', { name: 'Practice: Show' }).click();
    await expect(nav.getByRole('link', { name: 'Start Here' })).toBeVisible();
    await expect(page.getByRole('heading', { name: 'Practice', exact: true })).toBeVisible();
  });

  test('Programs is the active nav item on program pages, not Practice', async ({ page }) => {
    await page.goto('/practices/programs');
    const nav = page.getByRole('navigation', { name: 'Main' });
    await expect(nav.getByRole('link', { name: 'Programs', exact: true }).locator('..')).toHaveClass(/text-link/);
    await expect(nav.getByRole('link', { name: 'Practice', exact: true }).locator('..')).not.toHaveClass(/text-link/);
  });

  test('a Home page link into a section does not leave that section\'s navbar flyout open', async ({ page }) => {
    await page.goto('/');
    const nav = page.getByRole('navigation', { name: 'Main' });

    // This is the exact bug reported: opening "Start Here" from the Home
    // page's Explore section used to leave the Practices flyout open.
    await page.getByRole('main').getByRole('link', { name: 'Start Here' }).first().click();
    await expect(page).toHaveURL('/practices/start-here');
    await expect(nav.getByRole('link', { name: 'Feel Better Now' })).toBeHidden();
    await expect(nav.getByRole('button', { name: 'Practice: Show' })).toBeVisible();
  });

  test('locale persists after navigation and reload', async ({ page }) => {
    await page.goto('/');
    await switchLanguage(page, 'en', 'bg');
    await expect(page.getByRole('heading', { name: /Силата да променяте тялото/i })).toBeVisible();

    await page.getByRole('navigation', { name: 'Main' }).getByRole('link', { name: 'Практика', exact: true }).click();
    await expect(page).toHaveURL('/practices');
    await expect(page.getByRole('heading', { name: 'Практика', exact: true })).toBeVisible();

    await page.reload();
    await expect(page.getByRole('heading', { name: 'Практика', exact: true })).toBeVisible();
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

test('the KUKO WAY favicon is served (no favicon 404)', async ({ page }) => {
  for (const [path, type] of [
    ['/favicon.ico', 'image/x-icon'],
    ['/icon.svg', 'image/svg+xml'],
  ]) {
    const res = await page.request.get(path);
    expect(res.status(), path).toBe(200);
    expect(res.headers()['content-type']).toContain(type);
  }
  await page.goto('/');
  await expect(page.locator('link[rel="icon"][href^="/icon.svg"]')).toHaveCount(1);
});
