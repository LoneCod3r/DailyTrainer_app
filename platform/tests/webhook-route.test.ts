import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';

// Route-level tests for the Stripe webhook endpoint, mirroring the pattern in
// tests/users-api.test.ts: the real route handler runs, with only the Stripe
// client and the billing service's handleWebhook mocked out — so this proves
// the signature-verification boundary itself (app/api/webhooks/stripe/
// route.ts), not billing.service.ts's event-processing logic, which is
// already covered by tests/billing.test.ts's handleWebhook idempotency suite.
const stripeMock = {
  webhooks: { constructEvent: vi.fn() },
};
vi.mock('@/lib/stripe', () => ({ getStripeClient: () => stripeMock }));

vi.mock('@/modules/payments/billing.service', () => ({ handleWebhook: vi.fn() }));

const { handleWebhook } = await import('@/modules/payments/billing.service');
const { POST } = await import('@/app/api/webhooks/stripe/route');

// The route reads process.env.STRIPE_WEBHOOK_SECRET directly, so each test
// controls it explicitly rather than relying on whatever .env (not loaded by
// vitest) happens to have — restored afterwards so this file can't leak
// state into any test that runs after it.
const ORIGINAL_WEBHOOK_SECRET = process.env.STRIPE_WEBHOOK_SECRET;

function postWith(body: string, headers: Record<string, string> = {}): Request {
  return new Request('http://localhost/api/webhooks/stripe', { method: 'POST', body, headers });
}

beforeEach(() => {
  vi.clearAllMocks();
});

afterEach(() => {
  if (ORIGINAL_WEBHOOK_SECRET === undefined) delete process.env.STRIPE_WEBHOOK_SECRET;
  else process.env.STRIPE_WEBHOOK_SECRET = ORIGINAL_WEBHOOK_SECRET;
});

describe('POST /api/webhooks/stripe — signature verification', () => {
  it('rejects a request with no stripe-signature header, without touching Stripe or the webhook handler', async () => {
    process.env.STRIPE_WEBHOOK_SECRET = 'whsec_test_secret';

    const res = await POST(postWith('{}'));

    expect(res.status).toBe(400);
    expect(await res.json()).toEqual({ error: 'Webhook not configured' });
    expect(stripeMock.webhooks.constructEvent).not.toHaveBeenCalled();
    expect(handleWebhook).not.toHaveBeenCalled();
  });

  it('rejects a request when STRIPE_WEBHOOK_SECRET is not configured, even with a signature header present', async () => {
    delete process.env.STRIPE_WEBHOOK_SECRET;

    const res = await POST(postWith('{}', { 'stripe-signature': 't=1,v1=deadbeef' }));

    expect(res.status).toBe(400);
    expect(await res.json()).toEqual({ error: 'Webhook not configured' });
    expect(stripeMock.webhooks.constructEvent).not.toHaveBeenCalled();
    expect(handleWebhook).not.toHaveBeenCalled();
  });

  it('rejects a request whose signature fails Stripe verification, without reaching the webhook handler', async () => {
    process.env.STRIPE_WEBHOOK_SECRET = 'whsec_test_secret';
    stripeMock.webhooks.constructEvent.mockImplementation(() => {
      throw new Error('No signatures found matching the expected signature for payload');
    });

    const res = await POST(postWith('{}', { 'stripe-signature': 't=1,v1=wrong' }));

    expect(res.status).toBe(400);
    expect(await res.json()).toEqual({ error: 'Invalid signature' });
    expect(handleWebhook).not.toHaveBeenCalled();
  });

  it('verifies the exact raw body bytes against the header and configured secret (not a re-serialized/parsed body)', async () => {
    process.env.STRIPE_WEBHOOK_SECRET = 'whsec_test_secret';
    const rawBody = '{"id":"evt_1","type":"checkout.session.completed"}';
    stripeMock.webhooks.constructEvent.mockReturnValue({ id: 'evt_1', type: 'checkout.session.completed' });
    (handleWebhook as any).mockResolvedValue({ duplicate: false });

    await POST(postWith(rawBody, { 'stripe-signature': 't=1,v1=goodsig' }));

    expect(stripeMock.webhooks.constructEvent).toHaveBeenCalledWith(rawBody, 't=1,v1=goodsig', 'whsec_test_secret');
  });

  it('a valid signature continues into webhook processing and returns its result', async () => {
    process.env.STRIPE_WEBHOOK_SECRET = 'whsec_test_secret';
    const event = { id: 'evt_ok', type: 'checkout.session.completed' };
    stripeMock.webhooks.constructEvent.mockReturnValue(event);
    (handleWebhook as any).mockResolvedValue({ duplicate: false });

    const res = await POST(postWith('{}', { 'stripe-signature': 't=1,v1=goodsig' }));

    expect(handleWebhook).toHaveBeenCalledWith(event);
    expect(res.status).toBe(200);
    expect(await res.json()).toEqual({ received: true, duplicate: false });
  });

  it('returns 500 (so Stripe retries) when a verified event fails during processing', async () => {
    process.env.STRIPE_WEBHOOK_SECRET = 'whsec_test_secret';
    const event = { id: 'evt_fail', type: 'checkout.session.completed' };
    stripeMock.webhooks.constructEvent.mockReturnValue(event);
    (handleWebhook as any).mockRejectedValue(new Error('db unavailable'));

    const res = await POST(postWith('{}', { 'stripe-signature': 't=1,v1=goodsig' }));

    expect(res.status).toBe(500);
    expect(await res.json()).toEqual({ error: 'Webhook processing failed' });
  });
});
