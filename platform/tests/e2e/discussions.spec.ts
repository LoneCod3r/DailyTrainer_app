import { test, expect } from './fixtures/base';
import { AUTH_STORAGE_STATE, SEEDED_DISCUSSIONS } from './fixtures/data';

test.describe('Discussions — public list and thread', () => {
  test('@smoke list loads and a discussion thread opens with real content', async ({ page }) => {
    await page.goto('/community/discussions');
    await expect(page.getByRole('heading', { name: 'Discussions' })).toBeVisible();

    await page.getByRole('link', { name: /How did you start your daily practice/i }).click();
    await expect(page).toHaveURL(`/community/discussions/${SEEDED_DISCUSSIONS.withReply}`);
    await expect(page.getByRole('heading', { level: 1 })).toContainText('How did you start your daily practice');
    // Seeded reply from the moderator account.
    await expect(page.getByText('starting with just a few minutes right after waking up')).toBeVisible();
  });

  test('a discussion with no replies shows the "be the first to reply" empty state', async ({ page }) => {
    await page.goto(`/community/discussions/${SEEDED_DISCUSSIONS.noReplies}`);
    await expect(page.getByText('Be the first to reply.')).toBeVisible();
  });

  test('a locked discussion shows a locked notice instead of a reply form', async ({ page }) => {
    await page.goto(`/community/discussions/${SEEDED_DISCUSSIONS.locked}`);
    await expect(page.getByRole('alert').getByText('Discussion locked')).toBeVisible();
    await expect(page.getByRole('textbox', { name: 'Message' })).toHaveCount(0);
  });

  test('anonymous visitors are prompted to log in before replying', async ({ page }) => {
    await page.goto(`/community/discussions/${SEEDED_DISCUSSIONS.withReply}`);
    await expect(page.getByRole('link', { name: 'Log in to reply to this discussion.' })).toBeVisible();
  });

  // Note: the HTTP status for these is a known Next.js App Router
  // limitation (200, not 404) — see error-states.spec.ts for details. What
  // actually matters for access control is verified here instead: the
  // discussion's real title/body never reaches an anonymous visitor.
  test('a PENDING discussion is not visible to an anonymous visitor', async ({ page }) => {
    await page.goto(`/community/discussions/${SEEDED_DISCUSSIONS.pending}`);
    await expect(page.getByRole('heading', { name: 'Page not found' })).toBeVisible();
    await expect(page.getByText('Draft question about KUKO WAY')).toHaveCount(0);
  });

  test('a HIDDEN discussion is not visible to an anonymous visitor', async ({ page }) => {
    await page.goto(`/community/discussions/${SEEDED_DISCUSSIONS.hidden}`);
    await expect(page.getByRole('heading', { name: 'Page not found' })).toBeVisible();
    await expect(page.getByText('Off-topic post')).toHaveCount(0);
  });
});

test.describe('Discussions — moderation visibility for the author', () => {
  test.use({ storageState: AUTH_STORAGE_STATE });

  test('the author can still see their own PENDING discussion, marked as such', async ({ page }) => {
    await page.goto(`/community/discussions/${SEEDED_DISCUSSIONS.pending}`);
    await expect(page.getByText("isn't visible to other members yet")).toBeVisible();
  });

  test('the author can still see their own HIDDEN discussion, marked as such', async ({ page }) => {
    await page.goto(`/community/discussions/${SEEDED_DISCUSSIONS.hidden}`);
    await expect(page.getByRole('alert').getByText('hidden from ordinary members by a moderator')).toBeVisible();
  });
});

test.describe('Discussions — create and reply (authenticated)', () => {
  test.use({ storageState: AUTH_STORAGE_STATE });

  test('creating a discussion validates required length and then publishes and accepts a reply', async ({ page }) => {
    await page.goto('/community/discussions/new');
    await expect(page.getByRole('heading', { name: 'New discussion', exact: true })).toBeVisible();

    // Too-short title is rejected client-side — no navigation happens.
    await page.getByLabel('Title').fill('hi');
    await page.getByLabel('Message').fill('short body text for the new discussion, long enough to pass.');
    await page.getByRole('button', { name: 'Post discussion' }).click();
    await expect(page).toHaveURL('/community/discussions/new');

    const uniqueTitle = `Playwright E2E discussion ${Date.now()}`;
    await page.getByLabel('Title').fill(uniqueTitle);
    await page.getByLabel('Category').selectOption('QUESTIONS');
    await page.getByLabel('Message').fill('This discussion was created by an automated Playwright E2E test.');
    await page.getByRole('button', { name: 'Post discussion' }).click();

    await expect(page).toHaveURL(/\/community\/discussions\/[a-z0-9-]+/);
    await expect(page.getByRole('heading', { level: 1 })).toHaveText(uniqueTitle);
    await expect(page.getByText('Be the first to reply.')).toBeVisible();

    const replyText = `Automated reply ${Date.now()}`;
    await page.getByRole('textbox', { name: 'Message' }).fill(replyText);
    await page.getByRole('button', { name: 'Reply', exact: true }).click();

    await expect(page.getByText(replyText)).toBeVisible();
  });
});
