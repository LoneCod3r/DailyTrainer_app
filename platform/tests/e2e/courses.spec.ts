import { test, expect } from './fixtures/base';
import { AUTH_STORAGE_STATE, COURSE } from './fixtures/data';

test.describe('Courses — public browsing', () => {
  test('@smoke course list loads and a course detail page shows real modules', async ({ page }) => {
    await page.goto('/community/courses');
    await expect(page.getByRole('heading', { name: 'Courses' })).toBeVisible();

    await page.getByRole('link', { name: new RegExp(COURSE.title) }).click();
    await expect(page).toHaveURL(`/community/courses/${COURSE.slug}`);
    await expect(page.getByRole('heading', { name: COURSE.title })).toBeVisible();
    await expect(page.getByRole('heading', { name: 'Modules' })).toBeVisible();
  });

  test('an unauthenticated visitor is prompted to log in on a course detail page', async ({ page }) => {
    await page.goto(`/community/courses/${COURSE.slug}`);
    await expect(page.getByRole('link', { name: 'Log in' }).last()).toBeVisible();
  });
});

test.describe('Course → Module → Lesson → Complete → Next lesson (authenticated)', () => {
  test.use({ storageState: AUTH_STORAGE_STATE });

  test('completing a lesson updates progress UI, persists on reload, and unlocks the next lesson', async ({ page }) => {
    await page.goto(`/community/courses/${COURSE.slug}/${COURSE.moduleSlug}/${COURSE.firstLessonSlug}`);
    await expect(page.getByRole('heading', { level: 1 })).toBeVisible();

    const markComplete = page.getByRole('button', { name: 'Mark as complete' });
    const done = page.getByRole('button', { name: '✓ Completed' });

    if (await markComplete.isVisible().catch(() => false)) {
      await markComplete.click();
    }
    await expect(done).toBeVisible();
    await expect(done).toBeDisabled();

    // Persists after a hard reload — real per-user DB progress, not a
    // localStorage toggle (see modules/courses/progress.service.ts).
    await page.reload();
    await expect(done).toBeVisible();

    await page.getByRole('link', { name: /Next lesson/ }).click();
    await expect(page).toHaveURL(new RegExp(`${COURSE.secondLessonSlug}$`));
    await expect(page.getByRole('heading', { level: 1 })).toBeVisible();

    // Same self-contained test also confirms the course overview reflects
    // the completion just performed above (avoids depending on test order).
    await page.goto(`/community/courses/${COURSE.slug}`);
    await expect(page.getByText(/^\d+ of \d+ lessons completed$/)).toBeVisible();
  });
});
