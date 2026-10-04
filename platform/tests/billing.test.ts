import { describe, it, expect, vi, beforeEach } from 'vitest';

// Mock the Prisma singleton so billing.service.ts can be tested without a
// real database. Every model method used by billing.service.ts is stubbed.
vi.mock('@/lib/prisma', () => ({
  prisma: {
    user: { findUnique: vi.fn(), updateMany: vi.fn() },
    membershipPlan: { findUnique: vi.fn() },
    donation: { create: vi.fn(), updateMany: vi.fn(), findFirst: vi.fn() },
    purchase: { create: vi.fn(), updateMany: vi.fn() },
    subscription: { upsert: vi.fn(), updateMany: vi.fn(), findUnique: vi.fn(), findFirst: vi.fn(), update: vi.fn() },
    payment: { updateMany: vi.fn(), findUnique: vi.fn() },
    paymentEvent: { findUnique: vi.fn(), create: vi.fn(), updateMany: vi.fn() },
  },
}));

// Mock the Stripe client so no real network call is ever made in tests.
const stripeMock = {
  customers: { create: vi.fn(), del: vi.fn(), retrieve: vi.fn(), update: vi.fn() },
  checkout: { sessions: { create: vi.fn(), retrieve: vi.fn() } },
  subscriptions: { update: vi.fn(), retrieve: vi.fn() },
  billingPortal: { sessions: { create: vi.fn() } },
  paymentMethods: { list: vi.fn() },
  invoices: { list: vi.fn() },
};
vi.mock('@/lib/stripe', () => ({
  getStripeClient: () => stripeMock,
}));

const { prisma } = await import('@/lib/prisma');
const {
  getOrCreateStripeCustomer,
  handleWebhook,
  createDonationCheckout,
  createSubscriptionCheckout,
  getPaymentMethodForUser,
  listInvoicesForUser,
  getDonationForUserBySession,
  reconcileDonationFromCheckoutSession,
} = await import('@/modules/payments/billing.service');

beforeEach(() => {
  vi.clearAllMocks();
});

describe('getOrCreateStripeCustomer', () => {
  it('returns the existing Stripe customer id without calling Stripe', async () => {
    (prisma.user.findUnique as any).mockResolvedValue({ id: 'u1', stripeCustomerId: 'cus_existing' });

    const id = await getOrCreateStripeCustomer('u1');

    expect(id).toBe('cus_existing');
    expect(stripeMock.customers.create).not.toHaveBeenCalled();
  });

  it('creates a Stripe customer when the user has none yet', async () => {
    (prisma.user.findUnique as any).mockResolvedValue({ id: 'u1', email: 'a@b.com', name: 'A', stripeCustomerId: null });
    stripeMock.customers.create.mockResolvedValue({ id: 'cus_new' });
    (prisma.user.updateMany as any).mockResolvedValue({ count: 1 });

    const id = await getOrCreateStripeCustomer('u1');

    expect(id).toBe('cus_new');
    expect(stripeMock.customers.create).toHaveBeenCalledTimes(1);
  });

  it('never leaves a user with two Stripe customers under a race', async () => {
    (prisma.user.findUnique as any)
      .mockResolvedValueOnce({ id: 'u1', email: 'a@b.com', name: 'A', stripeCustomerId: null })
      // A concurrent request already set stripeCustomerId by the time we re-check.
      .mockResolvedValueOnce({ id: 'u1', stripeCustomerId: 'cus_from_other_request' });
    stripeMock.customers.create.mockResolvedValue({ id: 'cus_new' });
    (prisma.user.updateMany as any).mockResolvedValue({ count: 0 });
    stripeMock.customers.del.mockResolvedValue({});

    const id = await getOrCreateStripeCustomer('u1');

    expect(id).toBe('cus_from_other_request');
    expect(stripeMock.customers.del).toHaveBeenCalledWith('cus_new');
  });

  describe('preferred_locales (invoice/receipt PDF + email language)', () => {
    const newUser = { id: 'u1', email: 'a@b.com', name: 'A', stripeCustomerId: null };

    it.each([['bg'], ['en']] as const)('creates a new customer with preferred_locales [%s]', async (locale) => {
      (prisma.user.findUnique as any).mockResolvedValue(newUser);
      stripeMock.customers.create.mockResolvedValue({ id: 'cus_new' });
      (prisma.user.updateMany as any).mockResolvedValue({ count: 1 });

      await getOrCreateStripeCustomer('u1', locale);

      expect(stripeMock.customers.create).toHaveBeenCalledWith({
        email: 'a@b.com',
        name: 'A',
        metadata: { userId: 'u1' },
        preferred_locales: [locale],
      });
    });

    it('does not send preferred_locales when no locale is given', async () => {
      (prisma.user.findUnique as any).mockResolvedValue(newUser);
      stripeMock.customers.create.mockResolvedValue({ id: 'cus_new' });
      (prisma.user.updateMany as any).mockResolvedValue({ count: 1 });

      await getOrCreateStripeCustomer('u1');

      expect(stripeMock.customers.create.mock.calls[0][0]).not.toHaveProperty('preferred_locales');
    });

    it('updates an existing customer whose locale is unset, without creating a duplicate', async () => {
      (prisma.user.findUnique as any).mockResolvedValue({ id: 'u1', stripeCustomerId: 'cus_existing' });
      stripeMock.customers.retrieve.mockResolvedValue({ id: 'cus_existing', preferred_locales: [], metadata: { keep: 'me' } });

      const id = await getOrCreateStripeCustomer('u1', 'bg');

      expect(id).toBe('cus_existing');
      expect(stripeMock.customers.create).not.toHaveBeenCalled();
      // Only preferred_locales is sent, so email/name/metadata are untouched.
      expect(stripeMock.customers.update).toHaveBeenCalledWith('cus_existing', { preferred_locales: ['bg'] });
    });

    it('updates the customer when the app language changed (bg -> en)', async () => {
      (prisma.user.findUnique as any).mockResolvedValue({ id: 'u1', stripeCustomerId: 'cus_existing' });
      stripeMock.customers.retrieve.mockResolvedValue({ id: 'cus_existing', preferred_locales: ['bg'] });

      await getOrCreateStripeCustomer('u1', 'en');

      expect(stripeMock.customers.update).toHaveBeenCalledWith('cus_existing', { preferred_locales: ['en'] });
    });

    it('does not update Stripe when the customer locale already matches', async () => {
      (prisma.user.findUnique as any).mockResolvedValue({ id: 'u1', stripeCustomerId: 'cus_existing' });
      stripeMock.customers.retrieve.mockResolvedValue({ id: 'cus_existing', preferred_locales: ['bg'] });

      await getOrCreateStripeCustomer('u1', 'bg');

      expect(stripeMock.customers.update).not.toHaveBeenCalled();
    });

    it('still returns the customer id if the locale sync fails', async () => {
      (prisma.user.findUnique as any).mockResolvedValue({ id: 'u1', stripeCustomerId: 'cus_existing' });
      stripeMock.customers.retrieve.mockRejectedValue(new Error('stripe down'));

      await expect(getOrCreateStripeCustomer('u1', 'bg')).resolves.toBe('cus_existing');
    });

    it('does not touch an existing customer when no locale is given', async () => {
      (prisma.user.findUnique as any).mockResolvedValue({ id: 'u1', stripeCustomerId: 'cus_existing' });

      await getOrCreateStripeCustomer('u1');

      expect(stripeMock.customers.retrieve).not.toHaveBeenCalled();
      expect(stripeMock.customers.update).not.toHaveBeenCalled();
    });
  });
});

describe('createDonationCheckout', () => {
  it('creates a pending Donation row tied to the checkout session', async () => {
    stripeMock.checkout.sessions.create.mockResolvedValue({ id: 'cs_123' });
    (prisma.donation.create as any).mockResolvedValue({});

    await createDonationCheckout({ amount: 2500, currency: 'eur' });

    expect(prisma.donation.create).toHaveBeenCalledWith(
      expect.objectContaining({
        data: expect.objectContaining({ amount: 2500, currency: 'eur', status: 'PENDING' }),
      }),
    );
  });

  it.each(['en', 'bg'] as const)('passes the app locale (%s) to Stripe Checkout', async (locale) => {
    stripeMock.checkout.sessions.create.mockResolvedValue({ id: 'cs_loc' });
    (prisma.donation.create as any).mockResolvedValue({});

    await createDonationCheckout({ amount: 2500, currency: 'eur', locale });

    expect(stripeMock.checkout.sessions.create).toHaveBeenCalledWith(expect.objectContaining({ locale }));
  });

  it('leaves the Checkout locale unset (Stripe auto-detect) when none is given', async () => {
    stripeMock.checkout.sessions.create.mockResolvedValue({ id: 'cs_noloc' });
    (prisma.donation.create as any).mockResolvedValue({});

    await createDonationCheckout({ amount: 2500, currency: 'eur' });

    const params = stripeMock.checkout.sessions.create.mock.calls[0][0];
    expect(params.locale).toBeUndefined();
  });
});

describe('createSubscriptionCheckout — duplicate subscription guard', () => {
  const plan = { id: 'plan_1', active: true, stripePriceId: 'price_1' };

  // Behaves like Prisma for the guard's query: a row matches only if it
  // belongs to the user and its status is in the requested `status.in` list.
  function withSubscriptions(rows: { id: string; userId: string; status: string }[]) {
    (prisma.subscription.findFirst as any).mockImplementation(async ({ where }: any) => {
      const row = rows.find((r) => r.userId === where.userId && where.status.in.includes(r.status));
      return row ? { id: row.id } : null;
    });
  }

  beforeEach(() => {
    (prisma.membershipPlan.findUnique as any).mockResolvedValue(plan);
    (prisma.user.findUnique as any).mockResolvedValue({ id: 'u1', stripeCustomerId: 'cus_1' });
    stripeMock.checkout.sessions.create.mockResolvedValue({ id: 'cs_sub', url: 'https://checkout.stripe.test/cs_sub' });
  });

  it.each(['ACTIVE', 'TRIALING', 'PAST_DUE'])(
    'refuses with 409 CONFLICT when the user already has a %s subscription, before any Stripe call',
    async (status) => {
      withSubscriptions([{ id: 'sub_1', userId: 'u1', status }]);

      await expect(createSubscriptionCheckout({ userId: 'u1', membershipPlanId: 'plan_1' })).rejects.toMatchObject({
        status: 409,
        code: 'CONFLICT',
      });

      expect(stripeMock.checkout.sessions.create).not.toHaveBeenCalled();
      expect(stripeMock.customers.create).not.toHaveBeenCalled();
      expect(stripeMock.customers.retrieve).not.toHaveBeenCalled();
    },
  );

  it('refuses even when the existing subscription is on a different plan', async () => {
    withSubscriptions([{ id: 'sub_other', userId: 'u1', status: 'ACTIVE' }]);
    (prisma.membershipPlan.findUnique as any).mockResolvedValue({ id: 'plan_2', active: true, stripePriceId: 'price_2' });

    await expect(createSubscriptionCheckout({ userId: 'u1', membershipPlanId: 'plan_2' })).rejects.toMatchObject({
      status: 409,
    });
    expect(stripeMock.checkout.sessions.create).not.toHaveBeenCalled();
  });

  // Same rule as getActiveSubscriptionForUser: only ACTIVE/TRIALING/PAST_DUE
  // count as a membership in effect, so these never block a new checkout.
  it.each(['INCOMPLETE', 'INCOMPLETE_EXPIRED', 'CANCELED', 'UNPAID'])(
    'still creates a checkout when the user only has a %s subscription',
    async (status) => {
      withSubscriptions([{ id: 'sub_old', userId: 'u1', status }]);

      const session = await createSubscriptionCheckout({ userId: 'u1', membershipPlanId: 'plan_1' });

      expect(session.id).toBe('cs_sub');
      expect(stripeMock.checkout.sessions.create).toHaveBeenCalledTimes(1);
    },
  );

  it('creates a checkout for a user with no subscription at all', async () => {
    withSubscriptions([]);

    const session = await createSubscriptionCheckout({ userId: 'u1', membershipPlanId: 'plan_1' });

    expect(session.url).toBe('https://checkout.stripe.test/cs_sub');
    expect(stripeMock.checkout.sessions.create).toHaveBeenCalledWith(
      expect.objectContaining({ mode: 'subscription', customer: 'cus_1', line_items: [{ price: 'price_1', quantity: 1 }] }),
    );
  });

  it("is not blocked by another user's active subscription", async () => {
    withSubscriptions([{ id: 'sub_someone_else', userId: 'u2', status: 'ACTIVE' }]);

    await createSubscriptionCheckout({ userId: 'u1', membershipPlanId: 'plan_1' });

    expect(stripeMock.checkout.sessions.create).toHaveBeenCalledTimes(1);
  });

  it('queries only this user and only the blocking statuses', async () => {
    withSubscriptions([]);

    await createSubscriptionCheckout({ userId: 'u1', membershipPlanId: 'plan_1' });

    const { where } = (prisma.subscription.findFirst as any).mock.calls[0][0];
    expect(where.userId).toBe('u1');
    expect([...where.status.in].sort()).toEqual(['ACTIVE', 'PAST_DUE', 'TRIALING']);
  });
});

describe('handleWebhook idempotency', () => {
  it('skips processing when the Stripe event id was already recorded as processed', async () => {
    (prisma.paymentEvent.findUnique as any).mockResolvedValue({ id: 'evt-row', eventId: 'evt_1', status: 'processed' });

    const result = await handleWebhook({ id: 'evt_1', type: 'checkout.session.completed' } as any);

    expect(result.duplicate).toBe(true);
    expect(prisma.donation.updateMany).not.toHaveBeenCalled();
    expect(prisma.paymentEvent.create).not.toHaveBeenCalled();
    expect(prisma.paymentEvent.updateMany).not.toHaveBeenCalled();
  });

  it('processes a new checkout.session.completed donation event exactly once', async () => {
    (prisma.paymentEvent.findUnique as any).mockResolvedValue(null);
    (prisma.donation.updateMany as any).mockResolvedValue({ count: 1 });
    // No existing row yet — the guarded updateMany matches nothing, so
    // recordWebhookOutcome falls back to create().
    (prisma.paymentEvent.updateMany as any).mockResolvedValue({ count: 0 });
    (prisma.paymentEvent.create as any).mockResolvedValue({});

    const event = {
      id: 'evt_2',
      type: 'checkout.session.completed',
      data: { object: { id: 'cs_123', metadata: { kind: 'donation' }, payment_status: 'paid', payment_intent: 'pi_123' } },
    } as any;

    const result = await handleWebhook(event);

    expect(result.duplicate).toBe(false);
    expect(prisma.donation.updateMany).toHaveBeenCalledWith(
      expect.objectContaining({ where: { stripeCheckoutSessionId: 'cs_123' } }),
    );
    expect(prisma.paymentEvent.create).toHaveBeenCalledWith(
      expect.objectContaining({ data: expect.objectContaining({ eventId: 'evt_2', status: 'processed' }) }),
    );
  });

  it('records a failed event instead of silently swallowing the error', async () => {
    (prisma.paymentEvent.findUnique as any)
      .mockResolvedValueOnce(null) // initial lookup: brand-new event
      .mockResolvedValueOnce({ id: 'evt-row', eventId: 'evt_3', status: 'error' }); // post-failure re-check
    (prisma.donation.updateMany as any).mockRejectedValue(new Error('db unavailable'));
    (prisma.paymentEvent.updateMany as any).mockResolvedValue({ count: 0 });
    (prisma.paymentEvent.create as any).mockResolvedValue({});

    const event = {
      id: 'evt_3',
      type: 'checkout.session.completed',
      data: { object: { id: 'cs_456', metadata: { kind: 'donation' }, payment_status: 'paid' } },
    } as any;

    await expect(handleWebhook(event)).rejects.toThrow('db unavailable');
    expect(prisma.paymentEvent.create).toHaveBeenCalledWith(
      expect.objectContaining({ data: expect.objectContaining({ eventId: 'evt_3', status: 'error' }) }),
    );
  });

  it('retries a previously errored event, reprocessing it and flipping the row to processed without a second create', async () => {
    (prisma.paymentEvent.findUnique as any).mockResolvedValue({ id: 'evt-row', eventId: 'evt_4', status: 'error' });
    (prisma.donation.updateMany as any).mockResolvedValue({ count: 1 });
    // The row already exists (status: 'error'), so the guarded updateMany
    // matches it directly — no fallback create should ever be attempted.
    (prisma.paymentEvent.updateMany as any).mockResolvedValue({ count: 1 });

    const event = {
      id: 'evt_4',
      type: 'checkout.session.completed',
      data: { object: { id: 'cs_789', metadata: { kind: 'donation' }, payment_status: 'paid' } },
    } as any;

    const result = await handleWebhook(event);

    expect(result.duplicate).toBe(false);
    // The business operation ran again — this is the actual bug fix.
    expect(prisma.donation.updateMany).toHaveBeenCalledWith(
      expect.objectContaining({ where: { stripeCheckoutSessionId: 'cs_789' } }),
    );
    expect(prisma.paymentEvent.updateMany).toHaveBeenCalledWith(
      expect.objectContaining({
        where: { eventId: 'evt_4', status: { not: 'processed' } },
        data: expect.objectContaining({ status: 'processed' }),
      }),
    );
    expect(prisma.paymentEvent.create).not.toHaveBeenCalled();
  });

  it('recovers from a concurrent-create race (P2002) on a brand-new event without an unhandled exception', async () => {
    (prisma.paymentEvent.findUnique as any).mockResolvedValue(null);
    (prisma.donation.updateMany as any).mockResolvedValue({ count: 1 });
    // First guarded updateMany: no row exists yet -> falls through to create.
    // Second guarded updateMany (after the P2002 catch): the concurrent
    // winner's row already reflects success, so nothing left to apply.
    (prisma.paymentEvent.updateMany as any).mockResolvedValue({ count: 0 });
    // A concurrent delivery already created the row for this event id.
    (prisma.paymentEvent.create as any).mockRejectedValue({ code: 'P2002' });

    const event = {
      id: 'evt_5',
      type: 'checkout.session.completed',
      data: { object: { id: 'cs_race', metadata: { kind: 'donation' }, payment_status: 'paid' } },
    } as any;

    const result = await handleWebhook(event);

    expect(result.duplicate).toBe(false);
    expect(prisma.paymentEvent.create).toHaveBeenCalledTimes(1);
    expect(prisma.paymentEvent.updateMany).toHaveBeenCalledTimes(2);
  });

  it('does not downgrade an already-processed row when a concurrent delivery fails locally', async () => {
    // This delivery sees the event mid-retry (status 'error' at the time of
    // the initial lookup)...
    (prisma.paymentEvent.findUnique as any)
      .mockResolvedValueOnce({ id: 'evt-row', eventId: 'evt_6', status: 'error' })
      // ...but by the time this delivery finishes failing, a concurrent
      // delivery has already flipped the row to 'processed'.
      .mockResolvedValueOnce({ id: 'evt-row', eventId: 'evt_6', status: 'processed' });
    (prisma.donation.updateMany as any).mockRejectedValue(new Error('transient failure'));
    // Every guarded write reports 0 rows matched — the row is already
    // 'processed', so the `status: { not: 'processed' }` guard correctly
    // refuses to touch it.
    (prisma.paymentEvent.updateMany as any).mockResolvedValue({ count: 0 });
    (prisma.paymentEvent.create as any).mockRejectedValue({ code: 'P2002' });

    const event = {
      id: 'evt_6',
      type: 'checkout.session.completed',
      data: { object: { id: 'cs_downgrade', metadata: { kind: 'donation' }, payment_status: 'paid' } },
    } as any;

    // Must NOT throw: the event is genuinely already handled by the other
    // delivery, so this one reports it as a duplicate instead of a failure.
    const result = await handleWebhook(event);
    expect(result.duplicate).toBe(true);

    // Every write this delivery attempted was guarded against downgrading a
    // processed row.
    for (const call of (prisma.paymentEvent.updateMany as any).mock.calls) {
      expect(call[0].where.status).toEqual({ not: 'processed' });
    }
  });
});

describe('handleWebhook — customer.subscription.* events', () => {
  // Each test is a brand-new event (no prior PaymentEvent row) reaching
  // processStripeEvent for the first time — same bookkeeping setup as
  // "processes a new checkout.session.completed donation event exactly
  // once" above, factored into a beforeEach since every test in this
  // describe needs it and none exercise the idempotency machinery itself
  // (already covered by the 'handleWebhook idempotency' suite above).
  // The handler re-reads each subscription from Stripe (see the out-of-order
  // suite below). In these tests nothing changes after the event, so
  // Stripe's current state is the event's own snapshot.
  const stripeSubscriptions = new Map<string, Record<string, unknown>>();

  beforeEach(() => {
    (prisma.paymentEvent.findUnique as any).mockResolvedValue(null);
    (prisma.paymentEvent.updateMany as any).mockResolvedValue({ count: 0 });
    (prisma.paymentEvent.create as any).mockResolvedValue({});
    stripeSubscriptions.clear();
    stripeMock.subscriptions.retrieve.mockImplementation(async (id: string) => stripeSubscriptions.get(id));
  });

  function subscriptionEvent(type: string, sub: Record<string, unknown>) {
    stripeSubscriptions.set(sub.id as string, sub);
    return { id: `evt_${type}_${sub.id}`, type, data: { object: sub } } as any;
  }

  it.each(['customer.subscription.created', 'customer.subscription.updated'])(
    '%s upserts the subscription using the mapped status, period and metadata identifiers',
    async (type) => {
      (prisma.subscription.upsert as any).mockResolvedValue({});
      const sub = {
        id: 'sub_1',
        customer: 'cus_1',
        status: 'active',
        current_period_start: 1700000000,
        current_period_end: 1702592000,
        cancel_at_period_end: false,
        metadata: { userId: 'u1', membershipPlanId: 'plan_1' },
        items: { data: [] },
      };

      const result = await handleWebhook(subscriptionEvent(type, sub));

      expect(result.duplicate).toBe(false);
      const expectedFields = {
        status: 'ACTIVE',
        currentPeriodStart: new Date(1700000000 * 1000),
        currentPeriodEnd: new Date(1702592000 * 1000),
        cancelAtPeriodEnd: false,
      };
      expect(prisma.subscription.upsert).toHaveBeenCalledWith({
        where: { stripeSubscriptionId: 'sub_1' },
        create: {
          userId: 'u1',
          membershipPlanId: 'plan_1',
          stripeCustomerId: 'cus_1',
          stripeSubscriptionId: 'sub_1',
          ...expectedFields,
        },
        update: expectedFields,
      });
    },
  );

  it.each([
    ['active', 'ACTIVE'],
    ['past_due', 'PAST_DUE'],
    ['trialing', 'TRIALING'],
  ])('maps Stripe subscription status "%s" to "%s"', async (stripeStatus, mapped) => {
    (prisma.subscription.upsert as any).mockResolvedValue({});
    const sub = {
      id: 'sub_status',
      customer: 'cus_1',
      status: stripeStatus,
      cancel_at_period_end: false,
      metadata: { userId: 'u1', membershipPlanId: 'plan_1' },
      items: { data: [] },
    };

    await handleWebhook(subscriptionEvent('customer.subscription.updated', sub));

    expect(prisma.subscription.upsert).toHaveBeenCalledWith(
      expect.objectContaining({ create: expect.objectContaining({ status: mapped }) }),
    );
  });

  it('resolves the customer id whether Stripe sends it as a string or an expanded Customer object', async () => {
    (prisma.subscription.upsert as any).mockResolvedValue({});
    const sub = {
      id: 'sub_expanded',
      customer: { id: 'cus_expanded' },
      status: 'active',
      cancel_at_period_end: false,
      metadata: { userId: 'u1', membershipPlanId: 'plan_1' },
      items: { data: [] },
    };

    await handleWebhook(subscriptionEvent('customer.subscription.created', sub));

    expect(prisma.subscription.upsert).toHaveBeenCalledWith(
      expect.objectContaining({ create: expect.objectContaining({ stripeCustomerId: 'cus_expanded' }) }),
    );
  });

  it('reads the billing period from the first subscription item when the top-level fields are absent (flexible billing periods)', async () => {
    (prisma.subscription.upsert as any).mockResolvedValue({});
    const sub = {
      id: 'sub_item_period',
      customer: 'cus_1',
      status: 'active',
      cancel_at_period_end: false,
      metadata: { userId: 'u1', membershipPlanId: 'plan_1' },
      // No top-level current_period_start/end — only the newer per-item shape.
      items: { data: [{ current_period_start: 1710000000, current_period_end: 1712592000 }] },
    };

    await handleWebhook(subscriptionEvent('customer.subscription.updated', sub));

    expect(prisma.subscription.upsert).toHaveBeenCalledWith(
      expect.objectContaining({
        create: expect.objectContaining({
          currentPeriodStart: new Date(1710000000 * 1000),
          currentPeriodEnd: new Date(1712592000 * 1000),
        }),
      }),
    );
  });

  it('leaves the period null (never fabricated) when neither the top-level nor per-item shape has a valid timestamp', async () => {
    (prisma.subscription.upsert as any).mockResolvedValue({});
    const sub = {
      id: 'sub_no_period',
      customer: 'cus_1',
      status: 'active',
      cancel_at_period_end: false,
      metadata: { userId: 'u1', membershipPlanId: 'plan_1' },
      items: { data: [] },
    };

    await handleWebhook(subscriptionEvent('customer.subscription.created', sub));

    expect(prisma.subscription.upsert).toHaveBeenCalledWith(
      expect.objectContaining({
        create: expect.objectContaining({ currentPeriodStart: null, currentPeriodEnd: null }),
      }),
    );
  });

  it('does nothing when the event is missing userId or membershipPlanId metadata (no orphaned/misattributed row)', async () => {
    const sub = {
      id: 'sub_no_metadata',
      customer: 'cus_1',
      status: 'active',
      cancel_at_period_end: false,
      metadata: {},
      items: { data: [] },
    };

    const result = await handleWebhook(subscriptionEvent('customer.subscription.created', sub));

    expect(result.duplicate).toBe(false);
    expect(prisma.subscription.upsert).not.toHaveBeenCalled();
  });

  it('customer.subscription.deleted transitions the matching subscription to CANCELED, scoped by stripeSubscriptionId', async () => {
    (prisma.subscription.updateMany as any).mockResolvedValue({ count: 1 });
    const sub = { id: 'sub_del_1', customer: 'cus_1' };

    const result = await handleWebhook(subscriptionEvent('customer.subscription.deleted', sub));

    expect(result.duplicate).toBe(false);
    expect(prisma.subscription.updateMany).toHaveBeenCalledWith({
      where: { stripeSubscriptionId: 'sub_del_1' },
      data: { status: 'CANCELED', canceledAt: expect.any(Date) },
    });
  });
});

describe('handleWebhook — out-of-order customer.subscription.* delivery', () => {
  // A minimal in-memory `subscriptions` table that applies upsert/updateMany
  // the way Prisma does, so each test asserts the row a user is actually left
  // with — not just which mock was called.
  const rows = new Map<string, Record<string, unknown>>();
  // What Stripe reports for each subscription *now*. Each event below carries
  // its own, possibly older, snapshot — exactly the case being tested.
  const stripeNow = new Map<string, Record<string, unknown>>();

  beforeEach(() => {
    rows.clear();
    stripeNow.clear();
    (prisma.paymentEvent.findUnique as any).mockResolvedValue(null);
    (prisma.paymentEvent.updateMany as any).mockResolvedValue({ count: 0 });
    (prisma.paymentEvent.create as any).mockResolvedValue({});
    (prisma.subscription.upsert as any).mockImplementation(async ({ where, create, update }: any) => {
      const existing = rows.get(where.stripeSubscriptionId);
      const row = existing ? { ...existing, ...update } : { ...create };
      rows.set(where.stripeSubscriptionId, row);
      return row;
    });
    (prisma.subscription.updateMany as any).mockImplementation(async ({ where, data }: any) => {
      const existing = rows.get(where.stripeSubscriptionId);
      if (!existing) return { count: 0 };
      rows.set(where.stripeSubscriptionId, { ...existing, ...data });
      return { count: 1 };
    });
    stripeMock.subscriptions.retrieve.mockImplementation(async (id: string) => {
      const sub = stripeNow.get(id);
      if (!sub) throw new Error(`No such subscription: '${id}'`);
      return sub;
    });
  });

  // A subscription snapshot as Stripe would send it at one point in time.
  function snapshot(fields: { status: string; periodStart?: number; periodEnd?: number; cancelAtPeriodEnd?: boolean }) {
    return {
      id: 'sub_ord',
      customer: 'cus_1',
      status: fields.status,
      current_period_start: fields.periodStart ?? 1700000000,
      current_period_end: fields.periodEnd ?? 1702592000,
      cancel_at_period_end: fields.cancelAtPeriodEnd ?? false,
      metadata: { userId: 'u1', membershipPlanId: 'plan_1' },
      items: { data: [] },
    };
  }

  let eventCounter = 0;
  function eventFor(type: string, payload: Record<string, unknown>) {
    return { id: `evt_ord_${++eventCounter}`, type, data: { object: payload } } as any;
  }

  it('an older event delivered after a newer one does not roll the subscription back (TRIALING → ACTIVE)', async () => {
    const olderTrialing = eventFor('customer.subscription.created', snapshot({ status: 'trialing' }));
    const newerActive = eventFor('customer.subscription.updated', snapshot({ status: 'active' }));
    stripeNow.set('sub_ord', snapshot({ status: 'active' }));

    await handleWebhook(newerActive);
    expect(rows.get('sub_ord')?.status).toBe('ACTIVE');

    await handleWebhook(olderTrialing);
    expect(rows.get('sub_ord')?.status).toBe('ACTIVE');
  });

  it('an older ACTIVE event delivered after a newer PAST_DUE one keeps PAST_DUE', async () => {
    const olderActive = eventFor('customer.subscription.updated', snapshot({ status: 'active' }));
    const newerPastDue = eventFor('customer.subscription.updated', snapshot({ status: 'past_due' }));
    stripeNow.set('sub_ord', snapshot({ status: 'past_due' }));

    await handleWebhook(newerPastDue);
    await handleWebhook(olderActive);

    expect(rows.get('sub_ord')?.status).toBe('PAST_DUE');
  });

  it('a stale ACTIVE update delivered after customer.subscription.deleted does not revive the subscription (ACTIVE → CANCELED)', async () => {
    rows.set('sub_ord', { stripeSubscriptionId: 'sub_ord', userId: 'u1', status: 'ACTIVE', cancelAtPeriodEnd: true });
    const staleActive = eventFor('customer.subscription.updated', snapshot({ status: 'active', cancelAtPeriodEnd: true }));
    const deleted = eventFor('customer.subscription.deleted', snapshot({ status: 'canceled', cancelAtPeriodEnd: true }));
    stripeNow.set('sub_ord', snapshot({ status: 'canceled', cancelAtPeriodEnd: true }));

    await handleWebhook(deleted);
    expect(rows.get('sub_ord')?.status).toBe('CANCELED');

    await handleWebhook(staleActive);
    expect(rows.get('sub_ord')?.status).toBe('CANCELED');
  });

  it('a created event delivered after deleted creates the row as CANCELED, not ACTIVE', async () => {
    const created = eventFor('customer.subscription.created', snapshot({ status: 'active' }));
    const deleted = eventFor('customer.subscription.deleted', snapshot({ status: 'canceled' }));
    stripeNow.set('sub_ord', snapshot({ status: 'canceled' }));

    await handleWebhook(deleted); // no local row yet — nothing to cancel
    await handleWebhook(created);

    expect(rows.get('sub_ord')?.status).toBe('CANCELED');
  });

  it('an older event does not revert the billing period or cancel-at-period-end flag', async () => {
    const older = eventFor(
      'customer.subscription.updated',
      snapshot({ status: 'active', periodStart: 1700000000, periodEnd: 1702592000, cancelAtPeriodEnd: false }),
    );
    const newer = eventFor(
      'customer.subscription.updated',
      snapshot({ status: 'active', periodStart: 1702592000, periodEnd: 1705270400, cancelAtPeriodEnd: true }),
    );
    stripeNow.set('sub_ord', snapshot({ status: 'active', periodStart: 1702592000, periodEnd: 1705270400, cancelAtPeriodEnd: true }));

    await handleWebhook(newer);
    await handleWebhook(older);

    expect(rows.get('sub_ord')).toMatchObject({
      currentPeriodStart: new Date(1702592000 * 1000),
      currentPeriodEnd: new Date(1705270400 * 1000),
      cancelAtPeriodEnd: true,
    });
  });

  it('events delivered in order are each applied, ending on the newest state', async () => {
    stripeNow.set('sub_ord', snapshot({ status: 'trialing' }));
    await handleWebhook(eventFor('customer.subscription.created', snapshot({ status: 'trialing' })));
    expect(rows.get('sub_ord')).toMatchObject({ status: 'TRIALING', userId: 'u1', membershipPlanId: 'plan_1' });

    stripeNow.set('sub_ord', snapshot({ status: 'active', periodStart: 1702592000, periodEnd: 1705270400 }));
    await handleWebhook(
      eventFor('customer.subscription.updated', snapshot({ status: 'active', periodStart: 1702592000, periodEnd: 1705270400 })),
    );

    expect(rows.get('sub_ord')).toMatchObject({
      status: 'ACTIVE',
      currentPeriodStart: new Date(1702592000 * 1000),
      currentPeriodEnd: new Date(1705270400 * 1000),
    });
  });

  it('re-reads the subscription named in the event', async () => {
    stripeNow.set('sub_ord', snapshot({ status: 'active' }));

    await handleWebhook(eventFor('customer.subscription.updated', snapshot({ status: 'active' })));

    expect(stripeMock.subscriptions.retrieve).toHaveBeenCalledWith('sub_ord');
  });

  it('when Stripe cannot be read, writes nothing and fails the event so Stripe retries (never falls back to the payload)', async () => {
    rows.set('sub_ord', { stripeSubscriptionId: 'sub_ord', status: 'CANCELED' });
    stripeMock.subscriptions.retrieve.mockRejectedValue(new Error('Stripe API unavailable'));

    await expect(
      handleWebhook(eventFor('customer.subscription.updated', snapshot({ status: 'active' }))),
    ).rejects.toThrow('Stripe API unavailable');

    expect(prisma.subscription.upsert).not.toHaveBeenCalled();
    expect(rows.get('sub_ord')?.status).toBe('CANCELED');
    expect(prisma.paymentEvent.create).toHaveBeenCalledWith(
      expect.objectContaining({ data: expect.objectContaining({ status: 'error' }) }),
    );
  });
});

describe('getPaymentMethodForUser', () => {
  it('returns null without calling Stripe when the user has no Stripe customer yet', async () => {
    (prisma.user.findUnique as any).mockResolvedValue({ stripeCustomerId: null });

    const result = await getPaymentMethodForUser('u1');

    expect(result).toBeNull();
    expect(stripeMock.customers.retrieve).not.toHaveBeenCalled();
  });

  it('reads the card off the customer default payment method', async () => {
    (prisma.user.findUnique as any).mockResolvedValue({ stripeCustomerId: 'cus_1' });
    stripeMock.customers.retrieve.mockResolvedValue({
      deleted: false,
      invoice_settings: {
        default_payment_method: { card: { brand: 'visa', last4: '4242', exp_month: 4, exp_year: 2030 } },
      },
    });

    const result = await getPaymentMethodForUser('u1');

    expect(result).toEqual({ brand: 'visa', last4: '4242', expMonth: 4, expYear: 2030 });
    expect(stripeMock.paymentMethods.list).not.toHaveBeenCalled();
  });

  it('falls back to the most recently attached card when no default is set', async () => {
    (prisma.user.findUnique as any).mockResolvedValue({ stripeCustomerId: 'cus_1' });
    stripeMock.customers.retrieve.mockResolvedValue({ deleted: false, invoice_settings: {} });
    stripeMock.paymentMethods.list.mockResolvedValue({
      data: [{ card: { brand: 'mastercard', last4: '4444', exp_month: 1, exp_year: 2028 } }],
    });

    const result = await getPaymentMethodForUser('u1');

    expect(result).toEqual({ brand: 'mastercard', last4: '4444', expMonth: 1, expYear: 2028 });
  });

  it('returns null without listing payment methods when the Stripe customer has been deleted', async () => {
    (prisma.user.findUnique as any).mockResolvedValue({ stripeCustomerId: 'cus_gone' });
    stripeMock.customers.retrieve.mockResolvedValue({ deleted: true, id: 'cus_gone' });

    const result = await getPaymentMethodForUser('u1');

    expect(result).toBeNull();
    expect(stripeMock.paymentMethods.list).not.toHaveBeenCalled();
  });
});

describe('listInvoicesForUser', () => {
  it('returns an empty list without calling Stripe when the user has no Stripe customer yet', async () => {
    (prisma.user.findUnique as any).mockResolvedValue({ stripeCustomerId: null });

    const result = await listInvoicesForUser('u1');

    expect(result).toEqual([]);
    expect(stripeMock.invoices.list).not.toHaveBeenCalled();
  });

  it('maps Stripe invoices to the display shape', async () => {
    (prisma.user.findUnique as any).mockResolvedValue({ stripeCustomerId: 'cus_1' });
    stripeMock.customers.retrieve.mockResolvedValue({ deleted: false });
    stripeMock.invoices.list.mockResolvedValue({
      data: [
        {
          id: 'in_1',
          created: 1700000000,
          amount_paid: 1900,
          amount_due: 0,
          currency: 'eur',
          status: 'paid',
          hosted_invoice_url: 'https://stripe.example/in_1',
        },
      ],
    });

    const result = await listInvoicesForUser('u1');

    expect(result).toEqual([
      {
        id: 'in_1',
        date: new Date(1700000000 * 1000),
        amount: 1900,
        currency: 'eur',
        status: 'paid',
        hostedInvoiceUrl: 'https://stripe.example/in_1',
      },
    ]);
  });

  it('returns an empty list without listing invoices when the Stripe customer has been deleted', async () => {
    (prisma.user.findUnique as any).mockResolvedValue({ stripeCustomerId: 'cus_gone' });
    stripeMock.customers.retrieve.mockResolvedValue({ deleted: true, id: 'cus_gone' });

    const result = await listInvoicesForUser('u1');

    expect(result).toEqual([]);
    expect(stripeMock.invoices.list).not.toHaveBeenCalled();
  });
});

describe('handleWebhook — donation settles only when Stripe reports it paid', () => {
  // Minimal in-memory `donations` and `payment_events` tables, so each test
  // asserts the persisted donation row and runs the real PaymentEvent
  // duplicate handling in handleWebhook — not just which mock was called.
  const donations = new Map<string, Record<string, unknown>>();
  const paymentEvents = new Map<string, Record<string, unknown>>();

  const PENDING_ROW = {
    id: 'don_1',
    userId: 'u1',
    amount: 2500,
    currency: 'eur',
    status: 'PENDING',
    stripePaymentIntentId: null,
    stripeCheckoutSessionId: 'cs_don',
  };

  beforeEach(() => {
    donations.clear();
    paymentEvents.clear();
    donations.set('cs_don', { ...PENDING_ROW });
    (prisma.donation.updateMany as any).mockImplementation(async ({ where, data }: any) => {
      const row = donations.get(where.stripeCheckoutSessionId);
      if (!row) return { count: 0 };
      donations.set(where.stripeCheckoutSessionId, { ...row, ...data });
      return { count: 1 };
    });
    (prisma.paymentEvent.findUnique as any).mockImplementation(async ({ where }: any) => paymentEvents.get(where.eventId) ?? null);
    (prisma.paymentEvent.updateMany as any).mockImplementation(async ({ where, data }: any) => {
      const row = paymentEvents.get(where.eventId);
      if (!row || row.status === where.status.not) return { count: 0 };
      paymentEvents.set(where.eventId, { ...row, ...data });
      return { count: 1 };
    });
    (prisma.paymentEvent.create as any).mockImplementation(async ({ data }: any) => {
      paymentEvents.set(data.eventId, { ...data });
      return data;
    });
  });

  function checkoutEvent(id: string, type: string, session: Record<string, unknown>) {
    return {
      id,
      type,
      data: { object: { id: 'cs_don', mode: 'payment', metadata: { kind: 'donation', userId: 'u1' }, ...session } },
    } as any;
  }

  it('checkout.session.completed with payment_status "paid" marks the donation SUCCEEDED', async () => {
    await handleWebhook(checkoutEvent('evt_paid', 'checkout.session.completed', { payment_status: 'paid', payment_intent: 'pi_paid' }));

    expect(donations.get('cs_don')).toEqual({ ...PENDING_ROW, status: 'SUCCEEDED', stripePaymentIntentId: 'pi_paid' });
  });

  it('checkout.session.completed with payment_status "unpaid" leaves the donation exactly as it was', async () => {
    const result = await handleWebhook(
      checkoutEvent('evt_unpaid', 'checkout.session.completed', { payment_status: 'unpaid', payment_intent: 'pi_pending' }),
    );

    expect(donations.get('cs_don')).toEqual(PENDING_ROW);
    expect(prisma.donation.updateMany).not.toHaveBeenCalled();
    // Handled, not failed — Stripe shouldn't keep retrying an event that
    // was correctly acted on by doing nothing.
    expect(result.duplicate).toBe(false);
    expect(paymentEvents.get('evt_unpaid')?.status).toBe('processed');
  });

  it('checkout.session.completed with payment_status "no_payment_required" does not mark the donation SUCCEEDED', async () => {
    await handleWebhook(checkoutEvent('evt_free', 'checkout.session.completed', { payment_status: 'no_payment_required' }));

    expect(donations.get('cs_don')?.status).toBe('PENDING');
  });

  it('a donation that completed unpaid is settled by checkout.session.async_payment_succeeded once paid', async () => {
    await handleWebhook(checkoutEvent('evt_c', 'checkout.session.completed', { payment_status: 'unpaid' }));
    expect(donations.get('cs_don')?.status).toBe('PENDING');

    await handleWebhook(
      checkoutEvent('evt_async_ok', 'checkout.session.async_payment_succeeded', { payment_status: 'paid', payment_intent: 'pi_later' }),
    );

    expect(donations.get('cs_don')).toEqual({ ...PENDING_ROW, status: 'SUCCEEDED', stripePaymentIntentId: 'pi_later' });
  });

  it('async_payment_succeeded arriving before the unpaid completed event still ends SUCCEEDED', async () => {
    await handleWebhook(
      checkoutEvent('evt_async_first', 'checkout.session.async_payment_succeeded', { payment_status: 'paid', payment_intent: 'pi_x' }),
    );
    await handleWebhook(checkoutEvent('evt_completed_late', 'checkout.session.completed', { payment_status: 'unpaid' }));

    expect(donations.get('cs_don')?.status).toBe('SUCCEEDED');
  });

  it('checkout.session.async_payment_failed does not mark the donation SUCCEEDED', async () => {
    await handleWebhook(checkoutEvent('evt_async_fail', 'checkout.session.async_payment_failed', { payment_status: 'unpaid' }));

    expect(donations.get('cs_don')).toEqual(PENDING_ROW);
  });

  it('async_payment_succeeded for a non-donation session leaves donations and purchases alone', async () => {
    await handleWebhook({
      id: 'evt_async_course',
      type: 'checkout.session.async_payment_succeeded',
      data: { object: { id: 'cs_don', mode: 'payment', metadata: { kind: 'course' }, payment_status: 'paid' } },
    } as any);

    expect(donations.get('cs_don')).toEqual(PENDING_ROW);
    expect(prisma.purchase.updateMany).not.toHaveBeenCalled();
  });

  it('a duplicate delivery of an already-processed event is ignored (PaymentEvent idempotency unchanged)', async () => {
    const event = checkoutEvent('evt_dup', 'checkout.session.completed', { payment_status: 'paid', payment_intent: 'pi_dup' });

    const first = await handleWebhook(event);
    const second = await handleWebhook(event);

    expect(first.duplicate).toBe(false);
    expect(second.duplicate).toBe(true);
    expect(prisma.donation.updateMany).toHaveBeenCalledTimes(1);
    expect(donations.get('cs_don')?.status).toBe('SUCCEEDED');
  });
});

describe('getDonationForUserBySession', () => {
  it('scopes the lookup to the given userId so one member cannot read another\'s donation', async () => {
    (prisma.donation.findFirst as any).mockResolvedValue({ id: 'don_1', status: 'SUCCEEDED' });

    await getDonationForUserBySession('u1', 'cs_123');

    expect(prisma.donation.findFirst).toHaveBeenCalledWith({
      where: { userId: 'u1', stripeCheckoutSessionId: 'cs_123' },
    });
  });
});

describe('reconcileDonationFromCheckoutSession (webhook-delay fallback)', () => {
  const pendingDonation = {
    id: 'd1',
    userId: 'u1',
    amount: 2500,
    currency: 'eur',
    status: 'PENDING',
    stripeCheckoutSessionId: 'cs_1',
  };
  const paidSession = {
    id: 'cs_1',
    mode: 'payment',
    payment_status: 'paid',
    amount_total: 2500,
    currency: 'eur',
    payment_intent: 'pi_1',
    metadata: { kind: 'donation', userId: 'u1' },
  };

  it('marks a PENDING donation SUCCEEDED when Stripe confirms the session is paid', async () => {
    (prisma.donation.findFirst as any)
      .mockResolvedValueOnce(pendingDonation)
      .mockResolvedValueOnce({ ...pendingDonation, status: 'SUCCEEDED' });
    stripeMock.checkout.sessions.retrieve.mockResolvedValue(paidSession);
    (prisma.donation.updateMany as any).mockResolvedValue({ count: 1 });

    const result = await reconcileDonationFromCheckoutSession('u1', 'cs_1');

    expect(result?.status).toBe('SUCCEEDED');
    expect(prisma.donation.updateMany).toHaveBeenCalledTimes(1);
    expect(prisma.donation.updateMany).toHaveBeenCalledWith({
      // Same write as the webhook, additionally scoped to the owner and to
      // unsettled rows so it can never touch another user's or a settled row.
      where: {
        stripeCheckoutSessionId: 'cs_1',
        userId: 'u1',
        status: { in: ['PENDING', 'PROCESSING', 'REQUIRES_ACTION'] },
      },
      data: { status: 'SUCCEEDED', stripePaymentIntentId: 'pi_1' },
    });
  });

  it.each(['unpaid', 'no_payment_required'])(
    'does not mark the donation successful when Stripe says %s',
    async (payment_status) => {
      (prisma.donation.findFirst as any).mockResolvedValue(pendingDonation);
      stripeMock.checkout.sessions.retrieve.mockResolvedValue({ ...paidSession, payment_status });

      const result = await reconcileDonationFromCheckoutSession('u1', 'cs_1');

      expect(result?.status).toBe('PENDING');
      expect(prisma.donation.updateMany).not.toHaveBeenCalled();
    },
  );

  it('keeps the local status and does not throw when the Stripe request fails', async () => {
    (prisma.donation.findFirst as any).mockResolvedValue(pendingDonation);
    stripeMock.checkout.sessions.retrieve.mockRejectedValue(new Error('stripe unavailable'));

    await expect(reconcileDonationFromCheckoutSession('u1', 'cs_1')).resolves.toMatchObject({ status: 'PENDING' });
    expect(prisma.donation.updateMany).not.toHaveBeenCalled();
  });

  it('touches nothing when the session belongs to another user (ownership-scoped lookup finds no row)', async () => {
    (prisma.donation.findFirst as any).mockResolvedValue(null);

    const result = await reconcileDonationFromCheckoutSession('attacker', 'cs_1');

    expect(result).toBeNull();
    expect(prisma.donation.findFirst).toHaveBeenCalledWith({
      where: { userId: 'attacker', stripeCheckoutSessionId: 'cs_1' },
    });
    expect(stripeMock.checkout.sessions.retrieve).not.toHaveBeenCalled();
    expect(prisma.donation.updateMany).not.toHaveBeenCalled();
  });

  it.each([
    ['a different owner in the Stripe metadata', { metadata: { kind: 'donation', userId: 'someone-else' } }],
    ['a different amount', { amount_total: 100 }],
    ['a different currency', { currency: 'usd' }],
    ['a non-donation session', { metadata: { kind: 'course', userId: 'u1' } }],
    ['a subscription-mode session', { mode: 'subscription' }],
  ])('refuses to reconcile a paid session with %s', async (_label, override) => {
    (prisma.donation.findFirst as any).mockResolvedValue(pendingDonation);
    stripeMock.checkout.sessions.retrieve.mockResolvedValue({ ...paidSession, ...override });

    const result = await reconcileDonationFromCheckoutSession('u1', 'cs_1');

    expect(result?.status).toBe('PENDING');
    expect(prisma.donation.updateMany).not.toHaveBeenCalled();
  });

  it.each(['SUCCEEDED', 'FAILED', 'CANCELED'])('never calls Stripe for an already %s donation', async (status) => {
    (prisma.donation.findFirst as any).mockResolvedValue({ ...pendingDonation, status });

    const result = await reconcileDonationFromCheckoutSession('u1', 'cs_1');

    expect(result?.status).toBe(status);
    expect(stripeMock.checkout.sessions.retrieve).not.toHaveBeenCalled();
    expect(prisma.donation.updateMany).not.toHaveBeenCalled();
  });

  it('is idempotent alongside the webhook: repeated fallbacks and a later webhook all write the same SUCCEEDED state', async () => {
    (prisma.donation.findFirst as any)
      // First page load: still PENDING, then re-read after the write.
      .mockResolvedValueOnce(pendingDonation)
      .mockResolvedValueOnce({ ...pendingDonation, status: 'SUCCEEDED' })
      // Second page load: already settled, so nothing more happens.
      .mockResolvedValueOnce({ ...pendingDonation, status: 'SUCCEEDED' });
    stripeMock.checkout.sessions.retrieve.mockResolvedValue(paidSession);
    (prisma.donation.updateMany as any).mockResolvedValue({ count: 1 });

    await reconcileDonationFromCheckoutSession('u1', 'cs_1');
    const second = await reconcileDonationFromCheckoutSession('u1', 'cs_1');
    expect(second?.status).toBe('SUCCEEDED');
    expect(stripeMock.checkout.sessions.retrieve).toHaveBeenCalledTimes(1);

    // The webhook arriving afterwards applies the very same write, harmlessly.
    (prisma.paymentEvent.findUnique as any).mockResolvedValue(null);
    (prisma.paymentEvent.updateMany as any).mockResolvedValue({ count: 0 });
    (prisma.paymentEvent.create as any).mockResolvedValue({});
    await handleWebhook({
      id: 'evt_late',
      type: 'checkout.session.completed',
      data: { object: { id: 'cs_1', metadata: { kind: 'donation' }, payment_status: 'paid', payment_intent: 'pi_1' } },
    } as any);

    const writes = (prisma.donation.updateMany as any).mock.calls.map((c: any[]) => c[0].data);
    expect(writes).toHaveLength(2);
    expect(writes[0]).toEqual(writes[1]);
  });
});
