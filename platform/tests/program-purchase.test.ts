import { describe, it, expect, vi, beforeEach } from 'vitest';

// Reset Program one-time purchases (Stripe TEST MODE): checkout creation,
// webhook settlement → Purchase + Entitlement, idempotency, failures and
// refunds. Only the session, the database and Stripe are mocked.
const featureState = { programCheckout: true };
vi.mock('@/lib/features', () => ({
  features: {
    get programCheckout() {
      return featureState.programCheckout;
    },
    programsPreview: true,
    pricingPreview: true,
    membershipSales: false,
    founders: false,
  },
}));

const tx = { entitlement: { findFirst: vi.fn(), create: vi.fn() } };
vi.mock('@/lib/prisma', () => ({
  prisma: {
    purchase: { findFirst: vi.fn(), findUnique: vi.fn(), create: vi.fn(), update: vi.fn(), updateMany: vi.fn() },
    entitlement: { findFirst: vi.fn(), updateMany: vi.fn() },
    paymentEvent: { findUnique: vi.fn(), create: vi.fn(), updateMany: vi.fn(), upsert: vi.fn() },
    user: { findUnique: vi.fn(), updateMany: vi.fn() },
    $transaction: vi.fn(async (arg: any) => (typeof arg === 'function' ? arg(tx) : Promise.all(arg))),
  },
}));
vi.mock('next-auth', () => ({ getServerSession: vi.fn() }));
vi.mock('@/lib/auth', () => ({ authOptions: {} }));
vi.mock('next/headers', () => ({ cookies: () => ({ get: () => undefined }) }));

const stripeMock = {
  customers: { create: vi.fn(), retrieve: vi.fn(), update: vi.fn() },
  checkout: { sessions: { create: vi.fn(), retrieve: vi.fn() } },
};
vi.mock('@/lib/stripe', () => ({
  getStripeClient: () => stripeMock,
  isStripeConfigured: () => true,
  isStripeTestMode: () => true,
}));

const { prisma } = await import('@/lib/prisma');
const { getServerSession } = await import('next-auth');
const checkout = await import('@/modules/commerce/checkout.service');
const purchases = await import('@/modules/commerce/purchases.service');
const { handleWebhook } = await import('@/modules/payments/billing.service');
const checkoutRoute = await import('@/app/api/programs/[slug]/checkout/route');

const USER = { id: 'u1', role: 'USER' as const };

function paidSession(overrides: Record<string, any> = {}) {
  return {
    id: 'cs_test_1',
    object: 'checkout.session',
    mode: 'payment',
    payment_status: 'paid',
    amount_total: 14900,
    currency: 'eur',
    payment_intent: 'pi_test_1',
    metadata: { kind: 'program', purchaseId: 'p1', userId: 'u1', productSlug: 'reset-28-days', programSlug: '28-days' },
    ...overrides,
  } as any;
}

const pendingPurchase = {
  id: 'p1',
  userId: 'u1',
  courseId: 'reset-28-days',
  amount: 14900,
  currency: 'eur',
  status: 'PENDING',
  stripeCheckoutSessionId: 'cs_test_1',
};

beforeEach(() => {
  vi.clearAllMocks();
  featureState.programCheckout = true;
  (prisma.user.findUnique as any).mockResolvedValue({ id: 'u1', stripeCustomerId: 'cus_test' });
  stripeMock.customers.retrieve.mockResolvedValue({ id: 'cus_test', preferred_locales: ['en'] });
  (prisma.entitlement.findFirst as any).mockResolvedValue(null);
  (prisma.purchase.findFirst as any).mockResolvedValue(null);
  tx.entitlement.findFirst.mockResolvedValue(null);
  tx.entitlement.create.mockResolvedValue({ id: 'e1' });
});

describe('startProgramCheckout', () => {
  it.each([
    ['1-day', 'reset-1-day', 1900],
    ['3-days', 'reset-3-days', 3900],
    ['7-days', 'reset-7-days', 7900],
    ['28-days', 'reset-28-days', 14900],
  ])('%s: one-time Stripe Checkout at the catalog price', async (programSlug, productSlug, amount) => {
    (prisma.purchase.create as any).mockResolvedValue({ id: 'p-new' });
    stripeMock.checkout.sessions.create.mockResolvedValue({ id: 'cs_new', url: 'https://checkout.stripe.com/c/pay/cs_new' });

    const { url } = await checkout.startProgramCheckout({ user: USER, programSlug, locale: 'en' });
    expect(url).toContain('checkout.stripe.com');

    // PENDING purchase first, with the server-side catalog amount.
    expect((prisma.purchase.create as any).mock.calls[0][0].data).toMatchObject({
      userId: 'u1',
      courseId: productSlug,
      amount,
      currency: 'eur',
      status: 'PENDING',
    });

    const [params, options] = stripeMock.checkout.sessions.create.mock.calls[0];
    expect(params.mode).toBe('payment'); // never 'subscription'
    expect(params.line_items).toHaveLength(1);
    expect(params.line_items[0].price_data.unit_amount).toBe(amount);
    expect(params.line_items[0].price_data.recurring).toBeUndefined();
    expect(params.metadata).toEqual({ kind: 'program', purchaseId: 'p-new', userId: 'u1', productSlug, programSlug });
    expect(options.idempotencyKey).toBe('program-checkout-p-new');
    expect(params.success_url).toContain(`/practices/programs/${programSlug}?purchase=success&session_id={CHECKOUT_SESSION_ID}`);
  });

  it('is refused when checkout is disabled', async () => {
    featureState.programCheckout = false;
    await expect(checkout.startProgramCheckout({ user: USER, programSlug: '1-day', locale: 'en' })).rejects.toMatchObject({
      code: 'DISABLED',
    });
    expect(stripeMock.checkout.sessions.create).not.toHaveBeenCalled();
  });

  it('cannot start a checkout for Community, Trainer or anything that is not a Reset Program', async () => {
    for (const slug of ['community', 'trainer', 'reset-28-days', 'nope']) {
      await expect(checkout.startProgramCheckout({ user: USER, programSlug: slug, locale: 'en' })).rejects.toMatchObject({
        code: 'NOT_FOUND',
      });
    }
    expect(prisma.purchase.create).not.toHaveBeenCalled();
    expect(stripeMock.checkout.sessions.create).not.toHaveBeenCalled();
  });

  it('refuses when the user already has access', async () => {
    (prisma.entitlement.findFirst as any).mockResolvedValue({ id: 'e1' });
    await expect(checkout.startProgramCheckout({ user: USER, programSlug: '7-days', locale: 'en' })).rejects.toMatchObject({
      code: 'ALREADY_OWNED',
    });
  });

  it('reuses an open checkout instead of starting a second purchase', async () => {
    (prisma.purchase.findFirst as any).mockResolvedValue({ ...pendingPurchase, courseId: 'reset-7-days' });
    stripeMock.checkout.sessions.retrieve.mockResolvedValue({ status: 'open', url: 'https://checkout.stripe.com/existing' });
    const { url } = await checkout.startProgramCheckout({ user: USER, programSlug: '7-days', locale: 'en' });
    expect(url).toBe('https://checkout.stripe.com/existing');
    expect(prisma.purchase.create).not.toHaveBeenCalled();
  });

  it('cancels the pending purchase if Stripe fails, so no orphan PENDING row stays', async () => {
    (prisma.purchase.create as any).mockResolvedValue({ id: 'p-fail' });
    stripeMock.checkout.sessions.create.mockRejectedValue(new Error('stripe down'));
    await expect(checkout.startProgramCheckout({ user: USER, programSlug: '1-day', locale: 'en' })).rejects.toThrow();
    expect((prisma.purchase.update as any).mock.calls[0][0]).toEqual({ where: { id: 'p-fail' }, data: { status: 'CANCELED' } });
  });
});

describe('settleProgramPurchase (webhook / reconcile)', () => {
  it('a paid session marks the Purchase SUCCEEDED and grants the program', async () => {
    (prisma.purchase.findUnique as any).mockResolvedValue(pendingPurchase);
    (prisma.purchase.updateMany as any).mockResolvedValue({ count: 1 });

    expect(await purchases.settleProgramPurchase(paidSession())).toBe('settled');
    expect((prisma.purchase.updateMany as any).mock.calls[0][0]).toMatchObject({
      where: { id: 'p1' },
      data: { status: 'SUCCEEDED', stripeCheckoutSessionId: 'cs_test_1', stripePaymentIntentId: 'pi_test_1' },
    });
    expect(tx.entitlement.create.mock.calls[0][0].data).toEqual({
      userId: 'u1',
      programSlug: '28-days',
      source: 'PURCHASE',
      purchaseId: 'p1',
    });
  });

  it('is idempotent: a retried event creates no second Purchase update or Entitlement', async () => {
    (prisma.purchase.findUnique as any).mockResolvedValue({ ...pendingPurchase, status: 'SUCCEEDED' });
    (prisma.purchase.updateMany as any).mockResolvedValue({ count: 0 });
    tx.entitlement.findFirst.mockResolvedValue({ id: 'e1' }); // already granted

    expect(await purchases.settleProgramPurchase(paidSession())).toBe('already-settled');
    expect(tx.entitlement.create).not.toHaveBeenCalled();
  });

  it('an unpaid (delayed) session grants nothing', async () => {
    (prisma.purchase.findUnique as any).mockResolvedValue(pendingPurchase);
    expect(await purchases.settleProgramPurchase(paidSession({ payment_status: 'unpaid' }))).toBe('not-paid');
    expect(prisma.purchase.updateMany).not.toHaveBeenCalled();
    expect(tx.entitlement.create).not.toHaveBeenCalled();
  });

  it.each([
    ['amount', { amount_total: 100 }],
    ['currency', { currency: 'usd' }],
    ['user', { metadata: { ...paidSession().metadata, userId: 'someone-else' } }],
    ['product', { metadata: { ...paidSession().metadata, productSlug: 'reset-1-day' } }],
    ['mode', { mode: 'subscription' }],
    ['session', { id: 'cs_other' }],
  ])('a %s mismatch grants nothing', async (_label, overrides) => {
    (prisma.purchase.findUnique as any).mockResolvedValue(pendingPurchase);
    expect(await purchases.settleProgramPurchase(paidSession(overrides))).toBe('mismatch');
    expect(prisma.purchase.updateMany).not.toHaveBeenCalled();
    expect(tx.entitlement.create).not.toHaveBeenCalled();
  });

  it('never resurrects a cancelled/failed/refunded purchase', async () => {
    (prisma.purchase.findUnique as any).mockResolvedValue({ ...pendingPurchase, status: 'REFUNDED' });
    (prisma.purchase.updateMany as any).mockResolvedValue({ count: 0 });
    expect(await purchases.settleProgramPurchase(paidSession())).toBe('mismatch');
    expect(tx.entitlement.create).not.toHaveBeenCalled();
  });

  it('the return-page reconcile uses the same rules, scoped to the signed-in user', async () => {
    (prisma.purchase.findFirst as any).mockResolvedValueOnce({ ...pendingPurchase, userId: 'u2' });
    stripeMock.checkout.sessions.retrieve.mockResolvedValue(paidSession());
    (prisma.purchase.findUnique as any).mockResolvedValue(pendingPurchase);
    await checkout.reconcileProgramPurchase('u2', 'cs_test_1');
    // Session belongs to u1 → nothing granted to u2.
    expect(tx.entitlement.create).not.toHaveBeenCalled();
  });
});

describe('Stripe webhook events for Reset purchases', () => {
  const event = (type: string, object: any, id = `evt_${type}`) => ({ id, type, data: { object } }) as any;

  beforeEach(() => {
    (prisma.paymentEvent.findUnique as any).mockResolvedValue(null);
    // recordWebhookOutcome's bookkeeping (first delivery → create).
    (prisma.paymentEvent.updateMany as any).mockResolvedValue({ count: 0 });
    (prisma.paymentEvent.create as any).mockResolvedValue({});
  });

  it('checkout.session.completed (paid) → SUCCEEDED purchase + entitlement', async () => {
    (prisma.purchase.findUnique as any).mockResolvedValue(pendingPurchase);
    (prisma.purchase.updateMany as any).mockResolvedValue({ count: 1 });
    await handleWebhook(event('checkout.session.completed', paidSession()));
    expect(tx.entitlement.create).toHaveBeenCalledTimes(1);
  });

  it('a redelivered, already-processed event is ignored entirely', async () => {
    (prisma.paymentEvent.findUnique as any).mockResolvedValue({ status: 'processed' });
    const result = await handleWebhook(event('checkout.session.completed', paidSession()));
    expect(result).toEqual({ duplicate: true });
    expect(prisma.purchase.findUnique).not.toHaveBeenCalled();
  });

  it('async_payment_failed → FAILED, expired → CANCELED, never an entitlement', async () => {
    (prisma.purchase.updateMany as any).mockResolvedValue({ count: 1 });
    await handleWebhook(event('checkout.session.async_payment_failed', paidSession({ payment_status: 'unpaid' })));
    await handleWebhook(event('checkout.session.expired', paidSession({ payment_status: 'unpaid', status: 'expired' })));
    const statuses = (prisma.purchase.updateMany as any).mock.calls.map((c: any) => c[0].data.status);
    expect(statuses).toEqual(['FAILED', 'CANCELED']);
    expect(tx.entitlement.create).not.toHaveBeenCalled();
  });

  it('a full refund marks the purchase REFUNDED and revokes its access; a partial one changes nothing', async () => {
    (prisma.purchase.findFirst as any).mockResolvedValue({ ...pendingPurchase, status: 'SUCCEEDED' });
    await handleWebhook(event('charge.refunded', { payment_intent: 'pi_test_1', refunded: false }, 'evt_partial'));
    expect(prisma.$transaction).not.toHaveBeenCalled();

    await handleWebhook(event('charge.refunded', { payment_intent: 'pi_test_1', refunded: true }, 'evt_full'));
    expect(prisma.$transaction).toHaveBeenCalledTimes(1);
  });
});

describe('POST /api/programs/[slug]/checkout', () => {
  const post = (slug: string) => checkoutRoute.POST(new Request('http://x', { method: 'POST' }), { params: { slug } });

  it('requires a signed-in, email-verified, non-moderator user', async () => {
    (getServerSession as any).mockResolvedValue(null);
    expect((await post('1-day')).status).toBe(401);

    (getServerSession as any).mockResolvedValue({ user: { id: 'u-r1', role: 'USER', emailVerified: null } });
    expect((await post('1-day')).status).toBe(403);

    (getServerSession as any).mockResolvedValue({ user: { id: 'u-r2', role: 'MODERATOR', emailVerified: new Date() } });
    expect((await post('1-day')).status).toBe(403);
    expect(stripeMock.checkout.sessions.create).not.toHaveBeenCalled();
  });

  it('returns 403 CHECKOUT_DISABLED when checkout is off', async () => {
    featureState.programCheckout = false;
    (getServerSession as any).mockResolvedValue({ user: { id: 'u-r3', role: 'USER', emailVerified: new Date() } });
    const res = await post('1-day');
    expect(res.status).toBe(403);
    expect((await res.json()).error.code).toBe('CHECKOUT_DISABLED');
  });
});
