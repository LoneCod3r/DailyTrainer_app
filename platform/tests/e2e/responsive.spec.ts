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

  test('donation page has no overflow and its unavailable notice is readable', async ({ page }) => {
    await page.goto('/account/donation');
    await assertNoHorizontalOverflow(page);
    await expect(
      page.getByText('Donations are not available right now — payment configuration is incomplete.'),
    ).toBeVisible();
  });
});
