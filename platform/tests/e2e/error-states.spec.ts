import { test, expect } from './fixtures/base';

// Missing blog/discussion/meeting content is covered in their own spec
// files; this file rounds out the remaining "does this crash or show a
// proper error/empty state" cases from the task's error/edge-case list.
//
// IMPORTANT: a real Next.js App Router limitation (confirmed against both
// `next dev` and a production build, in this Next 14.2.35 project) means
// `notFound()` calls made from inside app/(app)/** correctly render the
// "Page not found" content and add a `noindex` meta tag, but the raw HTTP
// response status stays 200 instead of 404 — only a genuinely-unmatched
// route (no page.tsx matches it at all, e.g. the very first test below)
// gets a real 404 status. These tests assert the actual, verified content
// behavior rather than a status code the app cannot currently guarantee.
// See the final report for this as a documented, non-blocking gap.

test.describe('Error and edge cases', () => {
  test('@smoke an arbitrary unknown route shows the 404 page with a real 404 status', async ({ page }) => {
    const response = await page.goto('/this-route-absolutely-does-not-exist');
    expect(response?.status()).toBe(404);
    await expect(page.getByRole('heading', { name: 'Page not found' })).toBeVisible();
    await page.getByRole('link', { name: 'Back to Home' }).click();
    await expect(page).toHaveURL('/');
  });

  test('a nonexistent practice shows the not-found page, not a crash', async ({ page }) => {
    await page.goto('/practices/this-practice-does-not-exist');
    await expect(page.getByRole('heading', { name: 'Page not found' })).toBeVisible();
    // Still inside the app shell — not a bare fallback page.
    await expect(page.getByRole('navigation', { name: 'Main' })).toBeVisible();
  });

  test('a nonexistent Start Here section shows the not-found page', async ({ page }) => {
    await page.goto('/practices/start-here/this-section-does-not-exist');
    await expect(page.getByRole('heading', { name: 'Page not found' })).toBeVisible();
  });

  test('a nonexistent course shows the not-found page', async ({ page }) => {
    await page.goto('/community/courses/this-course-does-not-exist');
    await expect(page.getByRole('heading', { name: 'Page not found' })).toBeVisible();
  });

  test('a nonexistent module/lesson under a real course shows the not-found page', async ({ page }) => {
    await page.goto('/community/courses/foundations-of-practice/not-a-real-module');
    await expect(page.getByRole('heading', { name: 'Page not found' })).toBeVisible();

    await page.goto('/community/courses/foundations-of-practice/getting-grounded/not-a-real-lesson');
    await expect(page.getByRole('heading', { name: 'Page not found' })).toBeVisible();
  });

  test('server errors are never shown with raw stack traces or internal details', async ({ page }) => {
    // Hitting an API route with an invalid body should return a clean,
    // typed error — never a stack trace or a raw framework error page.
    const response = await page.request.post('/api/discussions', {
      data: { title: '', category: 'NOT_A_REAL_CATEGORY', body: '' },
      headers: { 'Content-Type': 'application/json' },
    });
    expect(response.status()).toBeLessThan(500);
    const body = await response.json();
    expect(body.error).toBeTruthy();
    expect(JSON.stringify(body)).not.toMatch(/at\s+.*\(.*:\d+:\d+\)/); // no stack trace shape
  });
});
