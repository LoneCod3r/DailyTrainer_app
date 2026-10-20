import { test, expect } from './fixtures/base';
import { AUTH_STORAGE_STATE, SEEDED_DISCUSSIONS, COURSE, PRACTICE_WITH_INSTRUCTIONS } from './fixtures/data';

// Runs only on the `mobile-chrome` project (375x812 viewport — see
// playwright.config.ts). "No horizontal overflow" is checked directly via
// scrollWidth rather than eyeballing screenshots.
async function assertNoHorizontalOverflow(page: import('@playwright/test').Page) {
  const overflow = await page.evaluate(() => {
    return document.documentElement.scrollWidth - document.documentElement.clientWidth;
  });
  expect(overflow, 'document is wider than the viewport — horizontal overflow').toBeLessThanOrEqual(1);
}

const PUBLIC_PAGES = [
  '/',
  '/practices',
  `/practices/${PRACTICE_WITH_INSTRUCTIONS}`,
  '/practices/programs',
  '/practices/programs/28-days',
  '/learn',
  '/journey',
  '/community',
  `/community/discussions/${SEEDED_DISCUSSIONS.withReply}`,
  `/community/courses/${COURSE.slug}/${COURSE.moduleSlug}/${COURSE.firstLessonSlug}`,
];

test.describe('Responsive — 375px viewport, public pages', () => {
  for (const path of PUBLIC_PAGES) {
    test(`${path} has no horizontal overflow and renders its main content`, async ({ page }) => {
      await page.goto(path);
      await assertNoHorizontalOverflow(page);
      await expect(page.getByRole('heading', { level: 1 })).toBeVisible();
    });
  }

  test('bottom navigation is visible and does not cover page content', async ({ page }) => {
    await page.goto('/');
    const bottomNav = page.getByRole('navigation', { name: 'Mobile' });
    await expect(bottomNav).toBeVisible();

    // The desktop sidebar must not also be visible at this width.
    await expect(page.getByRole('navigation', { name: 'Main' })).toBeHidden();

    const navBox = await bottomNav.boundingBox();
    const lastSection = page.getByRole('heading', { name: 'Upcoming member meeting' });
    await lastSection.scrollIntoViewIfNeeded();
    const sectionBox = await lastSection.boundingBox();
    expect(navBox && sectionBox && sectionBox.y < navBox.y).toBeTruthy();
  });

  test('bottom navigation carries the five V1 destinations without overflow, in both languages', async ({ page }) => {
    const bottomNav = page.getByRole('navigation', { name: 'Mobile' });
    for (const [locale, labels] of [
      ['en', ['Home', 'Practice', 'Programs', 'Journey', 'Profile']],
      ['bg', ['Начало', 'Практика', 'Програми', 'Път', 'Профил']],
    ] as const) {
      await page.context().addCookies([{ name: 'ptd_locale', value: locale, url: 'http://localhost:3000' }]);
      await page.goto('/');
      for (const label of labels) {
        await expect(bottomNav.getByRole('link', { name: label, exact: true })).toBeVisible();
      }
      await assertNoHorizontalOverflow(page);
    }
  });

  test('practice mode fits a narrow viewport', async ({ page }) => {
    await page.goto(`/practices/${PRACTICE_WITH_INSTRUCTIONS}`);
    await page.getByTestId('practice-begin').click();
    await expect(page.getByTestId('practice-mode')).toBeVisible();
    await assertNoHorizontalOverflow(page);
  });

  test('drawer opens from the bottom-nav menu and its links are usable', async ({ page }) => {
    await page.goto('/');
    await page.getByRole('button', { name: 'Open menu' }).click();
    const drawerLink = page.getByRole('link', { name: 'Discussions' });
    await expect(drawerLink).toBeVisible();
    await drawerLink.click();
    await expect(page).toHaveURL('/community/discussions');
  });

  test('reply form is usable on a narrow viewport', async ({ page }) => {
    await page.goto(`/community/discussions/${SEEDED_DISCUSSIONS.withReply}`);
    await expect(page.getByRole('link', { name: 'Log in to reply to this discussion.' })).toBeVisible();
    await assertNoHorizontalOverflow(page);
  });
});

test.describe('Responsive — 375px viewport, authenticated pages', () => {
  test.use({ storageState: AUTH_STORAGE_STATE });

  test('account page has no overflow and its cards remain tappable', async ({ page }) => {
    await page.goto('/account');
    await assertNoHorizontalOverflow(page);
    await expect(page.getByRole('main').getByRole('link', { name: /Billing/ })).toBeVisible();
  });

  test('Support Us is reachable from the footer on mobile without overflow', async ({ page }) => {
    await page.goto('/account');
    await assertNoHorizontalOverflow(page);
    const support = page.getByRole('contentinfo').getByRole('link', { name: 'Support Us', exact: true });
    await support.scrollIntoViewIfNeeded();
    await expect(support).toBeVisible();
    await expect(support).toHaveAttribute('href', '/account/donation');
    await assertNoHorizontalOverflow(page);
    await support.click();
    await expect(page).toHaveURL('/account/donation');
  });

  test('donation page has no overflow and its unavailable notice is readable', async ({ page }) => {
    await page.goto('/account/donation');
    await assertNoHorizontalOverflow(page);
    test.skip(
      (await page.getByRole('radio').count()) > 0,
      'Stripe is configured in this environment, so the amount form renders instead',
    );
    await expect(
      page.getByText('Donations are not available right now — payment configuration is incomplete.'),
    ).toBeVisible();
  });

  test('donation preset tiles share one row with a full-width Custom row below, no overflow (Stripe configured only)', async ({ page }) => {
    await page.goto('/account/donation');
    const unavailable = await page
      .getByText('Donations are not available right now — payment configuration is incomplete.')
      .isVisible();
    test.skip(unavailable, 'Stripe is not configured in this environment');

    // The tile is the <label> wrapping each visually hidden native radio.
    const tile = (name: string) =>
      page.locator('label', { has: page.getByRole('radio', { name, exact: true }) });
    const presets = ['€5', '€10', '€25', '€50'].map(tile);
    const custom = tile('Custom');

    for (const preset of presets) await expect(preset).toBeVisible();
    await expect(custom).toBeVisible();

    const boxes = await Promise.all(presets.map((preset) => preset.boundingBox()));
    const customBox = (await custom.boundingBox())!;

    // One row: every preset shares the first tile's top edge, in €5 → €50 order.
    for (let i = 1; i < boxes.length; i++) {
      expect(Math.abs(boxes[i]!.y - boxes[0]!.y), `${i}th preset is not on the first row`).toBeLessThanOrEqual(2);
      expect(boxes[i]!.x).toBeGreaterThan(boxes[i - 1]!.x + boxes[i - 1]!.width - 2);
    }

    // Custom sits on its own row below the presets and spans their full width.
    const rowBottom = Math.max(...boxes.map((b) => b!.y + b!.height));
    const rowLeft = boxes[0]!.x;
    const rowRight = boxes[3]!.x + boxes[3]!.width;
    expect(customBox.y).toBeGreaterThanOrEqual(rowBottom - 1);
    expect(Math.abs(customBox.x - rowLeft)).toBeLessThanOrEqual(2);
    expect(Math.abs(customBox.x + customBox.width - rowRight)).toBeLessThanOrEqual(2);
    await assertNoHorizontalOverflow(page);

    await custom.click();
    const customInput = page.getByRole('textbox', { name: 'Custom amount (EUR)' });
    await expect(customInput).toBeVisible();
    await customInput.fill('0.5');
    await expect(page.getByText('Minimum donation is €1.')).toBeVisible();
    await assertNoHorizontalOverflow(page);
  });
});
