import type Stripe from 'stripe';
import { PaymentStatus, SubscriptionStatus, type Prisma } from '@prisma/client';
import { prisma } from '@/lib/prisma';
import { getStripeClient } from '@/lib/stripe';
import { createLogger } from '@/lib/logger';
import { Errors } from '@/lib/api-response';
import type { Locale } from '@/lib/i18n/locale';

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

// Newer Stripe API versions (confirmed against a real webhook event: this
// account is on `2026-08-26.dahlia`) no longer populate the billing period
// on the top-level Subscription object — `current_period_start`/`_end` come
// back `undefined` there. The period now lives per subscription item
// instead (Stripe's "flexible billing periods" change), at
// `items.data[0].current_period_start`/`_end`. The installed `stripe` SDK's
// types haven't caught up with this shape (SubscriptionItem isn't typed
// with these fields yet), so they're read defensively here rather than cast
// through the stale type. Every checkout this app creates has exactly one
// line item (see createSubscriptionCheckout), so the first item is
// authoritative. Never fabricates a date: if neither shape has a valid
// timestamp, the (nullable) column is left `null` instead of storing an
// invalid or made-up date.
type SubscriptionItemWithPeriod = Stripe.SubscriptionItem & {
  current_period_start?: number;
  current_period_end?: number;
};

function subscriptionPeriod(sub: Stripe.Subscription): { start: Date | null; end: Date | null } {
  const item = sub.items?.data?.[0] as SubscriptionItemWithPeriod | undefined;
  const startSeconds = sub.current_period_start ?? item?.current_period_start;
  const endSeconds = sub.current_period_end ?? item?.current_period_end;

  return {
    start: Number.isFinite(startSeconds) ? new Date(startSeconds! * 1000) : null,
    end: Number.isFinite(endSeconds) ? new Date(endSeconds! * 1000) : null,
  };
}

// --- Customer ----------------------------------------------------------------

// Ensures the given user has exactly one Stripe Customer, creating it lazily
// on first use. Guards against the double-customer bug (Prompt3 §8) by
// re-reading the user row inside the same call and short-circuiting if a
// concurrent request already set stripeCustomerId.
//
// `locale` is the app's active language ('bg' | 'en', already valid Stripe
// language tags). Stripe uses the Customer's `preferred_locales` to localize
// invoice/receipt PDFs and emails (not the hosted invoice page, which follows
// the browser). New customers are created with it; existing ones are synced
// only when it actually differs, and a failed sync never blocks the caller.
// Omitted => the Customer's language is left untouched.
async function syncCustomerLocale(stripe: Stripe, customerId: string, locale: Locale) {
  try {
    const customer = await stripe.customers.retrieve(customerId);
    if (customer.deleted) return;
    const current = customer.preferred_locales ?? [];
    if (current.length === 1 && current[0] === locale) return;
    await stripe.customers.update(customerId, { preferred_locales: [locale] });
  } catch (err) {
    log.warn('stripe customer locale sync failed', { stripeCustomerId: customerId, message: (err as Error).message });
  }
}

// Mirrors the app language onto a user's EXISTING Stripe Customer (used when
// they switch language). Never creates a Customer: users who haven't started
// billing yet have nothing to sync. Never throws for Stripe problems (missing
// key included) — language switching must not depend on Stripe.
export async function syncStripeCustomerLocaleForUser(userId: string, locale: Locale): Promise<void> {
  const user = await prisma.user.findUnique({ where: { id: userId }, select: { stripeCustomerId: true } });
  if (!user?.stripeCustomerId) return;

  try {
    await syncCustomerLocale(getStripeClient(), user.stripeCustomerId, locale);
  } catch (err) {
    log.warn('stripe customer locale sync failed', { stripeCustomerId: user.stripeCustomerId, message: (err as Error).message });
  }
}

export async function getOrCreateStripeCustomer(userId: string, locale?: Locale): Promise<string> {
  // Explicit allow-list: this only ever needs the customer-identity fields
  // below, never passwordHash/failedLoginAttempts/lockedUntil/etc. (see
  // users.service.ts's getUserById for the same pattern).
  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: { id: true, email: true, name: true, stripeCustomerId: true },
  });
  if (!user) throw Errors.notFound('User not found');
  if (user.stripeCustomerId) {
    if (locale) await syncCustomerLocale(getStripeClient(), user.stripeCustomerId, locale);
    return user.stripeCustomerId;
  }

  const stripe = getStripeClient();
  const customer = await stripe.customers.create({
    email: user.email,
    name: user.name ?? undefined,
    metadata: { userId: user.id },
    ...(locale ? { preferred_locales: [locale] } : {}),
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
    const fresh = await prisma.user.findUnique({ where: { id: userId }, select: { stripeCustomerId: true } });
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

export async function createSubscriptionCheckout(params: { userId: string; membershipPlanId: string; locale?: Locale }) {
  const plan = await prisma.membershipPlan.findUnique({ where: { id: params.membershipPlanId } });
  if (!plan || !plan.active) throw Errors.notFound('Membership plan not found or inactive');
  if (!plan.stripePriceId) {
    throw Errors.badRequest('This membership plan is not yet connected to a Stripe Price');
  }

  const customerId = await getOrCreateStripeCustomer(params.userId, params.locale);
  const stripe = getStripeClient();

  const session = await stripe.checkout.sessions.create({
    mode: 'subscription',
    customer: customerId,
    line_items: [{ price: plan.stripePriceId, quantity: 1 }],
    success_url: `${process.env.APP_URL}/account/membership/success?session_id={CHECKOUT_SESSION_ID}`,
    cancel_url: `${process.env.APP_URL}/account/membership?checkout=cancelled`,
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
    success_url: `${process.env.APP_URL}/community/courses/${params.courseId}?purchase=success`,
    cancel_url: `${process.env.APP_URL}/community/courses/${params.courseId}`,
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

export async function createDonationCheckout(params: {
  userId?: string;
  amount: number;
  currency?: string;
  // The app's active UI language. Without it Stripe's hosted Checkout falls
  // back to the browser's Accept-Language, so an English session could be
  // shown in Bulgarian. Omitted => Stripe's own auto-detection, as before.
  locale?: 'en' | 'bg';
}) {
  const stripe = getStripeClient();
  const currency = params.currency ?? 'eur';

  const customerId = params.userId ? await getOrCreateStripeCustomer(params.userId, params.locale) : undefined;

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
    locale: params.locale,
    success_url: `${process.env.APP_URL}/account/donation?donation=success&session_id={CHECKOUT_SESSION_ID}`,
    cancel_url: `${process.env.APP_URL}/account/donation?donation=cancelled`,
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

// --- Read-only Stripe lookups for the Billing page ------------------------------
// These never persist anything locally (Prompt3 §23: no fake/duplicated
// invoice or card data) — Stripe stays the single source of truth for
// payment method and invoice details; this app only ever displays what
// Stripe currently reports for the user's customer.

export type PaymentMethodSummary = {
  brand: string;
  last4: string;
  expMonth: number;
  expYear: number;
};

export async function getPaymentMethodForUser(userId: string): Promise<PaymentMethodSummary | null> {
  const user = await prisma.user.findUnique({ where: { id: userId }, select: { stripeCustomerId: true } });
  if (!user?.stripeCustomerId) return null;

  const stripe = getStripeClient();
  const customer = await stripe.customers.retrieve(user.stripeCustomerId, {
    expand: ['invoice_settings.default_payment_method'],
  });

  // A Customer deleted directly in Stripe (e.g. dashboard/test-mode cleanup)
  // while the local stripeCustomerId still points at it — treat exactly like
  // "no Stripe customer yet" rather than falling through to
  // paymentMethods.list, which rejects a deleted customer id.
  if (customer.deleted) return null;

  const defaultPm = customer.invoice_settings?.default_payment_method;
  if (defaultPm && typeof defaultPm === 'object' && defaultPm.card) {
    return {
      brand: defaultPm.card.brand,
      last4: defaultPm.card.last4,
      expMonth: defaultPm.card.exp_month,
      expYear: defaultPm.card.exp_year,
    };
  }

  // No default set yet (e.g. checkout hasn't stored one) — fall back to the
  // most recently attached card, if any.
  const methods = await stripe.paymentMethods.list({ customer: user.stripeCustomerId, type: 'card', limit: 1 });
  const first = methods.data[0];
  if (!first?.card) return null;
  return { brand: first.card.brand, last4: first.card.last4, expMonth: first.card.exp_month, expYear: first.card.exp_year };
}

export type InvoiceSummary = {
  id: string;
  date: Date;
  amount: number;
  currency: string;
  status: string;
  hostedInvoiceUrl: string | null;
};

export async function listInvoicesForUser(userId: string, limit = 12): Promise<InvoiceSummary[]> {
  const user = await prisma.user.findUnique({ where: { id: userId }, select: { stripeCustomerId: true } });
  if (!user?.stripeCustomerId) return [];

  const stripe = getStripeClient();

  // Same deleted-customer guard as getPaymentMethodForUser above: a stale
  // local stripeCustomerId pointing at a Customer removed directly in
  // Stripe must degrade to "no billing history", not throw invoices.list
  // into an error for a customer id that no longer exists.
  const customer = await stripe.customers.retrieve(user.stripeCustomerId);
  if (customer.deleted) return [];

  const invoices = await stripe.invoices.list({ customer: user.stripeCustomerId, limit });

  return invoices.data.map((invoice) => ({
    id: invoice.id,
    date: new Date((invoice.created ?? 0) * 1000),
    amount: invoice.amount_paid || invoice.amount_due,
    currency: invoice.currency,
    status: invoice.status ?? 'unknown',
    hostedInvoiceUrl: invoice.hosted_invoice_url ?? null,
  }));
}

// Looks up a donation by Stripe Checkout Session id, scoped to the given
// user — so the donation confirmation page can never be used to probe
// another member's donation by guessing a session id in the URL.
export async function getDonationForUserBySession(userId: string, stripeCheckoutSessionId: string) {
  return prisma.donation.findFirst({ where: { userId, stripeCheckoutSessionId } });
}

// The one place a donation is marked SUCCEEDED — shared by the verified
// webhook (checkout.session.completed) and the confirmation page's fallback
// below, so both apply identical write semantics. `updateMany` keyed on the
// Stripe session id is naturally idempotent: repeating it (or running it
// concurrently from both paths) just re-writes the same values.
async function markDonationSucceeded(where: Prisma.DonationWhereInput, stripePaymentIntentId: string | undefined) {
  return prisma.donation.updateMany({
    where,
    data: { status: PaymentStatus.SUCCEEDED, stripePaymentIntentId },
  });
}

const UNSETTLED_DONATION_STATUSES = [PaymentStatus.PENDING, PaymentStatus.PROCESSING, PaymentStatus.REQUIRES_ACTION];

// Fallback for when the webhook is delayed or never arrives: called by the
// donation confirmation page, it returns the signed-in user's donation for
// this Checkout Session and — only if that row is still unsettled — asks
// Stripe directly whether the session was actually paid. The redirect/URL is
// never proof of payment: only a server-side Stripe response that matches the
// stored row (same session, this user, same amount/currency) can flip it.
// The webhook stays the primary path; this never throws, so a Stripe outage
// or missing configuration just leaves the row as-is ("confirming" state).
export async function reconcileDonationFromCheckoutSession(userId: string, stripeCheckoutSessionId: string) {
  // Scoped to the user first: another member's session id finds nothing here,
  // so nothing below can inspect or modify their donation.
  const donation = await getDonationForUserBySession(userId, stripeCheckoutSessionId);
  if (!donation || !UNSETTLED_DONATION_STATUSES.includes(donation.status as never)) return donation;

  try {
    const session = await getStripeClient().checkout.sessions.retrieve(stripeCheckoutSessionId);

    const matchesDonation =
      session.id === stripeCheckoutSessionId &&
      session.mode === 'payment' &&
      session.metadata?.kind === 'donation' &&
      session.metadata?.userId === userId &&
      session.amount_total === donation.amount &&
      session.currency?.toLowerCase() === donation.currency.toLowerCase();

    if (session.payment_status !== 'paid') return donation;
    if (!matchesDonation) {
      log.warn('donation reconcile skipped: paid Stripe session does not match the stored donation', {
        donationId: donation.id,
      });
      return donation;
    }

    await markDonationSucceeded(
      { stripeCheckoutSessionId, userId, status: { in: UNSETTLED_DONATION_STATUSES } },
      typeof session.payment_intent === 'string' ? session.payment_intent : session.payment_intent?.id,
    );
    log.info('donation reconciled from Stripe Checkout Session', { donationId: donation.id });

    return (await getDonationForUserBySession(userId, stripeCheckoutSessionId)) ?? donation;
  } catch (err) {
    log.warn('donation reconcile failed; keeping local status', { donationId: donation.id, message: (err as Error).message });
    return donation;
  }
}

export async function createCustomerPortalSession(userId: string, locale?: Locale) {
  const customerId = await getOrCreateStripeCustomer(userId, locale);
  const stripe = getStripeClient();

  return stripe.billingPortal.sessions.create({
    customer: customerId,
    return_url: `${process.env.APP_URL}/account/billing`,
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

// Prisma's error shape for a unique-constraint violation (P2002) — checked
// structurally rather than via `instanceof Prisma.PrismaClientKnownRequestError`
// so tests can simulate it with a plain object, and so this file doesn't need
// an extra import just for the error class.
function isUniqueConstraintError(err: unknown): boolean {
  return typeof err === 'object' && err !== null && (err as { code?: unknown }).code === 'P2002';
}

// Writes the outcome of a processing attempt for `eventId`, without ever
// downgrading a row that's already `processed` back to `error` — a failing
// concurrent delivery must not stomp on a delivery that already succeeded.
// Tries `updateMany` first (works whether the row already exists as
// `error`, a stale `processing`-less first attempt, or not at all — the
// `not: 'processed'` guard makes the no-op case explicit via `count === 0`).
// If no row existed yet, falls back to `create`; if that races against a
// concurrent winner (P2002), makes one more guarded `updateMany` attempt so
// this delivery's outcome still lands unless the row is already `processed`.
async function recordWebhookOutcome(
  eventId: string,
  eventType: string,
  outcome: { status: 'processed' | 'error'; errorMessage?: string },
) {
  const data = {
    status: outcome.status,
    errorMessage: outcome.status === 'processed' ? null : outcome.errorMessage ?? null,
    processedAt: new Date(),
  };

  const updated = await prisma.paymentEvent.updateMany({
    where: { eventId, status: { not: 'processed' } },
    data,
  });
  if (updated.count > 0) return;

  try {
    await prisma.paymentEvent.create({ data: { eventId, eventType, ...data } });
  } catch (err) {
    if (!isUniqueConstraintError(err)) throw err;
    // A concurrent delivery created the row between our updateMany and this
    // create — apply our outcome once more, still guarded against
    // downgrading an already-`processed` row.
    await prisma.paymentEvent.updateMany({ where: { eventId, status: { not: 'processed' } }, data });
  }
}

// The backend/database is the source of truth (Prompt3 §6): a checkout
// success redirect NEVER marks anything paid by itself — only a verified
// webhook event does. `handleWebhook` is idempotent: a `processed`
// PaymentEvent is never reprocessed, but a prior `error` (a failed first
// attempt) IS retried on the next delivery of the same event id — Stripe
// redelivers failed events using the same id, so treating any existing row
// as "already handled" regardless of status would permanently swallow a
// failed event's retries. `processStripeEvent`'s handlers are all
// idempotent single-write operations (upsert/updateMany keyed on Stripe
// ids), so it's safe for two concurrent deliveries of a brand-new event to
// both run it — recordWebhookOutcome's guarded writes ensure the bookkeeping
// itself never corrupts or downgrades either outcome.
export async function handleWebhook(event: Stripe.Event) {
  const already = await prisma.paymentEvent.findUnique({ where: { eventId: event.id } });

  if (already?.status === 'processed') {
    log.info('duplicate webhook event ignored', { eventId: event.id, type: event.type });
    return { duplicate: true };
  }
  if (already?.status === 'error') {
    log.info('retrying previously errored webhook event', { eventId: event.id, type: event.type });
  }

  try {
    await processStripeEvent(event);
    await recordWebhookOutcome(event.id, event.type, { status: 'processed' });
    return { duplicate: false };
  } catch (err) {
    await recordWebhookOutcome(event.id, event.type, {
      status: 'error',
      errorMessage: (err as Error)?.message?.slice(0, 500),
    });

    // A concurrent delivery of the same event may have already succeeded
    // while this attempt was failing — recordWebhookOutcome's guard means
    // that success was preserved, not overwritten. Don't report a false
    // failure (and don't have the route return 500, which would make Stripe
    // keep retrying an event that's genuinely already handled) in that case.
    const current = await prisma.paymentEvent.findUnique({ where: { eventId: event.id } });
    if (current?.status === 'processed') {
      log.info('webhook processing failed locally but the event already succeeded via a concurrent delivery', {
        eventId: event.id,
        type: event.type,
      });
      return { duplicate: true };
    }

    throw err;
  }
}

async function processStripeEvent(event: Stripe.Event) {
  switch (event.type) {
    case 'checkout.session.completed': {
      const session = event.data.object as Stripe.Checkout.Session;
      const kind = session.metadata?.kind;

      if (kind === 'donation') {
        await markDonationSucceeded(
          { stripeCheckoutSessionId: session.id },
          typeof session.payment_intent === 'string' ? session.payment_intent : session.payment_intent?.id,
        );
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
        const { start, end } = subscriptionPeriod(sub);
        await prisma.subscription.upsert({
          where: { stripeSubscriptionId: sub.id },
          create: {
            userId,
            membershipPlanId,
            stripeCustomerId: typeof sub.customer === 'string' ? sub.customer : sub.customer.id,
            stripeSubscriptionId: sub.id,
            status: stripeSubStatus(sub.status),
            currentPeriodStart: start,
            currentPeriodEnd: end,
            cancelAtPeriodEnd: sub.cancel_at_period_end,
          },
          update: {
            status: stripeSubStatus(sub.status),
            currentPeriodStart: start,
            currentPeriodEnd: end,
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
