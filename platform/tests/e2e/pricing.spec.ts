import { test, expect } from './fixtures/base';
import { AUTH_STORAGE_STATE } from './fixtures/data';

// Demo pricing / catalog for product review. Prices are visible; every
// purchase action is an inactive "Coming soon" — nothing may reach a
// checkout, subscription, donation or purchase route.
const PAYMENT_ROUTE = /\/api\/(membership|donations|checkout|commerce|webhooks)\b|\/api\/programs\/[^/]+\/checkout|stripe\.com/;

// Reset checkout may be enabled in Stripe TEST MODE (lib/features.ts). The
// overview then shows the test purchase action instead of "Coming soon";
// either way, simply viewing a page never calls a payment route.
const CHECKOUT_ENABLED =
  process.env.NEXT_PUBLIC_FEATURE_PROGRAM_CHECKOUT === 'true' &&
  Boolean(process.env.STRIPE_SECRET_KEY?.startsWith('sk_test_'));

const RESET_PRICES_EN: [string, string][] = [
  ['1-day', '€19'],
  ['3-days', '€39'],
  ['7-days', '€79'],
  ['28-days', '€149'],
];

test.describe('Reset Programs pricing (EN)', () => {
  test('shows the four Reset Programs with their one-time prices', async ({ page }) => {
    await page.goto('/practices/programs');
    for (const [slug, price] of RESET_PRICES_EN) {
      const tile = page.getByTestId(`program-tile-${slug}`);
      const tag = tile.getByTestId('price-tag');
      await expect(tag).toHaveAttribute('data-price-kind', 'one-time');
      await expect(tag).toContainText(price);
      await expect(tag).toContainText('One-time payment');
      // A program is never presented as a subscription.
      await expect(tile).not.toContainText(/\/ (month|year)/);
      await expect(tile.getByText('View program →')).toBeVisible();
    }
    await expect(page.getByTestId('pricing-preview-note')).toHaveCount(CHECKOUT_ENABLED ? 0 : 1);
  });

  test('Community and Trainer are clearly future products with inactive actions', async ({ page }) => {
    await page.goto('/practices/programs');
    await expect(page.getByRole('heading', { name: 'Coming soon' })).toBeVisible();

    const community = page.getByTestId('future-product-community');
    await expect(community).toContainText('KUKO WAY Community');
    await expect(community.getByTestId('price-tag')).toHaveAttribute('data-price-kind', 'subscription');
    await expect(community.getByTestId('price-tag')).toContainText('€19');
    await expect(community.getByTestId('price-tag')).toContainText('€190');
    await expect(community.getByTestId('price-tag')).toContainText('/ month');
    await expect(community.getByTestId('price-tag')).toContainText('/ year');

    const trainer = page.getByTestId('future-product-trainer');
    await expect(trainer).toContainText('KUKO WAY Trainer Program');
    await expect(trainer.getByTestId('price-tag')).toContainText('€1,490');

    for (const card of [community, trainer]) {
      // The status badge and the inactive action both read "Coming soon".
      await expect(card.getByText('Coming soon', { exact: true })).toHaveCount(2);
      const cta = card.getByRole('button', { name: 'Coming soon' });
      await expect(cta).toBeDisabled();
      await expect(card.getByRole('link')).toHaveCount(0);
    }
  });

  test('the program overview (checkout disabled) shows its price and a disabled, inert "Coming soon"', async ({ page }) => {
    test.skip(CHECKOUT_ENABLED, 'test checkout is enabled here — see the next test');
    const paymentCalls: string[] = [];
    page.on('request', (req) => {
      if (PAYMENT_ROUTE.test(req.url())) paymentCalls.push(req.url());
    });

    await page.goto('/practices/programs/28-days');
    const box = page.getByTestId('program-not-available');
    await expect(box.getByTestId('price-tag')).toContainText('€149');
    await expect(box.getByTestId('price-tag')).toContainText('One-time payment');

    const cta = box.getByRole('button', { name: 'Coming soon' });
    await expect(cta).toBeDisabled();
    // Even a forced click on the disabled control does nothing.
    await cta.click({ force: true });
    await page.waitForTimeout(500);
    await expect(page).toHaveURL('/practices/programs/28-days');
    expect(paymentCalls).toEqual([]);

    // No buy/join/subscribe language anywhere in the commerce surfaces.
    await expect(page.getByRole('main')).not.toContainText(/buy now|join now|subscribe/i);
  });

  test('the program overview (test checkout enabled) is clearly marked as test mode', async ({ page }) => {
    test.skip(!CHECKOUT_ENABLED, 'test checkout not enabled here');
    const paymentCalls: string[] = [];
    page.on('request', (req) => {
      if (PAYMENT_ROUTE.test(req.url())) paymentCalls.push(req.url());
    });
    await page.goto('/practices/programs/28-days');
    const box = page.getByTestId('program-purchase');
    await expect(box.getByTestId('price-tag')).toContainText('€149');
    await expect(box.getByTestId('price-tag')).toContainText('One-time payment');
    await expect(box.getByText('Test mode', { exact: true })).toBeVisible();
    await expect(box).toContainText('no real payment is taken');
    // Signed out: a log-in link, not a payment action.
    await expect(box.getByRole('link', { name: 'Log in to continue →' })).toBeVisible();
    await expect(box.getByTestId('buy-program')).toHaveCount(0);
    expect(paymentCalls).toEqual([]);
    await expect(page.getByRole('main')).not.toContainText(/buy now|join now|subscribe/i);
  });
});

test.describe('Reset Programs pricing (signed in, no access)', () => {
  test.use({ storageState: AUTH_STORAGE_STATE });

  test('a member sees the same inert preview — no checkout, no access granted', async ({ page }) => {
    test.skip(CHECKOUT_ENABLED, 'test checkout is enabled here — covered by program-purchase.spec.ts');
    const paymentCalls: string[] = [];
    page.on('request', (req) => {
      if (PAYMENT_ROUTE.test(req.url())) paymentCalls.push(req.url());
    });
    await page.goto('/practices/programs/1-day');
    const box = page.getByTestId('program-not-available');
    await expect(box.getByTestId('price-tag')).toContainText('€19');
    await box.getByRole('button', { name: 'Coming soon' }).click({ force: true });
    await page.waitForTimeout(500);
    expect(paymentCalls).toEqual([]);

    // Still no access to the days afterwards.
    await page.goto('/practices/programs/1-day/day/1');
    await expect(page.getByTestId('program-no-access')).toBeVisible();
  });
});

test('Bulgarian: prices, one-time wording and "Очаквайте скоро"', async ({ page, context, baseURL }) => {
  await context.addCookies([{ name: 'ptd_locale', value: 'bg', url: baseURL! }]);
  await page.goto('/practices/programs');

  const tile = page.getByTestId('program-tile-28-days');
  await expect(tile.getByTestId('price-tag')).toContainText(/149\s?€/);
  await expect(tile.getByTestId('price-tag')).toContainText('Еднократно плащане');
  await expect(tile.getByText('Виж програмата →')).toBeVisible();

  await expect(page.getByRole('heading', { name: 'Предстои' })).toBeVisible();
  const community = page.getByTestId('future-product-community');
  await expect(community.getByTestId('price-tag')).toContainText('/ месец');
  await expect(community.getByTestId('price-tag')).toContainText('/ година');
  await expect(community.getByRole('button', { name: 'Очаквайте скоро' })).toBeDisabled();
});
