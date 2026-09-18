import { describe, it, expect, vi, beforeEach } from 'vitest';

// Mock the Prisma singleton so billing.service.ts can be tested without a
// real database. Every model method used by billing.service.ts is stubbed.
vi.mock('@/lib/prisma', () => ({
  prisma: {
    user: { findUnique: vi.fn(), updateMany: vi.fn() },
    membershipPlan: { findUnique: vi.fn() },
    donation: { create: vi.fn(), updateMany: vi.fn(), findFirst: vi.fn() },
    purchase: { create: vi.fn(), updateMany: vi.fn() },
    subscription: { upsert: vi.fn(), updateMany: vi.fn(), findUnique: vi.fn(), update: vi.fn() },
    payment: { updateMany: vi.fn(), findUnique: vi.fn() },
    paymentEvent: { findUnique: vi.fn(), create: vi.fn(), updateMany: vi.fn() },
  },
}));

// Mock the Stripe client so no real network call is ever made in tests.
const stripeMock = {
  customers: { create: vi.fn(), del: vi.fn(), retrieve: vi.fn() },
  checkout: { sessions: { create: vi.fn() } },
  subscriptions: { update: vi.fn() },
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
  getPaymentMethodForUser,
  listInvoicesForUser,
  getDonationForUserBySession,
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
      data: { object: { id: 'cs_123', metadata: { kind: 'donation' }, payment_intent: 'pi_123' } },
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
      data: { object: { id: 'cs_456', metadata: { kind: 'donation' } } },
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
      data: { object: { id: 'cs_789', metadata: { kind: 'donation' } } },
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
      data: { object: { id: 'cs_race', metadata: { kind: 'donation' } } },
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
      data: { object: { id: 'cs_downgrade', metadata: { kind: 'donation' } } },
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
