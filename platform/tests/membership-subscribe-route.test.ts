import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';

// Exercises the real POST /api/membership/subscribe handler and the real
// billing.service — only the session, the database and Stripe are mocked — to
// show the duplicate-subscription guard holds for a direct API call, whatever
// the membership page does or doesn't render.
vi.mock('@/lib/prisma', () => ({
  prisma: {
    membershipPlan: { findUnique: vi.fn() },
    subscription: { findFirst: vi.fn() },
    user: { findUnique: vi.fn() },
  },
}));
vi.mock('next-auth', () => ({ getServerSession: vi.fn() }));
vi.mock('@/lib/auth', () => ({ authOptions: {} }));
vi.mock('next/headers', () => ({ cookies: () => ({ get: () => undefined }) }));
// Membership sales are closed in V1. The duplicate-guard tests below run with
// sales re-opened (as if Community launched), so that guard stays covered;
// the "sales closed" tests at the end run with the real V1 setting.
const featureState = { membershipSales: true };
vi.mock('@/lib/features', () => ({
  features: {
    get membershipSales() {
      return featureState.membershipSales;
    },
    programCheckout: false,
    pricingPreview: true,
    programsPreview: true,
    founders: false,
  },
}));

const stripeMock = {
  customers: { create: vi.fn(), retrieve: vi.fn(), update: vi.fn() },
  checkout: { sessions: { create: vi.fn() } },
  // Live subscription read used by the duplicate guard (no live subscription).
  subscriptions: { list: vi.fn().mockResolvedValue({ data: [] }) },
};
vi.mock('@/lib/stripe', () => ({ getStripeClient: () => stripeMock, isStripeConfigured: () => true }));

const { prisma } = await import('@/lib/prisma');
const { getServerSession } = await import('next-auth');
const { POST } = await import('@/app/api/membership/subscribe/route');

const PLAN_ID = 'cplanpremium0001';

// Distinct user per test: the route's per-user rate limiter is in-memory and
// would otherwise carry over between tests.
let userCounter = 0;
function signInAsNewUser() {
  const id = `u-route-${++userCounter}`;
  (getServerSession as any).mockResolvedValue({ user: { id, role: 'USER' } });
  (prisma.user.findUnique as any).mockResolvedValue({ id, stripeCustomerId: 'cus_route' });
  return id;
}

const subscribe = () =>
  POST(
    new Request('http://localhost/api/membership/subscribe', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ membershipPlanId: PLAN_ID }),
    }),
  );

beforeEach(() => {
  vi.clearAllMocks();
  (prisma.membershipPlan.findUnique as any).mockResolvedValue({ id: PLAN_ID, active: true, stripePriceId: 'price_1' });
  stripeMock.checkout.sessions.create.mockResolvedValue({ id: 'cs_route', url: 'https://checkout.stripe.test/cs_route' });
});

describe('POST /api/membership/subscribe — duplicate subscription guard', () => {
  it.each(['ACTIVE', 'TRIALING', 'PAST_DUE'])(
    'returns 409 CONFLICT and creates no Checkout Session when the user has a %s subscription',
    async (status) => {
      const userId = signInAsNewUser();
      (prisma.subscription.findFirst as any).mockImplementation(async ({ where }: any) =>
        where.userId === userId && where.status.in.includes(status) ? { id: 'sub_1' } : null,
      );

      const res = await subscribe();

      expect(res.status).toBe(409);
      const body = await res.json();
      expect(body.error.code).toBe('CONFLICT');
      expect(body.url).toBeUndefined();
      expect(stripeMock.checkout.sessions.create).not.toHaveBeenCalled();
    },
  );

  it('returns the Checkout URL when the user has no subscription in effect', async () => {
    signInAsNewUser();
    (prisma.subscription.findFirst as any).mockResolvedValue(null);

    const res = await subscribe();

    expect(res.status).toBe(200);
    expect(await res.json()).toEqual({ url: 'https://checkout.stripe.test/cs_route' });
    expect(stripeMock.checkout.sessions.create).toHaveBeenCalledTimes(1);
  });

  it('checks the signed-in user from the session, not anything in the request body', async () => {
    const userId = signInAsNewUser();
    (prisma.subscription.findFirst as any).mockResolvedValue(null);

    await subscribe();

    expect((prisma.subscription.findFirst as any).mock.calls[0][0].where.userId).toBe(userId);
  });
});

describe('POST /api/membership/subscribe — membership sales closed (V1)', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    featureState.membershipSales = false;
  });
  afterEach(() => {
    featureState.membershipSales = true;
  });

  it('refuses any new membership checkout — the legacy plan cannot be bought', async () => {
    (getServerSession as any).mockResolvedValue({ user: { id: 'u-closed-1', role: 'USER' } });
    const res = await subscribe();
    expect(res.status).toBe(403);
    expect((await res.json()).error.code).toBe('MEMBERSHIP_SALES_CLOSED');
    // Refused before any plan lookup or Stripe call.
    expect(prisma.membershipPlan.findUnique).not.toHaveBeenCalled();
    expect(stripeMock.checkout.sessions.create).not.toHaveBeenCalled();
  });
});
