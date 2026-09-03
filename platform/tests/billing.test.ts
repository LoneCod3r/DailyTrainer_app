import { describe, it, expect, vi, beforeEach } from 'vitest';

// Mock the Prisma singleton so billing.service.ts can be tested without a
// real database. Every model method used by billing.service.ts is stubbed.
vi.mock('@/lib/prisma', () => ({
  prisma: {
    user: { findUnique: vi.fn(), updateMany: vi.fn() },
    membershipPlan: { findUnique: vi.fn() },
    donation: { create: vi.fn(), updateMany: vi.fn() },
    purchase: { create: vi.fn(), updateMany: vi.fn() },
    subscription: { upsert: vi.fn(), updateMany: vi.fn(), findUnique: vi.fn(), update: vi.fn() },
    payment: { updateMany: vi.fn(), findUnique: vi.fn() },
    paymentEvent: { findUnique: vi.fn(), create: vi.fn() },
  },
}));

// Mock the Stripe client so no real network call is ever made in tests.
const stripeMock = {
  customers: { create: vi.fn(), del: vi.fn() },
  checkout: { sessions: { create: vi.fn() } },
  subscriptions: { update: vi.fn() },
  billingPortal: { sessions: { create: vi.fn() } },
};
vi.mock('@/lib/stripe', () => ({
  getStripeClient: () => stripeMock,
}));

const { prisma } = await import('@/lib/prisma');
const { getOrCreateStripeCustomer, handleWebhook, createDonationCheckout } = await import(
  '@/modules/payments/billing.service'
);

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
  it('skips processing when the Stripe event id was already recorded', async () => {
    (prisma.paymentEvent.findUnique as any).mockResolvedValue({ id: 'evt-row', eventId: 'evt_1' });

    const result = await handleWebhook({ id: 'evt_1', type: 'checkout.session.completed' } as any);

    expect(result.duplicate).toBe(true);
    expect(prisma.donation.updateMany).not.toHaveBeenCalled();
    expect(prisma.paymentEvent.create).not.toHaveBeenCalled();
  });

  it('processes a new checkout.session.completed donation event exactly once', async () => {
    (prisma.paymentEvent.findUnique as any).mockResolvedValue(null);
    (prisma.donation.updateMany as any).mockResolvedValue({ count: 1 });
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
    (prisma.paymentEvent.findUnique as any).mockResolvedValue(null);
    (prisma.donation.updateMany as any).mockRejectedValue(new Error('db unavailable'));
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
});
