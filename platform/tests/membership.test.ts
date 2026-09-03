import { describe, it, expect, vi, beforeEach } from 'vitest';

// Mock the Prisma singleton so membership.service.ts can be tested without a
// real database.
vi.mock('@/lib/prisma', () => ({
  prisma: {
    membershipPlan: { findMany: vi.fn(), findUnique: vi.fn(), create: vi.fn(), update: vi.fn() },
    subscription: { findFirst: vi.fn() },
  },
}));

// Mock the billing service so no real Stripe call is ever made in tests —
// membership.service.ts must only reach Stripe through these functions
// (Prompt3 §2), never the SDK directly.
vi.mock('@/modules/payments/billing.service', () => ({
  createMembershipPlanProduct: vi.fn(),
  updateMembershipPlanProduct: vi.fn(),
  replaceMembershipPlanPrice: vi.fn(),
  setMembershipPlanProductActive: vi.fn(),
}));

const { prisma } = await import('@/lib/prisma');
const billing = await import('@/modules/payments/billing.service');
const { createPlan, updatePlan, listActivePlans, getActiveSubscriptionForUser } = await import(
  '@/modules/membership/membership.service'
);

beforeEach(() => {
  vi.clearAllMocks();
});

describe('createPlan', () => {
  it('creates the Stripe product/price before writing the DB row, and stores both ids', async () => {
    (billing.createMembershipPlanProduct as any).mockResolvedValue({
      stripeProductId: 'prod_1',
      stripePriceId: 'price_1',
    });
    (prisma.membershipPlan.create as any).mockResolvedValue({ id: 'plan_1' });

    await createPlan({ name: 'Supporter', amount: 1900, currency: 'eur', interval: 'month' });

    expect(billing.createMembershipPlanProduct).toHaveBeenCalledWith(
      expect.objectContaining({ name: 'Supporter', amount: 1900, currency: 'eur', interval: 'month' }),
    );
    expect(prisma.membershipPlan.create).toHaveBeenCalledWith(
      expect.objectContaining({
        data: expect.objectContaining({ stripeProductId: 'prod_1', stripePriceId: 'price_1' }),
      }),
    );
  });
});

describe('updatePlan', () => {
  it('replaces the Stripe price when the amount changes', async () => {
    (prisma.membershipPlan.findUnique as any).mockResolvedValue({
      id: 'plan_1',
      name: 'Supporter',
      description: null,
      amount: 1900,
      currency: 'eur',
      interval: 'month',
      stripeProductId: 'prod_1',
      stripePriceId: 'price_old',
      active: true,
    });
    (billing.replaceMembershipPlanPrice as any).mockResolvedValue('price_new');
    (prisma.membershipPlan.update as any).mockResolvedValue({ id: 'plan_1' });

    await updatePlan('plan_1', { amount: 2900 });

    expect(billing.replaceMembershipPlanPrice).toHaveBeenCalledWith(
      expect.objectContaining({ stripeProductId: 'prod_1', oldStripePriceId: 'price_old', amount: 2900 }),
    );
    expect(prisma.membershipPlan.update).toHaveBeenCalledWith(
      expect.objectContaining({ data: expect.objectContaining({ stripePriceId: 'price_new' }) }),
    );
  });

  it('does not touch Stripe pricing when only the name changes', async () => {
    (prisma.membershipPlan.findUnique as any).mockResolvedValue({
      id: 'plan_1',
      name: 'Supporter',
      description: null,
      amount: 1900,
      currency: 'eur',
      interval: 'month',
      stripeProductId: 'prod_1',
      stripePriceId: 'price_old',
      active: true,
    });
    (prisma.membershipPlan.update as any).mockResolvedValue({ id: 'plan_1' });

    await updatePlan('plan_1', { name: 'Supporter+' });

    expect(billing.replaceMembershipPlanPrice).not.toHaveBeenCalled();
    expect(billing.updateMembershipPlanProduct).toHaveBeenCalledWith('prod_1', { name: 'Supporter+', description: undefined });
  });
});

describe('listActivePlans', () => {
  it('only queries active plans, ordered by price', async () => {
    (prisma.membershipPlan.findMany as any).mockResolvedValue([]);

    await listActivePlans();

    expect(prisma.membershipPlan.findMany).toHaveBeenCalledWith({
      where: { active: true },
      orderBy: { amount: 'asc' },
    });
  });
});

describe('getActiveSubscriptionForUser', () => {
  it('only considers ACTIVE, TRIALING or PAST_DUE as a current membership', async () => {
    (prisma.subscription.findFirst as any).mockResolvedValue(null);

    await getActiveSubscriptionForUser('user_1');

    expect(prisma.subscription.findFirst).toHaveBeenCalledWith(
      expect.objectContaining({
        where: { userId: 'user_1', status: { in: ['ACTIVE', 'TRIALING', 'PAST_DUE'] } },
      }),
    );
  });
});
