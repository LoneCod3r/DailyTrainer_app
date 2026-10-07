import { describe, it, expect, vi } from 'vitest';

// V1: membership sales are closed (lib/features.ts `membershipSales`, off by
// default). The legacy "KUKO WAY Premium" plan must not be exposed as a
// current product. Uses the real feature flags — nothing is mocked to "off".
vi.mock('@/lib/prisma', () => ({
  prisma: {
    membershipPlan: {
      findMany: vi.fn().mockResolvedValue([
        { id: 'plan_legacy', name: 'KUKO WAY Premium', amount: 2999, currency: 'eur', interval: 'month', active: true },
      ]),
    },
  },
}));

const { prisma } = await import('@/lib/prisma');
const { features } = await import('@/lib/features');
const { GET } = await import('@/app/api/membership/plans/route');
const { getCatalog, getFutureProducts } = await import('@/modules/commerce/catalog');

describe('membership sales closed (V1)', () => {
  it('the membership-sales flag is off by default', () => {
    expect(features.membershipSales).toBe(false);
  });

  it('the public plans endpoint offers no plan — the legacy plan is not exposed', async () => {
    const res = await GET();
    expect(res.status).toBe(200);
    expect(await res.json()).toEqual({ plans: [] });
    expect(prisma.membershipPlan.findMany).not.toHaveBeenCalled();
  });

  it('the product catalog never contains the legacy €29.99 plan', () => {
    const catalog = getCatalog();
    expect(catalog.some((p) => /premium/i.test(p.title.en ?? '') || /premium/i.test(p.title.bg))).toBe(false);
    expect(catalog.flatMap((p) => p.prices).some((price) => price.amount === 2999)).toBe(false);
  });

  it('Community stays a future product — the only subscription in the catalog, and not current', () => {
    const subscriptions = getCatalog().filter((p) => p.kind === 'SUBSCRIPTION');
    expect(subscriptions.map((p) => p.slug)).toEqual(['community']);
    expect(getFutureProducts().map((p) => p.slug)).toContain('community');
    expect(subscriptions[0].status).toBe('future');
  });
});
