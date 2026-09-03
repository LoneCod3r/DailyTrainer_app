import { prisma } from '@/lib/prisma';
import { Errors } from '@/lib/api-response';
import { createLogger } from '@/lib/logger';
import {
  createMembershipPlanProduct,
  updateMembershipPlanProduct,
  replaceMembershipPlanPrice,
  setMembershipPlanProductActive,
} from '@/modules/payments/billing.service';
import type { CreateMembershipPlanInput, UpdateMembershipPlanInput } from '@/lib/validations/membership';

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

export async function getPlanById(id: string) {
  const plan = await prisma.membershipPlan.findUnique({ where: { id } });
  if (!plan) throw Errors.notFound('Membership plan not found');
  return plan;
}

// A user may have at most one Subscription row that Stripe currently
// considers "in effect" (active/trialing/past_due — the last one still
// grants access while payment retries). CANCELED/INCOMPLETE_EXPIRED/UNPAID
// rows are history, not current membership.
export async function getActiveSubscriptionForUser(userId: string) {
  return prisma.subscription.findFirst({
    where: { userId, status: { in: ['ACTIVE', 'TRIALING', 'PAST_DUE'] } },
    include: { membershipPlan: true },
    orderBy: { createdAt: 'desc' },
  });
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
