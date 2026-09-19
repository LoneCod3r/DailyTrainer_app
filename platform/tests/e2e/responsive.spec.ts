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

  test('Support is reachable from the mobile drawer without overflow', async ({ page }) => {
    await page.goto('/account');
    await assertNoHorizontalOverflow(page);
    await page.getByRole('button', { name: 'Open menu' }).click();
    const support = page.getByRole('link', { name: 'Support', exact: true });
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

  test('donation amount tiles form a 2x2 grid with no overflow (Stripe configured only)', async ({ page }) => {
    await page.goto('/account/donation');
    const unavailable = await page
      .getByText('Donations are not available right now — payment configuration is incomplete.')
      .isVisible();
    test.skip(unavailable, 'Stripe is not configured in this environment');

    const boxes = await Promise.all(
      ['€5', '€10', '€25', '€50'].map((name) =>
        page.getByRole('radio', { name, exact: true }).locator('xpath=..').boundingBox(),
      ),
    );
    // 2x2: the first two share a row, the second two share the next row.
    expect(Math.abs(boxes[0]!.y - boxes[1]!.y)).toBeLessThanOrEqual(1);
    expect(boxes[2]!.y).toBeGreaterThan(boxes[0]!.y + 1);
    await assertNoHorizontalOverflow(page);

    await page
      .locator('label', { has: page.getByRole('radio', { name: 'Custom', exact: true }) })
      .click();
    await page.getByRole('textbox', { name: 'Custom amount (EUR)' }).fill('0.5');
    await assertNoHorizontalOverflow(page);
  });
});
