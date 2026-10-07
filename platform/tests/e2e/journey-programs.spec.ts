import { test, expect } from './fixtures/base';
import { ADMIN_USER, AUTH_STORAGE_STATE, PRACTICE_WITH_INSTRUCTIONS } from './fixtures/data';
import { loginViaUi } from './fixtures/auth-helpers';

const NO_ACCESS_CARD = '[data-testid="program-not-available"], [data-testid="program-purchase"]';

// P3–P6: persisted practice sessions with private check-ins, favorites,
// Journey, and the Reset Programs entitlement boundary + sequential unlock.
// Checkout is disabled (lib/features.ts), so the only way in is an Admin
// grant — or being an Admin, which is what the program-flow test uses.

test.describe('Practice session (signed in) → Journey', () => {
  test.use({ storageState: AUTH_STORAGE_STATE });

  test('check-ins and a private note are saved to the account and appear in Journey', async ({ page }) => {
    const note = `e2e note ${Date.now()}`;
    await page.goto(`/practices/${PRACTICE_WITH_INSTRUCTIONS}`);

    await page.getByTestId('practice-begin').click();
    await expect(page.getByRole('heading', { name: 'Before you start' })).toBeVisible();
    const tension = page.getByRole('button', { name: 'Tension', exact: true });
    await tension.click();
    await expect(tension).toHaveAttribute('aria-pressed', 'true');
    await page.getByRole('button', { name: /Begin/ }).click();

    await page.getByTestId('practice-mode').getByRole('button', { name: 'Finish', exact: true }).first().click();
    await expect(page.getByRole('heading', { name: 'Take a moment' })).toBeVisible();
    await page.getByRole('button', { name: 'Calmer', exact: true }).click();
    await page.getByLabel(/What did you notice\?/).fill(note);
    await page.getByTestId('practice-save').click();

    await expect(page.getByTestId('practice-complete').getByRole('heading', { name: 'Practice complete.' })).toBeVisible();

    await page.goto('/journey');
    await expect(page.getByRole('heading', { name: 'Your journey', exact: true })).toBeVisible();
    await expect(page.getByTestId('journey-notes').getByText(note)).toBeVisible();
    const recent = page.getByTestId('recent-practice');
    await expect(recent.getByText('Before: Tension').first()).toBeVisible();
    await expect(recent.getByText('After: Calmer').first()).toBeVisible();
    // Account-measured stats are shown (at least this session).
    await expect(page.getByTestId('practices-completed-stat').locator('p').first()).not.toHaveText('0');
    await expect(page.getByTestId('minutes-stat')).toBeVisible();
  });

  test('favorites can be saved and removed, and show in Journey', async ({ page }) => {
    await page.goto(`/practices/${PRACTICE_WITH_INSTRUCTIONS}`);
    const fav = page.getByTestId('favorite-button');
    // The button updates optimistically — wait for the server to confirm
    // each change before reloading.
    const toggle = async (method: 'PUT' | 'DELETE') => {
      const saved = page.waitForResponse((r) => r.url().includes('/api/favorites/') && r.request().method() === method);
      await fav.click();
      expect((await saved).ok()).toBe(true);
    };
    if ((await fav.getAttribute('aria-pressed')) === 'true') await toggle('DELETE');
    await toggle('PUT');
    await expect(fav).toHaveAttribute('aria-pressed', 'true');

    await page.reload();
    await expect(page.getByTestId('favorite-button')).toHaveAttribute('aria-pressed', 'true');

    await page.goto('/journey');
    const favorites = page.getByRole('heading', { name: 'Favorites' }).locator('..');
    await expect(favorites.getByRole('link').first()).toBeVisible();

    // Leave no lasting favorite behind.
    await page.goto(`/practices/${PRACTICE_WITH_INSTRUCTIONS}`);
    await toggle('DELETE');
    await expect(fav).toHaveAttribute('aria-pressed', 'false');
  });

  test('a member without access cannot open program days, by page or by API', async ({ page }) => {
    await page.goto('/practices/programs/28-days');
    // No access: either the inert "not available" card or, with Stripe test
    // checkout enabled, the purchase card — never the program itself.
    await expect(page.locator(NO_ACCESS_CARD)).toBeVisible();
    await expect(page.getByTestId('program-continue')).toHaveCount(0);

    await page.goto('/practices/programs/28-days/day/1');
    await expect(page.getByTestId('program-no-access')).toBeVisible();
    await expect(page.getByTestId('program-item')).toHaveCount(0);

    const res = await page.request.post('/api/programs/28-days/items/28d-d01-1/complete');
    expect(res.status()).toBe(403);
    const reflection = await page.request.put('/api/programs/28-days/days/1/reflection', { data: { note: 'x' } });
    expect(reflection.status()).toBe(403);
  });
});

test.describe('Reset Programs (signed out)', () => {
  test('overview is public but days require sign-in', async ({ page }) => {
    await page.goto('/practices/programs/3-days');
    await expect(page.getByRole('heading', { level: 1, name: '3 Day Reset' })).toBeVisible();
    // No access: either the inert "not available" card or, with Stripe test
    // checkout enabled, the purchase card — never the program itself.
    await expect(page.locator(NO_ACCESS_CARD)).toBeVisible();
    // Placeholder documents are clearly marked, never invented.
    await expect(page.locator('[data-content-required="true"]').first()).toBeVisible();

    await page.goto('/practices/programs/3-days/day/1');
    await expect(page).toHaveURL(/\/login\?callbackUrl=/);
  });
});

test.describe('Reset Programs (admin access, sequential unlock)', () => {
  test.beforeEach(async ({ page }) => {
    await loginViaUi(page, ADMIN_USER, { expectedUrl: '/admin' });
  });

  test('day 1 opens, completing it opens day 2, later days stay locked; reflections save', async ({ page }) => {
    await page.goto('/practices/programs/3-days');
    await expect(page.getByText('Admin preview — full access without a purchase.')).toBeVisible();

    await page.goto('/practices/programs/3-days/day/1');
    await expect(page.getByRole('heading', { level: 1, name: 'Day 1 of 3' })).toBeVisible();
    // Day 1 of the 3 Day Reset has a single (placeholder) item. A previous
    // run may already have completed it — progress persists per account.
    const markDone = page.getByTestId('item-mark-done');
    if ((await markDone.count()) > 0) await markDone.click();
    await expect(page.getByTestId('item-done')).toHaveCount(1);
    await expect(page.getByTestId('program-day-complete')).toBeVisible();

    await page.getByLabel(/What did you notice\?/).fill('e2e reflection');
    await page.getByTestId('reflection-save').click();
    await expect(page.getByRole('status').filter({ hasText: 'Saved' })).toBeVisible();

    await page.getByRole('link', { name: /Continue to day 2/ }).click();
    await expect(page.getByRole('heading', { level: 1, name: 'Day 2 of 3' })).toBeVisible();

    // Day 2 isn't done, so day 3 is locked — by page and by API.
    await page.goto('/practices/programs/3-days/day/3');
    await expect(page.getByTestId('program-day-locked')).toBeVisible();
    const res = await page.request.post('/api/programs/3-days/items/3d-d03-1/complete');
    expect(res.status()).toBe(403);
    expect((await res.json()).error.code).toBe('DAY_LOCKED');
  });
});
