import { test, expect } from './fixtures/base';
import { AUTH_STORAGE_STATE } from './fixtures/data';
import { registerCleanUser } from './fixtures/auth-helpers';

// Stripe may or may not be configured in the environment these run against
// (a real test-mode STRIPE_SECRET_KEY vs. the placeholder sk_test_replace_me),
// and the amount-selection UI only renders once it is. The Donation tests
// therefore skip themselves in whichever state doesn't apply rather than
// fail, and none of them ever click Donate or create a Checkout Session.
//
// The clean-account Billing/Membership tests below deliberately do NOT depend
// on the shared demo member's (member@example.dev) Stripe state: that account
// may have manual test-mode activity (subscription, customer, saved card,
// invoices), so they register a fresh user with none instead.

test.describe('Support navigation (authenticated)', () => {
  test.use({ storageState: AUTH_STORAGE_STATE });

  test('Support is a direct header link to /account/donation, not inside the user menu', async ({ page }) => {
    await page.goto('/account');
    const support = page.getByRole('navigation', { name: 'Main' }).getByRole('link', { name: 'Support', exact: true });
    await expect(support).toBeVisible();
    await expect(support).toHaveAttribute('href', '/account/donation');

    await page.getByRole('button', { name: /demo member/i }).click();
    await expect(page.getByRole('link', { name: 'Billing', exact: true })).toBeVisible();
    await expect(page.getByRole('link', { name: 'Donation', exact: true })).toHaveCount(0);

    await support.click();
    await expect(page).toHaveURL('/account/donation');
  });
});

// The amount tiles are visually-hidden native radios inside a <label>, so a
// user's click lands on the tile — mirror that instead of clicking the 1px input.
async function pickAmount(page: import('@playwright/test').Page, name: string) {
  await page.locator('label', { has: page.getByRole('radio', { name, exact: true }) }).click();
}

test.describe('Membership, Billing and Donation (authenticated)', () => {
  test.use({ storageState: AUTH_STORAGE_STATE });

  test('a cancelled checkout query param shows the cancelled notice', async ({ page }) => {
    await page.goto('/account/membership?checkout=cancelled');
    await expect(page.getByText('Checkout cancelled')).toBeVisible();
    await expect(page.getByText('your card was not charged')).toBeVisible();
  });

  test('donation page loads and shows the unavailable state instead of a fake payment form', async ({ page }) => {
    await page.goto('/account/donation');
    await expect(page.getByRole('heading', { name: 'Support DailyTrainer', exact: true })).toBeVisible();
    test.skip(
      (await page.getByRole('radio').count()) > 0,
      'Stripe is configured in this environment, so the amount form renders instead',
    );
    await expect(
      page.getByText('Donations are not available right now — payment configuration is incomplete.'),
    ).toBeVisible();

    // No amount-selection controls render while Stripe is unconfigured — the
    // component gates the whole form, not just the submit action.
    await expect(page.getByRole('button', { name: '€5' })).toHaveCount(0);
    await expect(page.getByRole('button', { name: '€10' })).toHaveCount(0);
    await expect(page.getByRole('radio')).toHaveCount(0);
  });
});

// The amount-selection UI only renders once Stripe is configured, so these
// run only in an environment with a real (test-mode) STRIPE_SECRET_KEY and
// skip themselves — rather than fail — against the placeholder key. They
// never click the Donate button, so no Checkout Session is created.
test.describe('Donation amount selection (authenticated, Stripe configured)', () => {
  test.use({ storageState: AUTH_STORAGE_STATE });

  test.beforeEach(async ({ page }) => {
    await page.goto('/account/donation');
    await expect(page.getByRole('heading', { name: 'Support DailyTrainer', exact: true })).toBeVisible();
    const unavailable = await page
      .getByText('Donations are not available right now — payment configuration is incomplete.')
      .isVisible();
    test.skip(unavailable, 'Stripe is not configured in this environment');
  });

  test('starts with no amount selected and a disabled "Choose an amount" CTA', async ({ page }) => {
    const group = page.getByRole('radiogroup', { name: 'Choose an amount' });
    await expect(group.getByRole('radio')).toHaveCount(5);
    await expect(group.getByRole('radio', { checked: true })).toHaveCount(0);
    for (const label of ['€5', '€10', '€25', '€50', 'Custom']) {
      await expect(group.getByRole('radio', { name: label, exact: true })).toBeVisible();
    }
    await expect(page.getByRole('button', { name: 'Choose an amount' })).toBeDisabled();
    await expect(page.getByText('Secure payment via Stripe')).toBeVisible();
  });

  test('selecting a fixed amount updates the CTA and the checked state', async ({ page }) => {
    await pickAmount(page, '€5');
    await expect(page.getByRole('radio', { name: '€5', exact: true })).toBeChecked();
    await expect(page.getByRole('button', { name: 'Donate €5' })).toBeEnabled();
    // Selected state is border/tint only — no checkmark or other icon on any tile.
    await expect(page.locator('label:has(input[name="donation-amount"]) svg')).toHaveCount(0);

    await pickAmount(page, '€25');
    await expect(page.getByRole('radio', { name: '€5', exact: true })).not.toBeChecked();
    await expect(page.getByRole('button', { name: 'Donate €25' })).toBeEnabled();
  });

  test('Custom reveals a focused amount input and only enables the CTA for a valid amount', async ({ page }) => {
    await pickAmount(page, 'Custom');
    const input = page.getByRole('textbox', { name: 'Custom amount (EUR)' });
    await expect(input).toBeVisible();
    await expect(input).toBeFocused();
    await expect(page.getByRole('button', { name: 'Choose an amount' })).toBeDisabled();

    await input.fill('0.5');
    await expect(page.getByText('Minimum donation is €1.')).toBeVisible();
    await expect(page.getByRole('button', { name: 'Choose an amount' })).toBeDisabled();

    await input.fill('100001');
    await expect(page.getByText('Maximum donation is €100,000.')).toBeVisible();
    await expect(page.getByRole('button', { name: 'Choose an amount' })).toBeDisabled();

    await input.fill('abc');
    await expect(page.getByText('Please enter a valid amount.')).toBeVisible();
    await expect(page.getByRole('button', { name: 'Choose an amount' })).toBeDisabled();

    await input.fill('15,50');
    await expect(page.getByRole('button', { name: 'Donate €15.50' })).toBeEnabled();
    await input.fill('15');
    await expect(page.getByRole('button', { name: 'Donate €15' })).toBeEnabled();
  });

  test('arrow keys move the selection through the radio group', async ({ page }) => {
    await pickAmount(page, '€5');
    await page.keyboard.press('ArrowRight');
    await expect(page.getByRole('radio', { name: '€10', exact: true })).toBeChecked();
    await expect(page.getByRole('radio', { name: '€5', exact: true })).not.toBeChecked();
    await expect(page.getByRole('button', { name: 'Donate €10' })).toBeEnabled();
  });

  test('a cancelled checkout returns to the page with the form still available', async ({ page }) => {
    await page.goto('/account/donation?donation=cancelled');
    await expect(page.getByText('Donation cancelled')).toBeVisible();
    await expect(page.getByRole('radio')).toHaveCount(5);
  });
});

// A brand-new account per test (see registerCleanUser) instead of the shared
// demo member, so these never depend on manual Stripe test-mode activity
// (subscription, customer, saved card, invoices) done on member@example.dev.
test.describe('Membership and Billing (new account, no Stripe activity)', () => {
  test('a new user without a membership sees the available plan with a Join action', async ({ page }) => {
    await registerCleanUser(page, 'membership');
    await page.goto('/account/membership');
    await expect(page.getByRole('heading', { name: 'Available plans', exact: true })).toBeVisible();

    // Plans are published by an admin (which also creates them in Stripe), so
    // a database with none published has nothing to join — that is a
    // different state from "this user has no membership", covered below.
    const noPlans = await page.getByText('No membership plans available yet').isVisible();
    test.skip(noPlans, 'No membership plan is published in this environment');

    await expect(page.getByRole('button', { name: 'Join', exact: true })).toBeVisible();

    // Not an active member: the status card says so and shows no subscription.
    await expect(page.getByRole('heading', { name: 'Your membership', exact: true })).toBeVisible();
    await expect(page.getByText("You don't have an active membership yet")).toBeVisible();
    await expect(page.getByText('Renews on')).toHaveCount(0);
    await expect(page.getByRole('link', { name: 'Manage billing' })).toHaveCount(0);
    await expect(page.getByRole('button', { name: 'Activated' })).toHaveCount(0);
  });

  test('a new user sees the empty Billing state with no subscription, card or invoices', async ({ page }) => {
    await registerCleanUser(page, 'billing');
    await page.goto('/account/billing');
    await expect(page.getByRole('heading', { name: 'Billing', exact: true })).toBeVisible();
    await expect(page.getByText('No billing history yet')).toBeVisible();
    // Does not crash or fake a subscription/payment method for an account
    // that never went through checkout.
    await expect(page.getByText('Current subscription')).toHaveCount(0);
    await expect(page.getByText('Invoice history')).toHaveCount(0);
  });
});

test.describe('Membership, Billing and Donation (unauthenticated)', () => {
  for (const path of ['/account/membership', '/account/billing', '/account/donation']) {
    test(`${path} redirects an unauthenticated visitor to login`, async ({ page }) => {
      await page.goto(path);
      if (path === '/account/membership') {
        // Membership plans are publicly browsable; only Billing/Donation are
        // fully gated. Confirm it renders (not protected data) instead — no
        // redirect to /login, and the page's own content is visible. The
        // generic "Membership" header was intentionally removed (see
        // app/(app)/account/membership/page.tsx), so "Available plans" is
        // the stable heading that proves the real page rendered.
        await expect(page).toHaveURL('/account/membership');
        await expect(page.getByRole('heading', { name: 'Available plans', exact: true })).toBeVisible();
        return;
      }
      await expect(page).toHaveURL(new RegExp(`/login\\?callbackUrl=${path}`));
    });
  }
});
