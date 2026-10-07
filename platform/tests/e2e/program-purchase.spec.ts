import Stripe from 'stripe';
import { test, expect } from './fixtures/base';
import { AUTH_STORAGE_STATE } from './fixtures/data';

// Reset Program purchase flow in Stripe TEST MODE, against the real app and
// the real Stripe test API: the app creates a genuine Checkout Session, and
// payment outcomes are delivered as properly *signed* webhook events to the
// real /api/webhooks/stripe route (the same verification Stripe's own
// deliveries go through). No card entry is automated here — see
// docs/v1-implementation-notes.md for the manual test-card flow.
//
// Runs only when test checkout is enabled (NEXT_PUBLIC_FEATURE_PROGRAM_CHECKOUT)
// with Stripe test keys configured.
const enabled =
  process.env.NEXT_PUBLIC_FEATURE_PROGRAM_CHECKOUT === 'true' &&
  Boolean(process.env.STRIPE_SECRET_KEY?.startsWith('sk_test_')) &&
  Boolean(process.env.STRIPE_WEBHOOK_SECRET);

test.describe('Reset Program purchase (Stripe test mode)', () => {
  test.skip(!enabled, 'test checkout not enabled in this environment');
  test.use({ storageState: AUTH_STORAGE_STATE });
  test.describe.configure({ mode: 'serial' });

  const stripe = new Stripe(process.env.STRIPE_SECRET_KEY ?? 'sk_test_unset', { apiVersion: '2024-06-20' });
  const PROGRAM = '3-days';

  async function sendSignedEvent(page: import('@playwright/test').Page, type: string, object: Record<string, unknown>) {
    const payload = JSON.stringify({
      id: `evt_e2e_${type}_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`,
      object: 'event',
      type,
      data: { object },
    });
    const header = stripe.webhooks.generateTestHeaderString({ payload, secret: process.env.STRIPE_WEBHOOK_SECRET! });
    return page.request.post('/api/webhooks/stripe', {
      headers: { 'stripe-signature': header, 'content-type': 'application/json' },
      data: payload,
    });
  }

  async function startCheckout(page: import('@playwright/test').Page) {
    const res = await page.request.post(`/api/programs/${PROGRAM}/checkout`);
    expect(res.status(), await res.text()).toBe(200);
    const { url } = await res.json();
    expect(url).toMatch(/^https:\/\/checkout\.stripe\.com\//);
    const sessionId = new URL(url).pathname.split('/').pop()!;
    const session = await stripe.checkout.sessions.retrieve(sessionId);
    // A real one-time Checkout Session at the catalog price.
    expect(session.mode).toBe('payment');
    expect(session.amount_total).toBe(3900);
    expect(session.currency).toBe('eur');
    expect(session.metadata).toMatchObject({ kind: 'program', productSlug: 'reset-3-days', programSlug: PROGRAM });
    return session;
  }

  test('no access before payment; an unpaid session grants nothing', async ({ page }) => {
    await page.goto(`/practices/programs/${PROGRAM}/day/1`);
    await expect(page.getByTestId('program-no-access')).toBeVisible();

    const session = await startCheckout(page);
    const res = await sendSignedEvent(page, 'checkout.session.completed', { ...session, payment_status: 'unpaid' });
    expect(res.status()).toBe(200);

    await page.goto(`/practices/programs/${PROGRAM}/day/1`);
    await expect(page.getByTestId('program-no-access')).toBeVisible();
  });

  test('a cancelled return shows a calm notice and grants nothing', async ({ page }) => {
    await page.goto(`/practices/programs/${PROGRAM}?purchase=cancelled`);
    await expect(page.getByTestId('purchase-cancelled')).toBeVisible();
    await expect(page.getByTestId('program-purchase')).toBeVisible();
  });

  test('a returning redirect alone grants nothing', async ({ page }) => {
    await page.goto(`/practices/programs/${PROGRAM}?purchase=success&session_id=cs_test_forged`);
    await expect(page.getByTestId('purchase-pending')).toBeVisible();
    await page.goto(`/practices/programs/${PROGRAM}/day/1`);
    await expect(page.getByTestId('program-no-access')).toBeVisible();
  });

  test('a verified paid webhook opens the program; retries are idempotent; a refund ends access', async ({ page }) => {
    const session = await startCheckout(page);
    const paymentIntent = `pi_e2e_${Date.now()}`;
    const paid = { ...session, payment_status: 'paid', payment_intent: paymentIntent };

    // A forged signature is rejected outright.
    const forged = await page.request.post('/api/webhooks/stripe', {
      headers: { 'stripe-signature': 't=1,v1=bad', 'content-type': 'application/json' },
      data: JSON.stringify({ id: 'evt_forged', type: 'checkout.session.completed', data: { object: paid } }),
    });
    expect(forged.status()).toBe(400);

    expect((await sendSignedEvent(page, 'checkout.session.completed', paid)).status()).toBe(200);
    // Stripe retries / duplicate deliveries (new event ids, same session).
    expect((await sendSignedEvent(page, 'checkout.session.completed', paid)).status()).toBe(200);
    expect((await sendSignedEvent(page, 'checkout.session.async_payment_succeeded', paid)).status()).toBe(200);

    await page.goto(`/practices/programs/${PROGRAM}/day/1`);
    await expect(page.getByRole('heading', { level: 1, name: 'Day 1 of 3' })).toBeVisible();

    await page.goto(`/practices/programs/${PROGRAM}`);
    await expect(page.getByTestId('program-continue')).toBeVisible();

    await page.goto('/account');
    const rows = page.getByTestId('program-purchases').locator('li').filter({ hasText: '3 Day Reset' });
    const succeeded = rows.filter({ has: page.getByTestId('purchase-status').filter({ hasText: 'Succeeded' }) });
    await expect(succeeded).toHaveCount(1); // one purchase, despite three deliveries
    await expect(succeeded.getByTestId('purchase-access')).toHaveText('Access open');

    // Already owned → no second checkout.
    expect((await page.request.post(`/api/programs/${PROGRAM}/checkout`)).status()).toBe(409);

    // Full refund ends access.
    expect(
      (await sendSignedEvent(page, 'charge.refunded', { object: 'charge', payment_intent: paymentIntent, refunded: true })).status(),
    ).toBe(200);
    await page.goto(`/practices/programs/${PROGRAM}/day/1`);
    await expect(page.getByTestId('program-no-access')).toBeVisible();
  });

  test('Community and Trainer cannot be checked out', async ({ page }) => {
    for (const slug of ['community', 'trainer']) {
      expect((await page.request.post(`/api/programs/${slug}/checkout`)).status()).toBe(404);
    }
  });
});
