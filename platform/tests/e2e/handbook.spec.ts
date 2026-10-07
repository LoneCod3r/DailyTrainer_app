import { test, expect } from './fixtures/base';

// Start Here (orientation / first steps) and Learn (understanding /
// reference) each own a distinct set of handbook chapters — see
// modules/kuko-way/handbook.ts. Nothing may appear on both pages, in either
// language, and old links must still land on the chapter's single home.

for (const locale of ['en', 'bg'] as const) {
  test(`Start Here and Learn list no chapter twice (${locale})`, async ({ page, context, baseURL }) => {
    await context.addCookies([{ name: 'ptd_locale', value: locale, url: baseURL! }]);

    await page.goto('/practices/start-here');
    const startHere = await page
      .getByRole('main')
      .locator('a[href^="/practices/start-here/"] h3')
      .allInnerTexts();

    await page.goto('/learn');
    const learn = await page.getByTestId('learn-handbook').locator('a[href^="/learn/"]').allInnerTexts();
    const learnTitles = learn.map((text) => text.replace(/^\d+\s*/, '').trim());

    expect(startHere).toHaveLength(6);
    expect(learnTitles).toHaveLength(5);
    expect(learnTitles.filter((title) => startHere.includes(title))).toEqual([]);
    // Learn no longer links into Start Here chapters.
    await expect(page.getByTestId('learn-handbook').locator('a[href^="/practices/start-here/"]')).toHaveCount(0);
  });
}

test('a chapter that moved to Learn redirects from its old Start Here URL', async ({ page }) => {
  await page.goto('/practices/start-here/kakvo-e-fastsiya');
  await expect(page).toHaveURL('/learn/kakvo-e-fastsiya');
  await expect(page.getByRole('heading', { level: 1, name: 'What Is Fascia?' })).toBeVisible();
  await expect(page.getByRole('link', { name: '← Learn' })).toBeVisible();
});

test('a Start Here chapter requested under Learn redirects to Start Here', async ({ page }) => {
  await page.goto('/learn/vavedenie');
  await expect(page).toHaveURL('/practices/start-here/vavedenie');
});

test('Start Here walks only its own chapters and ends at the first practice', async ({ page }) => {
  await page.goto('/practices/start-here/kakvo-da-ochakvate');
  await expect(page.getByText('Step 6 of 6')).toBeVisible();
  await expect(page.getByRole('link', { name: 'Body Scan #1 →' })).toBeVisible();
  // Its previous chapter is a Start Here one, not a Learn chapter.
  await expect(page.getByRole('link', { name: '← Tips for Getting Started' })).toHaveAttribute(
    'href',
    '/practices/start-here/saveti-za-nachalo',
  );
});

test('Library links each chapter to its single home', async ({ page }) => {
  await page.goto('/practices/library');
  await expect(page.getByRole('link', { name: /What Is Fascia\?/ })).toHaveAttribute('href', '/learn/kakvo-e-fastsiya');
  await expect(page.getByRole('link', { name: /^01\s*Introduction/ })).toHaveAttribute('href', '/practices/start-here/vavedenie');
});
