import { prisma } from '@/lib/prisma';
import { Errors } from '@/lib/api-response';
import { createLogger } from '@/lib/logger';
import {
  listStripeSubscriptionViews,
  createMembershipPlanProduct,
  updateMembershipPlanProduct,
  replaceMembershipPlanPrice,
  setMembershipPlanProductActive,
} from '@/modules/payments/billing.service';
import type { CreateMembershipPlanInput, UpdateMembershipPlanInput } from '@/lib/validations/membership';
import { selectCurrentSubscription, selectLatestSubscription, type SubscriptionView } from './current-subscription';

const log = createLogger('membership');

// --- Reads ---------------------------------------------------------------------

export async function listActivePlans() {
  return prisma.membershipPlan.findMany({
    where: { active: true },
    orderBy: { amount: 'asc' },
  });
}

export async function listAllPlans() {
  return prisma.membershipPlan.findMany({ orderBy: { createdAt: 'asc' } });
}

// Per-plan subscriber breakdown for the admin dashboard's Membership
// Overview panel — each plan's count of currently-in-effect subscriptions
// (same ACTIVE/TRIALING/PAST_DUE definition as getActiveSubscriptionForUser),
// plus a "Free" bucket for users with no such subscription. A user has at
// most one in-effect subscription, so these buckets partition all users.
export async function getMembershipOverview() {
  const [totalUsers, plans, subsByPlan] = await Promise.all([
    prisma.user.count(),
    listAllPlans(),
    prisma.subscription.groupBy({
      by: ['membershipPlanId'],
      where: { status: { in: ['ACTIVE', 'TRIALING', 'PAST_DUE'] } },
      _count: true,
    }),
  ]);

  const countByPlan = new Map(subsByPlan.map((s) => [s.membershipPlanId, s._count]));
  const withMembers = plans.map((plan) => ({ ...plan, members: countByPlan.get(plan.id) ?? 0 }));
  const freeMembers = Math.max(totalUsers - withMembers.reduce((sum, p) => sum + p.members, 0), 0);

  return { totalUsers, plans: withMembers, freeMembers };
}

export async function getPlanById(id: string) {
  const plan = await prisma.membershipPlan.findUnique({ where: { id } });
  if (!plan) throw Errors.notFound('Membership plan not found');
  return plan;
}

// Membership subscription state for one user — the single choke point every
// surface uses (Billing, Account, Membership, Home, topbar). Selection rules
// live in ./current-subscription.ts.
//
// Local rows (written by the Stripe webhook) are used first. When none of
// them is in effect, Stripe is asked directly (read-only, briefly cached):
// a subscription whose webhook events never arrived has no local row, yet is
// paid and active in Stripe — and its invoices are listed live — so relying
// on the local table alone showed such users "no active subscription".
async function listLocalSubscriptionViews(userId: string): Promise<SubscriptionView[]> {
  const rows = await prisma.subscription.findMany({
    where: { userId },
    include: { membershipPlan: true },
    orderBy: { createdAt: 'desc' },
    take: 20,
  });
  return rows.map((row) => ({
    source: 'local' as const,
    stripeSubscriptionId: row.stripeSubscriptionId,
    status: row.status,
    currentPeriodEnd: row.currentPeriodEnd,
    cancelAtPeriodEnd: row.cancelAtPeriodEnd,
    createdAt: row.createdAt,
    membershipPlanId: row.membershipPlanId,
    membershipPlan: {
      id: row.membershipPlan.id,
      name: row.membershipPlan.name,
      amount: row.membershipPlan.amount,
      currency: row.membershipPlan.currency,
      interval: row.membershipPlan.interval,
    },
  }));
}

async function listSubscriptionCandidates(userId: string, now: Date): Promise<SubscriptionView[]> {
  const local = await listLocalSubscriptionViews(userId);
  if (selectCurrentSubscription(local, now)) return local;
  return [...local, ...(await listStripeSubscriptionViews(userId))];
}

// The subscription currently in effect (active / trialing / past due, and —
// if set to cancel — not yet past its period end), or null.
export async function getActiveSubscriptionForUser(userId: string): Promise<SubscriptionView | null> {
  const now = new Date();
  return selectCurrentSubscription(await listSubscriptionCandidates(userId, now), now);
}

// For Billing ("what am I paying for, and what happened to it"): the one in
// effect, else the most recent historical one (so a just-canceled
// subscription shows as Canceled rather than vanishing), else null.
export async function getLatestSubscriptionForUser(userId: string): Promise<SubscriptionView | null> {
  const now = new Date();
  return selectLatestSubscription(await listSubscriptionCandidates(userId, now), now);
}

// --- Admin mutations -------------------------------------------------------------

// Creates the plan's Stripe Product/Price first — if that fails, no DB row
// is left behind in an inconsistent state (no stripePriceId to check).
export async function createPlan(input: CreateMembershipPlanInput) {
  const { stripeProductId, stripePriceId } = await createMembershipPlanProduct({
    name: input.name,
    description: input.description,
    amount: input.amount,
    currency: input.currency,
    interval: input.interval,
  });

  const plan = await prisma.membershipPlan.create({
    data: {
      name: input.name,
      description: input.description,
      amount: input.amount,
      currency: input.currency,
      interval: input.interval,
      stripeProductId,
      stripePriceId,
      active: input.active ?? true,
    },
  });

  log.info('membership plan created', { planId: plan.id, stripeProductId, stripePriceId });
  return plan;
}

export async function updatePlan(id: string, input: UpdateMembershipPlanInput) {
  const existing = await getPlanById(id);

  const pricingChanged =
    (input.amount !== undefined && input.amount !== existing.amount) ||
    (input.currency !== undefined && input.currency !== existing.currency) ||
    (input.interval !== undefined && input.interval !== existing.interval);

  let stripePriceId = existing.stripePriceId;

  // Stripe Prices are immutable — a pricing change means creating a new
  // Price and archiving the old one, never editing it in place.
  if (pricingChanged && existing.stripeProductId) {
    stripePriceId = await replaceMembershipPlanPrice({
      stripeProductId: existing.stripeProductId,
      oldStripePriceId: existing.stripePriceId,
      amount: input.amount ?? existing.amount,
      currency: input.currency ?? existing.currency,
      interval: (input.interval ?? existing.interval) as 'month' | 'year',
    });
  }

  if (existing.stripeProductId && (input.name !== undefined || input.description !== undefined)) {
    await updateMembershipPlanProduct(existing.stripeProductId, {
      name: input.name,
      description: input.description,
    });
  }

  if (existing.stripeProductId && input.active !== undefined && input.active !== existing.active) {
    await setMembershipPlanProductActive(existing.stripeProductId, input.active);
  }

  const plan = await prisma.membershipPlan.update({
    where: { id },
    data: {
      name: input.name,
      description: input.description,
      amount: input.amount,
      currency: input.currency,
      interval: input.interval,
      active: input.active,
      stripePriceId,
    },
  });

  log.info('membership plan updated', { planId: id, pricingChanged });
  return plan;
}
