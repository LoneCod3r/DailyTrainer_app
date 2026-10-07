import { describe, it, expect } from 'vitest';
import { getCatalog, getFutureProducts, getProgramProduct } from '@/modules/commerce/catalog';
import { getAllProgramsUnfiltered } from '@/modules/programs/service';
import { features } from '@/lib/features';
import { formatCurrency } from '@/lib/format-currency';

// The demo catalog shows the client's confirmed standard prices only. It is
// display-only: nothing here may imply a subscription for a Reset Program,
// a founder price, or an open checkout.
describe('product catalog', () => {
  it('lists the four Reset Programs at the approved prices, as one-time products', () => {
    const expected: [string, number][] = [
      ['1-day', 1900],
      ['3-days', 3900],
      ['7-days', 7900],
      ['28-days', 14900],
    ];
    for (const [slug, amount] of expected) {
      const product = getProgramProduct(slug);
      expect(product?.kind).toBe('PROGRAM');
      expect(product?.status).toBe('current');
      expect(product?.prices).toEqual([{ amount, currency: 'eur', interval: undefined }]);
    }
  });

  it('every Reset Program has a catalog product and vice versa', () => {
    const programSlugs = getAllProgramsUnfiltered().map((p) => p.slug).sort();
    const productSlugs = getCatalog()
      .filter((p) => p.kind === 'PROGRAM')
      .map((p) => p.programSlug)
      .sort();
    expect(productSlugs).toEqual(programSlugs);
  });

  it('Community is a future subscription (€19/month or €190/year) and Trainer a future product (€1,490)', () => {
    const future = getFutureProducts();
    expect(future.map((p) => p.slug)).toEqual(['community', 'trainer']);
    const community = future.find((p) => p.slug === 'community')!;
    expect(community.kind).toBe('SUBSCRIPTION');
    expect(community.prices).toEqual([
      { amount: 1900, currency: 'eur', interval: 'month' },
      { amount: 19000, currency: 'eur', interval: 'year' },
    ]);
    const trainer = future.find((p) => p.slug === 'trainer')!;
    expect(trainer.kind).toBe('TRAINING');
    expect(trainer.prices).toEqual([{ amount: 149000, currency: 'eur', interval: undefined }]);
  });

  it('only subscriptions carry an interval, and no unresolved price tiers exist', () => {
    for (const product of getCatalog()) {
      for (const price of product.prices) {
        expect(Object.keys(price).sort()).toEqual(['amount', 'currency', 'interval']);
        if (product.kind !== 'SUBSCRIPTION') expect(price.interval).toBeUndefined();
      }
    }
  });

  it('showing prices never opens checkout or founder pricing', () => {
    expect(features.pricingPreview).toBe(true); // on outside production
    expect(features.programCheckout).toBe(false);
    expect(features.founders).toBe(false);
    expect(features.membershipSales).toBe(false);
  });
});

describe('formatCurrency', () => {
  it('trims zero cents only when asked, and keeps exact billing formatting by default', () => {
    expect(formatCurrency(1900, 'eur', 'en', { trimZeroCents: true })).toBe('€19');
    expect(formatCurrency(149000, 'eur', 'en', { trimZeroCents: true })).toBe('€1,490');
    expect(formatCurrency(2999, 'eur', 'en', { trimZeroCents: true })).toBe('€29.99');
    expect(formatCurrency(1900, 'eur', 'en')).toBe('€19.00');
  });
});
