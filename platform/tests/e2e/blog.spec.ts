import { test, expect } from './fixtures/base';
import { BLOG } from './fixtures/data';

test.describe('Blog', () => {
  test('@smoke list loads with a featured article and latest articles', async ({ page }) => {
    await page.goto('/blog');
    await expect(page).toHaveTitle(/Latest Information/);
    await expect(page.getByRole('heading', { name: 'Latest Information' })).toBeVisible();
    await expect(page.getByText('Featured article')).toBeVisible();
    await expect(page.getByRole('heading', { name: 'Latest articles' })).toBeVisible();
  });

  test('opening the featured article shows real content, category and related content', async ({ page }) => {
    await page.goto('/blog');
    await page.getByRole('link', { name: 'Read more' }).click();

    await expect(page).toHaveURL(`/blog/${BLOG.featured}`);
    await expect(page.getByRole('heading', { level: 1 })).toContainText('Getting started with the community');
    await expect(page.getByRole('main').getByText('Community', { exact: true })).toBeVisible();
    await expect(page.getByText(/Lorem ipsum/)).toBeVisible();

    await expect(page.getByRole('heading', { name: 'Related content' })).toBeVisible();
    const relatedLinks = page.getByRole('main').locator('section', { hasText: 'Related content' }).getByRole('link');
    await expect(relatedLinks.first()).toBeVisible();

    await page.getByRole('link', { name: '← Back to articles' }).click();
    await expect(page).toHaveURL('/blog');
  });

  test('a nonexistent article shows the not-found page, not a crash', async ({ page }) => {
    // Note: the HTTP status here is a known Next.js App Router limitation
    // (200, not 404) — see error-states.spec.ts for details. The actual
    // rendered content is what's verified here.
    await page.goto('/blog/this-article-does-not-exist');
    await expect(page.getByRole('heading', { name: 'Page not found' })).toBeVisible();
  });
});
