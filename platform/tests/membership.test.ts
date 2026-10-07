import { describe, it, expect, vi, beforeEach } from 'vitest';

// Mock the Prisma singleton so membership.service.ts can be tested without a
// real database.
vi.mock('@/lib/prisma', () => ({
  prisma: {
    membershipPlan: { findMany: vi.fn(), findUnique: vi.fn(), create: vi.fn(), update: vi.fn() },
    subscription: { findFirst: vi.fn(), findMany: vi.fn() },
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
  listStripeSubscriptionViews: vi.fn(),
}));

const { prisma } = await import('@/lib/prisma');
const billing = await import('@/modules/payments/billing.service');
const { createPlan, updatePlan, listActivePlans, getActiveSubscriptionForUser, getLatestSubscriptionForUser } =
  await import('@/modules/membership/membership.service');

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

describe('membership subscription lookup (Billing / Account / Membership)', () => {
  const plan = { id: 'plan_1', name: 'KUKO WAY Premium', amount: 2999, currency: 'eur', interval: 'month' };
  const day = 24 * 60 * 60 * 1000;
  const localRow = (over: Record<string, unknown> = {}) => ({
    stripeSubscriptionId: 'sub_local',
    status: 'ACTIVE',
    currentPeriodEnd: new Date(Date.now() + 20 * day),
    cancelAtPeriodEnd: false,
    createdAt: new Date(Date.now() - 10 * day),
    membershipPlanId: 'plan_1',
    membershipPlan: plan,
    ...over,
  });
  const stripeView = (over: Record<string, unknown> = {}) => ({
    source: 'stripe',
    stripeSubscriptionId: 'sub_live',
    status: 'ACTIVE',
    currentPeriodEnd: new Date(Date.now() + 28 * day),
    cancelAtPeriodEnd: false,
    createdAt: new Date(Date.now() - 2 * day),
    membershipPlanId: 'plan_1',
    membershipPlan: plan,
    ...over,
  });

  beforeEach(() => {
    (prisma.subscription.findMany as any).mockResolvedValue([]);
    (billing.listStripeSubscriptionViews as any).mockResolvedValue([]);
  });

  it('an active local subscription is current — without asking Stripe', async () => {
    (prisma.subscription.findMany as any).mockResolvedValue([localRow()]);
    const sub = await getActiveSubscriptionForUser('user_1');
    expect(sub).toMatchObject({ source: 'local', status: 'ACTIVE', membershipPlan: { name: 'KUKO WAY Premium' } });
    expect(billing.listStripeSubscriptionViews).not.toHaveBeenCalled();
    // Scoped to the requesting user.
    expect((prisma.subscription.findMany as any).mock.calls[0][0].where).toEqual({ userId: 'user_1' });
  });

  it('the bug: no local row, but active in Stripe → shown as active (read from Stripe)', async () => {
    (billing.listStripeSubscriptionViews as any).mockResolvedValue([stripeView()]);
    expect(await getActiveSubscriptionForUser('user_1')).toMatchObject({ source: 'stripe', status: 'ACTIVE' });
    expect(await getLatestSubscriptionForUser('user_1')).toMatchObject({ source: 'stripe', status: 'ACTIVE' });
  });

  it('cancel-at-period-end stays active until the period ends', async () => {
    (prisma.subscription.findMany as any).mockResolvedValue([localRow({ cancelAtPeriodEnd: true })]);
    expect(await getActiveSubscriptionForUser('user_1')).toMatchObject({ status: 'ACTIVE', cancelAtPeriodEnd: true });
  });

  it('an expired subscription is not active (canceled, or cancel-at-period-end past its end)', async () => {
    (prisma.subscription.findMany as any).mockResolvedValue([
      localRow({ status: 'CANCELED', stripeSubscriptionId: 'sub_a' }),
      localRow({ cancelAtPeriodEnd: true, currentPeriodEnd: new Date(Date.now() - day), stripeSubscriptionId: 'sub_b' }),
    ]);
    expect(await getActiveSubscriptionForUser('user_1')).toBeNull();
    // Billing still shows the most recent one as history (not as active).
    const latest = await getLatestSubscriptionForUser('user_1');
    expect(latest).not.toBeNull();
    expect(latest!.status === 'CANCELED' || latest!.cancelAtPeriodEnd).toBe(true);
  });

  it.each(['TRIALING', 'PAST_DUE'])('%s counts as in effect', async (status) => {
    (prisma.subscription.findMany as any).mockResolvedValue([localRow({ status })]);
    expect(await getActiveSubscriptionForUser('user_1')).toMatchObject({ status });
  });

  it.each(['INCOMPLETE', 'INCOMPLETE_EXPIRED', 'UNPAID', 'CANCELED'])('%s is not in effect', async (status) => {
    (prisma.subscription.findMany as any).mockResolvedValue([localRow({ status })]);
    expect(await getActiveSubscriptionForUser('user_1')).toBeNull();
  });

  it('no subscription anywhere → null ("No active membership subscription")', async () => {
    expect(await getActiveSubscriptionForUser('user_1')).toBeNull();
    expect(await getLatestSubscriptionForUser('user_1')).toBeNull();
  });

  it('multiple historical subscriptions → the one currently in effect, not just the newest row', async () => {
    (prisma.subscription.findMany as any).mockResolvedValue([
      localRow({ status: 'CANCELED', stripeSubscriptionId: 'sub_new_canceled', createdAt: new Date(Date.now() - day) }),
      localRow({ status: 'ACTIVE', stripeSubscriptionId: 'sub_old_active', createdAt: new Date(Date.now() - 60 * day) }),
    ]);
    expect(await getActiveSubscriptionForUser('user_1')).toMatchObject({ stripeSubscriptionId: 'sub_old_active' });
    expect(await getLatestSubscriptionForUser('user_1')).toMatchObject({ stripeSubscriptionId: 'sub_old_active' });
  });

  it('a stale local CANCELED row does not hide a newer active Stripe subscription', async () => {
    (prisma.subscription.findMany as any).mockResolvedValue([localRow({ status: 'CANCELED' })]);
    (billing.listStripeSubscriptionViews as any).mockResolvedValue([stripeView()]);
    expect(await getActiveSubscriptionForUser('user_1')).toMatchObject({ stripeSubscriptionId: 'sub_live' });
  });

  it('the same subscription seen locally and in Stripe counts once (local record wins)', async () => {
    (prisma.subscription.findMany as any).mockResolvedValue([localRow({ status: 'CANCELED', stripeSubscriptionId: 'sub_x' })]);
    (billing.listStripeSubscriptionViews as any).mockResolvedValue([stripeView({ stripeSubscriptionId: 'sub_x' })]);
    expect(await getActiveSubscriptionForUser('user_1')).toBeNull();
  });
});
