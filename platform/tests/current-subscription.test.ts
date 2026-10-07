import { describe, it, expect } from 'vitest';
import {
  isSubscriptionInEffect,
  selectCurrentSubscription,
  selectLatestSubscription,
  type SubscriptionView,
} from '@/modules/membership/current-subscription';

// Pure selection rules behind every membership surface (Billing "Current
// subscription", Account, Membership, Home, topbar) and the duplicate guard.
const NOW = new Date('2026-10-07T12:00:00Z');
const plan = { id: 'plan_1', name: 'KUKO WAY Premium', amount: 2999, currency: 'eur', interval: 'month' };
const sub = (over: Partial<SubscriptionView> = {}): SubscriptionView => ({
  source: 'local',
  stripeSubscriptionId: 'sub_1',
  status: 'ACTIVE',
  currentPeriodEnd: new Date('2026-11-04T22:54:23Z'),
  cancelAtPeriodEnd: false,
  createdAt: new Date('2026-10-04T22:54:23Z'),
  membershipPlanId: 'plan_1',
  membershipPlan: plan,
  ...over,
});

describe('isSubscriptionInEffect', () => {
  it('active / trialing / past due are in effect', () => {
    for (const status of ['ACTIVE', 'TRIALING', 'PAST_DUE'] as const) expect(isSubscriptionInEffect(sub({ status }), NOW)).toBe(true);
  });

  it('canceled, incomplete, incomplete-expired and unpaid are not', () => {
    for (const status of ['CANCELED', 'INCOMPLETE', 'INCOMPLETE_EXPIRED', 'UNPAID'] as const) {
      expect(isSubscriptionInEffect(sub({ status }), NOW)).toBe(false);
    }
  });

  it('cancel-at-period-end is in effect until — and not after — the period end', () => {
    expect(isSubscriptionInEffect(sub({ cancelAtPeriodEnd: true }), NOW)).toBe(true);
    expect(isSubscriptionInEffect(sub({ cancelAtPeriodEnd: true, currentPeriodEnd: new Date('2026-10-01T00:00:00Z') }), NOW)).toBe(
      false,
    );
  });
});

describe('selectCurrentSubscription / selectLatestSubscription', () => {
  it('picks the in-effect subscription running furthest ahead among several', () => {
    const picked = selectCurrentSubscription(
      [
        sub({ stripeSubscriptionId: 'sub_old', currentPeriodEnd: new Date('2026-10-20T00:00:00Z') }),
        sub({ stripeSubscriptionId: 'sub_new', currentPeriodEnd: new Date('2026-12-01T00:00:00Z') }),
        sub({ stripeSubscriptionId: 'sub_gone', status: 'CANCELED', createdAt: new Date('2026-10-06T00:00:00Z') }),
      ],
      NOW,
    );
    expect(picked?.stripeSubscriptionId).toBe('sub_new');
  });

  it('with nothing in effect, Billing shows the most recent historical one — never as current', () => {
    const history = [
      sub({ stripeSubscriptionId: 'sub_a', status: 'CANCELED', createdAt: new Date('2026-08-01T00:00:00Z') }),
      sub({ stripeSubscriptionId: 'sub_b', status: 'INCOMPLETE_EXPIRED', createdAt: new Date('2026-09-01T00:00:00Z') }),
    ];
    expect(selectCurrentSubscription(history, NOW)).toBeNull();
    expect(selectLatestSubscription(history, NOW)?.stripeSubscriptionId).toBe('sub_b');
  });

  it('nothing at all → null', () => {
    expect(selectCurrentSubscription([], NOW)).toBeNull();
    expect(selectLatestSubscription([], NOW)).toBeNull();
  });

  it('the same Stripe subscription from both sources counts once, preferring the local record', () => {
    const picked = selectLatestSubscription(
      [sub({ source: 'stripe', status: 'ACTIVE' }), sub({ source: 'local', status: 'CANCELED' })],
      NOW,
    );
    expect(picked).toMatchObject({ source: 'local', status: 'CANCELED' });
  });
});
