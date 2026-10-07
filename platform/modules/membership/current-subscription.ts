import type { SubscriptionStatus } from '@prisma/client';

// Which membership subscription is "current" for a user — pure rules, shared
// by every surface that shows membership state (Billing, Account, Membership,
// Home, topbar) and by the duplicate-subscription guard, so they can never
// disagree. Candidates may come from the local `subscriptions` table (kept in
// sync by the Stripe webhook) or, when that has nothing in effect, from a
// live read-only look at Stripe (see listStripeSubscriptionViews in
// modules/payments/billing.service.ts) — e.g. when a webhook was missed.

export interface MembershipPlanView {
  id: string;
  name: string;
  amount: number;
  currency: string;
  interval: string;
}

export interface SubscriptionView {
  source: 'local' | 'stripe';
  stripeSubscriptionId: string;
  status: SubscriptionStatus;
  currentPeriodEnd: Date | null;
  cancelAtPeriodEnd: boolean;
  createdAt: Date;
  membershipPlanId: string;
  membershipPlan: MembershipPlanView;
}

const IN_EFFECT_STATUSES: SubscriptionStatus[] = ['ACTIVE', 'TRIALING', 'PAST_DUE'];

// In effect = Stripe still considers it running (active / trialing / past
// due). Cancel-at-period-end stays in effect until its period actually ends;
// after that it's over even if no "deleted" event has arrived yet.
export function isSubscriptionInEffect(sub: Pick<SubscriptionView, 'status' | 'cancelAtPeriodEnd' | 'currentPeriodEnd'>, now: Date) {
  if (!IN_EFFECT_STATUSES.includes(sub.status)) return false;
  if (sub.cancelAtPeriodEnd && sub.currentPeriodEnd && sub.currentPeriodEnd.getTime() <= now.getTime()) return false;
  return true;
}

function newestFirst(a: SubscriptionView, b: SubscriptionView) {
  const aEnd = a.currentPeriodEnd?.getTime() ?? -Infinity;
  const bEnd = b.currentPeriodEnd?.getTime() ?? -Infinity;
  if (aEnd !== bEnd) return bEnd - aEnd;
  return b.createdAt.getTime() - a.createdAt.getTime();
}

// The subscription in effect, if any — the one running furthest into the
// future. The same Stripe subscription seen both locally and live counts
// once (local wins: it's the webhook-maintained record).
export function selectCurrentSubscription(candidates: SubscriptionView[], now: Date): SubscriptionView | null {
  const inEffect = dedupe(candidates).filter((s) => isSubscriptionInEffect(s, now));
  return inEffect.sort(newestFirst)[0] ?? null;
}

// What Billing shows under "Current subscription": the one in effect, or
// else the most recent historical one (so a just-canceled subscription
// shows as "Canceled" rather than vanishing), or nothing.
export function selectLatestSubscription(candidates: SubscriptionView[], now: Date): SubscriptionView | null {
  const current = selectCurrentSubscription(candidates, now);
  if (current) return current;
  return [...dedupe(candidates)].sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime())[0] ?? null;
}

function dedupe(candidates: SubscriptionView[]): SubscriptionView[] {
  const byId = new Map<string, SubscriptionView>();
  for (const sub of candidates) {
    const existing = byId.get(sub.stripeSubscriptionId);
    if (!existing || (existing.source === 'stripe' && sub.source === 'local')) byId.set(sub.stripeSubscriptionId, sub);
  }
  return [...byId.values()];
}
