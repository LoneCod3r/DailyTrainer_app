import { test, expect } from './fixtures/base';

test.describe('Member Meetings', () => {
  test('@smoke list shows upcoming and past sections', async ({ page }) => {
    await page.goto('/community/meetings');
    await expect(page.getByRole('heading', { name: 'Member Meetings' })).toBeVisible();
    await expect(page.getByRole('heading', { name: 'Upcoming meetings' })).toBeVisible();
    await expect(page.getByRole('heading', { name: 'Past meetings' })).toBeVisible();
  });

  test('an upcoming meeting with no real link shows "Link coming soon", disabled', async ({ page }) => {
    await page.goto('/community/meetings');
    const card = page.getByTestId('meeting-card-community-open-qa');
    await expect(card.getByRole('button', { name: 'Link coming soon' })).toBeDisabled();
  });

  test('a cancelled meeting is clearly marked and its join button is disabled', async ({ page }) => {
    await page.goto('/community/meetings');
    const card = page.getByTestId('meeting-card-members-open-forum');
    await expect(card.getByText('Cancelled').first()).toBeVisible();
    await expect(card.getByRole('button', { name: 'Cancelled' })).toBeDisabled();
  });

  test('meeting detail page renders status, host and description', async ({ page }) => {
    await page.goto('/community/meetings');
    await page.getByRole('link', { name: 'Community Open Q&A' }).click();

    await expect(page).toHaveURL('/community/meetings/community-open-qa');
    await expect(page.getByRole('heading', { name: 'Community Open Q&A' })).toBeVisible();
    await expect(page.getByText(/Hosted by/)).toBeVisible();
    await expect(page.getByRole('button', { name: 'Link coming soon' })).toBeDisabled();
  });

  test('a past meeting shows an ended state with no join action', async ({ page }) => {
    await page.goto('/community/meetings');
    await page.getByRole('link', { name: 'Welcome Session' }).click();

    await expect(page).toHaveURL('/community/meetings/welcome-session');
    await expect(page.getByRole('button', { name: 'Ended' })).toBeDisabled();
  });

  test('a nonexistent meeting shows the not-found page, not a crash', async ({ page }) => {
    // Note: the HTTP status here is a known Next.js App Router limitation
    // (200, not 404) — see error-states.spec.ts for details.
    await page.goto('/community/meetings/this-meeting-does-not-exist');
    await expect(page.getByRole('heading', { name: 'Page not found' })).toBeVisible();
  });
});
