import type Stripe from 'stripe';
import { PaymentStatus, SubscriptionStatus } from '@prisma/client';
import { prisma } from '@/lib/prisma';
import { getStripeClient } from '@/lib/stripe';
import { createLogger } from '@/lib/logger';
import { Errors } from '@/lib/api-response';

const log = createLogger('billing');

// -----------------------------------------------------------------------------
// This is the ONLY file in the app that should import `stripe` directly
// (besides lib/stripe.ts itself and the webhook route). Everything else —
// Membership/future Course/Donation UI — should call these functions instead
// of touching the Stripe SDK, per Prompt3 §2 ("Keep Stripe-specific logic
// inside a dedicated billing/payment service layer").
// -----------------------------------------------------------------------------

function centsToStripeStatus(status: Stripe.PaymentIntent.Status): PaymentStatus {
  switch (status) {
    case 'succeeded':
      return PaymentStatus.SUCCEEDED;
    case 'processing':
      return PaymentStatus.PROCESSING;
    case 'requires_action':
    case 'requires_confirmation':
    case 'requires_capture':
      return PaymentStatus.REQUIRES_ACTION;
    case 'canceled':
      return PaymentStatus.CANCELED;
    default:
      return PaymentStatus.PENDING;
  }
}

function stripeSubStatus(status: Stripe.Subscription.Status): SubscriptionStatus {
  const map: Record<Stripe.Subscription.Status, SubscriptionStatus> = {
    active: SubscriptionStatus.ACTIVE,
    trialing: SubscriptionStatus.TRIALING,
    past_due: SubscriptionStatus.PAST_DUE,
    canceled: SubscriptionStatus.CANCELED,
    incomplete: SubscriptionStatus.INCOMPLETE,
    incomplete_expired: SubscriptionStatus.INCOMPLETE_EXPIRED,
    unpaid: SubscriptionStatus.UNPAID,
    paused: SubscriptionStatus.CANCELED,
  };
  return map[status] ?? SubscriptionStatus.INCOMPLETE;
}

// --- Customer ----------------------------------------------------------------

// Ensures the given user has exactly one Stripe Customer, creating it lazily
// on first use. Guards against the double-customer bug (Prompt3 §8) by
// re-reading the user row inside the same call and short-circuiting if a
// concurrent request already set stripeCustomerId.
export async function getOrCreateStripeCustomer(userId: string): Promise<string> {
  const user = await prisma.user.findUnique({ where: { id: userId } });
  if (!user) throw Errors.notFound('User not found');
  if (user.stripeCustomerId) return user.stripeCustomerId;

  const stripe = getStripeClient();
  const customer = await stripe.customers.create({
    email: user.email,
    name: user.name ?? undefined,
    metadata: { userId: user.id },
  });

  // Use a conditional update so two concurrent requests can't both "win" and
  // create two Stripe customers for the same user.
  const updated = await prisma.user.updateMany({
    where: { id: userId, stripeCustomerId: null },
    data: { stripeCustomerId: customer.id },
  });

  if (updated.count === 0) {
    // Someone else created it in the meantime — reuse theirs, and clean up
    // the extra Stripe customer we just created.
    const fresh = await prisma.user.findUnique({ where: { id: userId } });
    if (fresh?.stripeCustomerId) {
      await stripe.customers.del(customer.id).catch(() => undefined);
      return fresh.stripeCustomerId;
    }
  }

  log.info('stripe customer created', { userId, stripeCustomerId: customer.id });
  return customer.id;
}

// --- Membership plan products/prices --------------------------------------------

// Stripe Prices are immutable (amount/currency/interval can't be edited once
// created) — see replaceMembershipPlanPrice below for how modules/membership
// handles a price change. This function is only used to create the very
// first Price for a brand-new MembershipPlan.
export async function createMembershipPlanProduct(params: {
  name: string;
  description?: string;
  amount: number;
  currency: string;
  interval: 'month' | 'year';
}) {
  const stripe = getStripeClient();

  const product = await stripe.products.create({
    name: params.name,
    description: params.description,
  });
  const price = await stripe.prices.create({
    product: product.id,
    unit_amount: params.amount,
    currency: params.currency,
    recurring: { interval: params.interval },
  });

  log.info('stripe membership product/price created', { stripeProductId: product.id, stripePriceId: price.id });
  return { stripeProductId: product.id, stripePriceId: price.id };
}

export async function updateMembershipPlanProduct(
  stripeProductId: string,
  params: { name?: string; description?: string },
) {
  const stripe = getStripeClient();
  await stripe.products.update(stripeProductId, {
    ...(params.name !== undefined ? { name: params.name } : {}),
    ...(params.description !== undefined ? { description: params.description } : {}),
  });
}

// Creates a new Price for the plan's existing Product and archives the old
// one (active: false) so it can no longer be used for new Checkout Sessions.
// Existing subscribers keep billing at their original Price until they
// resubscribe — Stripe does not retroactively change an active subscription.
export async function replaceMembershipPlanPrice(params: {
  stripeProductId: string;
  oldStripePriceId?: string | null;
  amount: number;
  currency: string;
  interval: 'month' | 'year';
}) {
  const stripe = getStripeClient();

  const price = await stripe.prices.create({
    product: params.stripeProductId,
    unit_amount: params.amount,
    currency: params.currency,
    recurring: { interval: params.interval },
  });

  if (params.oldStripePriceId) {
    await stripe.prices.update(params.oldStripePriceId, { active: false }).catch(() => undefined);
  }

  log.info('stripe membership price replaced', {
    stripeProductId: params.stripeProductId,
    oldStripePriceId: params.oldStripePriceId,
    newStripePriceId: price.id,
  });
  return price.id;
}

export async function setMembershipPlanProductActive(stripeProductId: string, active: boolean) {
  const stripe = getStripeClient();
  await stripe.products.update(stripeProductId, { active });
}

// --- Checkout sessions ---------------------------------------------------------

export async function createSubscriptionCheckout(params: { userId: string; membershipPlanId: string }) {
  const plan = await prisma.membershipPlan.findUnique({ where: { id: params.membershipPlanId } });
  if (!plan || !plan.active) throw Errors.notFound('Membership plan not found or inactive');
  if (!plan.stripePriceId) {
    throw Errors.badRequest('This membership plan is not yet connected to a Stripe Price');
  }

  const customerId = await getOrCreateStripeCustomer(params.userId);
  const stripe = getStripeClient();

  const session = await stripe.checkout.sessions.create({
    mode: 'subscription',
    customer: customerId,
    line_items: [{ price: plan.stripePriceId, quantity: 1 }],
    success_url: `${process.env.APP_URL}/membership/success?session_id={CHECKOUT_SESSION_ID}`,
    cancel_url: `${process.env.APP_URL}/membership`,
    metadata: { userId: params.userId, membershipPlanId: plan.id, kind: 'membership' },
    // Checkout Session metadata does NOT carry over to the Subscription object
    // Stripe creates from it — it must be set explicitly via subscription_data
    // so the customer.subscription.* webhook handlers below (which read
    // sub.metadata.userId/membershipPlanId) can actually find it.
    subscription_data: {
      metadata: { userId: params.userId, membershipPlanId: plan.id },
    },
  });

  log.info('subscription checkout session created', { userId: params.userId, planId: plan.id });
  return session;
}

// Foundation stub: the Courses module does not exist yet, so there is no
// authoritative price source to resolve a course price from. This function
// is intentionally not exposed via a public API route yet — only the future
// Courses module should call it, supplying a server-resolved price.
export async function createOneTimeCheckout(params: {
  userId: string;
  courseId: string;
  amount: number;
  currency?: string;
}) {
  const customerId = await getOrCreateStripeCustomer(params.userId);
  const stripe = getStripeClient();
  const currency = params.currency ?? 'eur';

  const session = await stripe.checkout.sessions.create({
    mode: 'payment',
    customer: customerId,
    line_items: [
      {
        price_data: {
          currency,
          unit_amount: params.amount,
          product_data: { name: `Course purchase (${params.courseId})` },
        },
        quantity: 1,
      },
    ],
    success_url: `${process.env.APP_URL}/courses/${params.courseId}?purchase=success`,
    cancel_url: `${process.env.APP_URL}/courses/${params.courseId}`,
    metadata: { userId: params.userId, courseId: params.courseId, kind: 'course' },
  });

  await prisma.purchase.create({
    data: {
      userId: params.userId,
      courseId: params.courseId,
      amount: params.amount,
      currency,
      status: PaymentStatus.PENDING,
      stripeCheckoutSessionId: session.id,
    },
  });

  return session;
}

export async function createDonationCheckout(params: { userId?: string; amount: number; currency?: string }) {
  const stripe = getStripeClient();
  const currency = params.currency ?? 'eur';

  const customerId = params.userId ? await getOrCreateStripeCustomer(params.userId) : undefined;

  const session = await stripe.checkout.sessions.create({
    mode: 'payment',
    customer: customerId,
    // Guest donations (no customerId): Stripe's hosted Checkout page collects
    // the payer's email itself, so nothing further is needed here.
    line_items: [
      {
        price_data: {
          currency,
          unit_amount: params.amount,
          product_data: { name: 'Donation' },
        },
        quantity: 1,
      },
    ],
    success_url: `${process.env.APP_URL}/donate/success?session_id={CHECKOUT_SESSION_ID}`,
    cancel_url: `${process.env.APP_URL}/donate`,
    metadata: { userId: params.userId ?? '', kind: 'donation' },
  });

  await prisma.donation.create({
    data: {
      userId: params.userId,
      amount: params.amount,
      currency,
      status: PaymentStatus.PENDING,
      stripeCheckoutSessionId: session.id,
    },
  });

  return session;
}

export async function createCustomerPortalSession(userId: string) {
  const customerId = await getOrCreateStripeCustomer(userId);
  const stripe = getStripeClient();

  return stripe.billingPortal.sessions.create({
    customer: customerId,
    return_url: `${process.env.APP_URL}/account`,
  });
}

// --- Reads / mutations used by the (future) admin UI --------------------------

export async function retrievePayment(paymentId: string) {
  const payment = await prisma.payment.findUnique({ where: { id: paymentId } });
  if (!payment) throw Errors.notFound('Payment not found');
  return payment;
}

export async function cancelSubscription(subscriptionId: string) {
  const sub = await prisma.subscription.findUnique({ where: { id: subscriptionId } });
  if (!sub) throw Errors.notFound('Subscription not found');

  const stripe = getStripeClient();
  const updated = await stripe.subscriptions.update(sub.stripeSubscriptionId, {
    cancel_at_period_end: true,
  });

  return prisma.subscription.update({
    where: { id: subscriptionId },
    data: {
      cancelAtPeriodEnd: updated.cancel_at_period_end,
      status: stripeSubStatus(updated.status),
    },
  });
}

// --- Webhook processing --------------------------------------------------------

// The backend/database is the source of truth (Prompt3 §6): a checkout
// success redirect NEVER marks anything paid by itself — only a verified
// webhook event does. `handleWebhook` is idempotent: each Stripe event id is
// recorded exactly once in PaymentEvent, so retried/duplicate deliveries are
// safe to replay.
export async function handleWebhook(event: Stripe.Event) {
  const already = await prisma.paymentEvent.findUnique({ where: { eventId: event.id } });
  if (already) {
    log.info('duplicate webhook event ignored', { eventId: event.id, type: event.type });
    return { duplicate: true };
  }

  try {
    await processStripeEvent(event);
    await prisma.paymentEvent.create({
      data: {
        eventId: event.id,
        eventType: event.type,
        status: 'processed',
        processedAt: new Date(),
      },
    });
    return { duplicate: false };
  } catch (err) {
    await prisma.paymentEvent.create({
      data: {
        eventId: event.id,
        eventType: event.type,
        status: 'error',
        errorMessage: (err as Error)?.message?.slice(0, 500),
        processedAt: new Date(),
      },
    });
    throw err;
  }
}

async function processStripeEvent(event: Stripe.Event) {
  switch (event.type) {
    case 'checkout.session.completed': {
      const session = event.data.object as Stripe.Checkout.Session;
      const kind = session.metadata?.kind;

      if (kind === 'donation') {
        await prisma.donation.updateMany({
          where: { stripeCheckoutSessionId: session.id },
          data: {
            status: PaymentStatus.SUCCEEDED,
            stripePaymentIntentId:
              typeof session.payment_intent === 'string' ? session.payment_intent : session.payment_intent?.id,
          },
        });
      } else if (kind === 'course') {
        await prisma.purchase.updateMany({
          where: { stripeCheckoutSessionId: session.id },
          data: {
            status: PaymentStatus.SUCCEEDED,
            purchasedAt: new Date(),
            stripePaymentIntentId:
              typeof session.payment_intent === 'string' ? session.payment_intent : session.payment_intent?.id,
          },
        });
      }
      // Subscription checkouts are finalized via customer.subscription.* events below.
      break;
    }

    case 'customer.subscription.created':
    case 'customer.subscription.updated': {
      const sub = event.data.object as Stripe.Subscription;
      const userId = sub.metadata?.userId;
      const membershipPlanId = sub.metadata?.membershipPlanId;

      if (userId && membershipPlanId) {
        await prisma.subscription.upsert({
          where: { stripeSubscriptionId: sub.id },
          create: {
            userId,
            membershipPlanId,
            stripeCustomerId: typeof sub.customer === 'string' ? sub.customer : sub.customer.id,
            stripeSubscriptionId: sub.id,
            status: stripeSubStatus(sub.status),
            currentPeriodStart: new Date(sub.current_period_start * 1000),
            currentPeriodEnd: new Date(sub.current_period_end * 1000),
            cancelAtPeriodEnd: sub.cancel_at_period_end,
          },
          update: {
            status: stripeSubStatus(sub.status),
            currentPeriodStart: new Date(sub.current_period_start * 1000),
            currentPeriodEnd: new Date(sub.current_period_end * 1000),
            cancelAtPeriodEnd: sub.cancel_at_period_end,
          },
        });
      }
      break;
    }

    case 'customer.subscription.deleted': {
      const sub = event.data.object as Stripe.Subscription;
      await prisma.subscription.updateMany({
        where: { stripeSubscriptionId: sub.id },
        data: { status: SubscriptionStatus.CANCELED, canceledAt: new Date() },
      });
      break;
    }

    case 'payment_intent.succeeded':
    case 'payment_intent.payment_failed': {
      const intent = event.data.object as Stripe.PaymentIntent;
      await prisma.payment.updateMany({
        where: { stripePaymentIntentId: intent.id },
        data: { status: centsToStripeStatus(intent.status) },
      });
      break;
    }

    default:
      // Unhandled event types are recorded (see handleWebhook) but not
      // otherwise acted on — this keeps the foundation minimal per Prompt3 §17.
      log.debug('unhandled stripe event type', { type: event.type });
  }
}
