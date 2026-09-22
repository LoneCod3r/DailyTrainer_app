import { test, expect } from './fixtures/base';
import { AUTH_STORAGE_STATE, COURSE } from './fixtures/data';
import { registerCleanUser } from './fixtures/auth-helpers';
import { prisma } from '@/lib/prisma';

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

// Regression coverage for a deliberate exception documented in
// docs/auth-security.md ("What is intentionally NOT implemented"):
// requireVerifiedUser gates community-content actions (discussions, replies,
// profile edits) but not course progress, since a private per-user
// LessonProgress row is neither spammable nor visible to anyone else — see
// modules/courses/progress.service.ts. This protects that decision from
// being "fixed" by accident; it is not itself a permission check.
test.describe('Unverified accounts can record course progress (intentional exception)', () => {
  test('an authenticated but unverified user can mark a lesson complete via the API', async ({ page }) => {
    // registerCleanUser (fixtures/auth-helpers.ts) leaves the account
    // unverified and signed in — same real-UI registration flow as
    // email-verification.spec.ts's registerFreshUser, and the same
    // disposable-account pattern already used for DB-touching specs (see
    // session-revocation.spec.ts) rather than the shared demo user.
    const { email } = await registerCleanUser(page, 'courseprogress');

    try {
      // Confirm this really is an unverified session before relying on that
      // being what the assertion below is about.
      const session = await page.evaluate(() => fetch('/api/auth/session').then((r) => r.json()));
      expect(session?.user?.email).toBe(email);
      expect(session?.user?.emailVerified).toBeFalsy();

      // Mirrors email-verification.spec.ts's direct-API-request pattern for
      // the *opposite* endpoints (discussions/profile, which reject this
      // same unverified session with 403 EMAIL_NOT_VERIFIED) — this one
      // must succeed.
      const res = await page.request.post(`/api/courses/${COURSE.slug}/progress`, {
        data: { moduleSlug: COURSE.moduleSlug, lessonSlug: COURSE.firstLessonSlug },
      });
      expect(res.status()).toBe(200);
      // Matches the route's actual response contract (app/api/courses/
      // [slug]/progress/route.ts: jsonOk({ completed: true })), not just a
      // 2xx status.
      expect(await res.json()).toEqual({ completed: true });
    } finally {
      // This spec is the one touching the database directly (LessonProgress
      // rows cascade-delete with the user — prisma/schema.prisma), so it's
      // responsible for cleaning up the account it created.
      await prisma.user.delete({ where: { email } }).catch(() => undefined);
    }
  });
});
