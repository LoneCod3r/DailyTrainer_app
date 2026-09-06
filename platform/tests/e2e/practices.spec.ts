import { test, expect } from './fixtures/base';
import { PRACTICE_WITH_INSTRUCTIONS, START_HERE_FIRST_SLUG } from './fixtures/data';

// KUKO WAY handbook content (practice/program/start-here titles & body text)
// is now bilingual (see modules/kuko-way) — both bg and en fields come from
// the approved handbook docx. These tests run against the default locale and
// only assert generic properties (visible, non-empty) of the handbook body
// text, so they don't hardcode either language. The surrounding app chrome
// (page titles, buttons, badges) is expected in English here.

test.describe('Practices — Start Here', () => {
  test('@smoke loads, lists sections, opens one, and content is real', async ({ page }) => {
    await page.goto('/practices/start-here');
    await expect(page.getByRole('heading', { name: 'Start Here', exact: true })).toBeVisible();

    const firstCard = page.getByRole('main').getByRole('link').filter({ hasText: 'Read' }).first();
    await expect(firstCard).toBeVisible();
    await firstCard.click();

    await expect(page).toHaveURL(/\/practices\/start-here\/[a-z-]+/);
    const paragraph = page.locator('article p').first();
    await expect(paragraph).toBeVisible();
    await expect(paragraph).not.toHaveText('');

    // Back link returns to the Start Here index.
    await page.getByRole('link', { name: /Start Here/ }).first().click();
    await expect(page).toHaveURL('/practices/start-here');
  });

  test('sequential section navigation works', async ({ page }) => {
    await page.goto(`/practices/start-here/${START_HERE_FIRST_SLUG}`);
    const next = page.getByRole('link', { name: /→$/ });
    await expect(next).toBeVisible();
    const before = page.url();
    await next.click();
    await expect(page).not.toHaveURL(before);
    await expect(page.locator('article p').first()).toBeVisible();
  });
});

test.describe('Practices — Feel Better Now', () => {
  test('lists practices and opens a detail page with real content', async ({ page }) => {
    await page.goto('/practices/feel-better-now');
    await expect(page.getByRole('heading', { name: 'Feel Better Now' })).toBeVisible();

    const cards = page.getByRole('main').getByRole('link');
    await expect(cards.first()).toBeVisible();
    await cards.first().click();

    await expect(page).toHaveURL(/\/practices\/[a-z0-9-]+/);
    await expect(page.getByRole('heading', { level: 1 })).toBeVisible();
  });
});

test.describe('Practices — Programs', () => {
  test('7-day program shows the active-progress state', async ({ page }) => {
    await page.goto('/practices/programs/7-days');
    await expect(page.getByRole('button', { name: 'Continue program' })).toBeVisible();
    await expect(page.getByText('Current', { exact: true })).toBeVisible();
    await expect(page.getByText('Completed', { exact: true }).first()).toBeVisible();
  });

  test('14-day and 28-day programs show the coming-soon state', async ({ page }) => {
    for (const slug of ['14-days', '28-days']) {
      await page.goto(`/practices/programs/${slug}`);
      await expect(page.getByRole('button', { name: 'Start program' })).toBeVisible();
      await expect(
        page.getByText('Each day below will unlock a guided practice session once this program is published.'),
      ).toBeVisible();
    }
  });
});

test.describe('Practices — Library', () => {
  test('loads, shows browsable content, and opens a result', async ({ page }) => {
    await page.goto('/practices/library');
    await expect(page.getByRole('heading', { name: 'Library' })).toBeVisible();
    await expect(page.getByPlaceholder('Search the library…')).toBeVisible();
    for (const label of ['All', 'Learn', 'Practices', 'Programs']) {
      await expect(page.getByRole('button', { name: label, exact: true })).toBeVisible();
    }

    const result = page.getByRole('main').getByRole('link').first();
    await expect(result).toBeVisible();
    await result.click();
    await expect(page).not.toHaveURL('/practices/library');
  });

  test('search with no matches shows an empty state instead of crashing', async ({ page }) => {
    await page.goto('/practices/library');
    await page.getByPlaceholder('Search the library…').fill('zzzznonexistentquery');
    await expect(page.getByText('Nothing matches your search')).toBeVisible();
    // App shell is still intact — no crash.
    await expect(page.getByRole('navigation', { name: 'Main' })).toBeVisible();
  });
});

test.describe('Practice completion (local, device-only state)', () => {
  test('marking a practice complete toggles and survives a reload', async ({ page }) => {
    await page.goto(`/practices/${PRACTICE_WITH_INSTRUCTIONS}`);

    const markComplete = page.getByRole('button', { name: 'Mark as complete' });
    const completed = page.getByRole('button', { name: '✓ Completed' });

    await expect(markComplete).toBeVisible();
    await markComplete.click();
    await expect(completed).toBeVisible();

    await page.reload();
    await expect(completed).toBeVisible();

    // Toggle back off so this test leaves no lasting local state.
    await completed.click();
    await expect(markComplete).toBeVisible();
  });
});
