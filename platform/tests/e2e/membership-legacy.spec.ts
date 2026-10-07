import { test, expect } from './fixtures/base';
import { ADMIN_USER, AUTH_STORAGE_STATE } from './fixtures/data';
import { loginViaUi } from './fixtures/auth-helpers';

// V1: the legacy "KUKO WAY Premium" €29.99/month plan is not a current
// product. Membership sales are closed (lib/features.ts); Community is a
// future product. Existing subscribers are untouched and still recognised.
const SALES_OPEN = process.env.NEXT_PUBLIC_FEATURE_MEMBERSHIP_SALES === 'true';

test.describe('Legacy membership plan is not sold (visitors)', () => {
  test.skip(SALES_OPEN, 'membership sales are explicitly open in this environment');

  test('the membership page offers no plan, price or Join action', async ({ page }) => {
    await page.goto('/account/membership');
    const main = page.getByRole('main');
    await expect(main.getByRole('heading', { level: 1, name: 'Membership isn’t offered at the moment' })).toBeVisible();
    await expect(main).not.toContainText('KUKO WAY Premium');
    await expect(main).not.toContainText(/29[.,]99/);
    await expect(main.getByRole('button', { name: /join/i })).toHaveCount(0);
    await main.getByRole('link', { name: 'Explore the Reset Programs →' }).click();
    await expect(page).toHaveURL('/practices/programs');
  });

  test('the public plans endpoint lists nothing', async ({ page }) => {
    const res = await page.request.get('/api/membership/plans');
    expect(res.status()).toBe(200);
    expect(await res.json()).toEqual({ plans: [] });
  });

  test('Bulgarian: the calm "not offered" notice', async ({ page, context, baseURL }) => {
    await context.addCookies([{ name: 'ptd_locale', value: 'bg', url: baseURL! }]);
    await page.goto('/account/membership');
    await expect(page.getByRole('heading', { level: 1, name: 'В момента не предлагаме абонамент' })).toBeVisible();
    await expect(page.getByRole('main')).not.toContainText(/29[.,]99/);
  });

  test('Reset prices are unchanged and Community stays "coming later"', async ({ page }) => {
    await page.goto('/practices/programs');
    for (const [slug, price] of [
      ['1-day', '€19'],
      ['3-days', '€39'],
      ['7-days', '€79'],
      ['28-days', '€149'],
    ]) {
      await expect(page.getByTestId(`program-tile-${slug}`).getByTestId('price-tag')).toContainText(price);
    }
    const community = page.getByTestId('future-product-community');
    await expect(community.getByRole('button', { name: 'Coming soon' })).toBeDisabled();
    await expect(page.getByRole('main')).not.toContainText('KUKO WAY Premium');
  });
});

// The seed creates no membership plans or subscriptions, so whether the demo
// member has a legacy subscription depends on the environment (it does
// locally after manual Stripe test-mode activity; it does not in CI). Like
// payments.spec.ts does when no plan is published, these tests skip — with
// that reason — where the data isn't there. Recognition of existing
// subscribers is covered in every environment by the unit tests
// (tests/membership.test.ts, tests/current-subscription.test.ts).
async function skipUnlessDemoMemberHasSubscription(page: import('@playwright/test').Page) {
  await page.goto('/account/membership');
  await expect(page.getByTestId('membership-sales-closed')).toBeVisible();
  const noSubscription = await page
    .getByRole('heading', { level: 1, name: 'Membership isn’t offered at the moment' })
    .isVisible();
  test.skip(noSubscription, 'The demo member has no membership subscription in this environment (none is seeded)');
}

test.describe('Existing legacy subscriber (demo member, active "KUKO WAY Premium")', () => {
  test.skip(SALES_OPEN, 'membership sales are explicitly open in this environment');
  test.use({ storageState: AUTH_STORAGE_STATE });

  test('still sees their own active subscription — but no plan list or Join', async ({ page }) => {
    await skipUnlessDemoMemberHasSubscription(page);
    const main = page.getByRole('main');
    await expect(main.getByRole('heading', { name: 'Your membership', exact: true })).toBeVisible();
    await expect(main.getByText('KUKO WAY Premium')).toBeVisible();
    await expect(main.getByText('Active', { exact: true })).toBeVisible();
    await expect(main.getByText('Your existing subscription stays active.', { exact: false })).toBeVisible();
    await expect(main.getByRole('heading', { name: 'Available plans' })).toHaveCount(0);
    await expect(main.getByRole('button', { name: /join/i })).toHaveCount(0);
    await main.getByRole('link', { name: 'Go to Billing' }).click();
    await expect(page).toHaveURL('/account/billing');
  });

  test('Billing still shows the existing subscription as current', async ({ page }) => {
    await skipUnlessDemoMemberHasSubscription(page);
    await page.goto('/account/billing');
    await expect(page.getByText('Current subscription')).toBeVisible();
    await expect(page.getByRole('main').getByText('KUKO WAY Premium')).toBeVisible();
  });
});

// Signed in as the seeded Admin, not the demo member: the subscribe rate
// limit is per user (10/min), and security-hardening.spec.ts spends the demo
// member's budget testing it — sharing that bucket would make either test
// fail depending on timing.
test.describe('No checkout path for the legacy plan', () => {
  test.skip(SALES_OPEN, 'membership sales are explicitly open in this environment');

  test('a new membership checkout is refused', async ({ page }) => {
    await loginViaUi(page, ADMIN_USER, { expectedUrl: '/admin' });
    const res = await page.request.post('/api/membership/subscribe', { data: { membershipPlanId: 'cplanignored0000000000' } });
    expect(res.status()).toBe(403);
    expect((await res.json()).error.code).toBe('MEMBERSHIP_SALES_CLOSED');
  });
});
