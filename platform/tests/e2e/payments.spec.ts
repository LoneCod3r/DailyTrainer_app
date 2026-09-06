import { test, expect } from './fixtures/base';
import { AUTH_STORAGE_STATE } from './fixtures/data';

// Stripe is intentionally NOT configured in this local environment
// (.env has the placeholder STRIPE_SECRET_KEY=sk_test_replace_me), so these
// tests exercise the real "unavailable/unconfigured" product behavior —
// never a fabricated successful payment. See the final report for what this
// means could not be executed (amount-selection UI only renders once Stripe
// is configured).

test.describe('Membership, Billing and Donation (authenticated)', () => {
  test.use({ storageState: AUTH_STORAGE_STATE });

  test('membership page loads and shows the no-plans-yet empty state', async ({ page }) => {
    await page.goto('/account/membership');
    await expect(page.getByRole('heading', { name: 'Membership', exact: true })).toBeVisible();
    await expect(page.getByText('No membership plans available yet')).toBeVisible();
    await expect(page.getByText("You don't have an active membership yet")).toBeVisible();
  });

  test('a cancelled checkout query param shows the cancelled notice', async ({ page }) => {
    await page.goto('/account/membership?checkout=cancelled');
    await expect(page.getByText('Checkout cancelled')).toBeVisible();
    await expect(page.getByText('your card was not charged')).toBeVisible();
  });

  test('billing page loads with the no-billing-history empty state', async ({ page }) => {
    await page.goto('/account/billing');
    await expect(page.getByRole('heading', { name: 'Billing', exact: true })).toBeVisible();
    await expect(page.getByText('No billing history yet')).toBeVisible();
    // Does not crash or fake a subscription just because Stripe is unconfigured.
    await expect(page.getByText('Current subscription')).toHaveCount(0);
  });

  test('donation page loads and shows the unavailable state instead of a fake payment form', async ({ page }) => {
    await page.goto('/account/donation');
    await expect(page.getByRole('heading', { name: 'Donation', exact: true })).toBeVisible();
    await expect(
      page.getByText('Donations are not available right now — payment configuration is incomplete.'),
    ).toBeVisible();

    // No amount-selection controls render while Stripe is unconfigured — the
    // component gates the whole form, not just the submit action.
    await expect(page.getByRole('button', { name: '€5' })).toHaveCount(0);
    await expect(page.getByRole('button', { name: '€10' })).toHaveCount(0);
    await expect(page.getByRole('button', { name: /custom amount/i })).toHaveCount(0);
  });
});

test.describe('Membership, Billing and Donation (unauthenticated)', () => {
  for (const path of ['/account/membership', '/account/billing', '/account/donation']) {
    test(`${path} redirects an unauthenticated visitor to login`, async ({ page }) => {
      await page.goto(path);
      if (path === '/account/membership') {
        // Membership plans are publicly browsable; only Billing/Donation are
        // fully gated. Confirm it renders (not protected data) instead.
        await expect(page.getByRole('heading', { name: 'Membership', exact: true })).toBeVisible();
        return;
      }
      await expect(page).toHaveURL(new RegExp(`/login\\?callbackUrl=${path}`));
    });
  }
});
