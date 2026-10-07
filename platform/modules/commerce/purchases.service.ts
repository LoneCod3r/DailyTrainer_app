import type Stripe from 'stripe';
import { PaymentStatus } from '@prisma/client';
import { prisma } from '@/lib/prisma';
import { createLogger } from '@/lib/logger';
import { getCatalog, type CatalogProduct } from './catalog';
import { grantProgramAccess } from './entitlements.service';

const log = createLogger('commerce.purchases');

// Reset Program purchases (one-time). A Purchase row is created PENDING
// before the Stripe Checkout Session (modules/commerce/checkout.service.ts);
// `Purchase.courseId` holds the catalog product slug (e.g. "reset-28-days") —
// the column was introduced as the generic "what was bought" reference for
// one-time purchases, before any course or program existed.
//
// This module never talks to Stripe itself: it is handed a Stripe Checkout
// Session that has already been verified — either from a signature-checked
// webhook event, or freshly retrieved from the Stripe API server-side — and
// decides, from that payment state alone, whether the purchase is paid.
// A redirect back from Stripe is never proof of payment.

const UNSETTLED = [PaymentStatus.PENDING, PaymentStatus.PROCESSING, PaymentStatus.REQUIRES_ACTION];

function programProducts(): CatalogProduct[] {
  return getCatalog().filter((p) => p.kind === 'PROGRAM');
}

export function getProgramProductBySlug(productSlug: string): CatalogProduct | undefined {
  return programProducts().find((p) => p.slug === productSlug);
}

function paymentIntentId(session: Stripe.Checkout.Session): string | undefined {
  return typeof session.payment_intent === 'string' ? session.payment_intent : session.payment_intent?.id;
}

export type SettleResult = 'settled' | 'already-settled' | 'not-paid' | 'mismatch' | 'not-found';

// The single place a Reset Program purchase becomes SUCCEEDED and its
// Entitlement is created. Idempotent: a webhook retry, a duplicate event, or
// the return-page check racing the webhook all converge on one SUCCEEDED
// Purchase and one active Entitlement (grantProgramAccess is idempotent).
//
// Every one of these must match the stored Purchase, or nothing is granted:
// session id, purchase id, user, product, mode, amount and currency.
export async function settleProgramPurchase(
  session: Stripe.Checkout.Session,
  opts: { expectedUserId?: string } = {},
): Promise<SettleResult> {
  if (session.metadata?.kind !== 'program') return 'not-found';

  const purchaseId = session.metadata.purchaseId;
  const purchase = purchaseId ? await prisma.purchase.findUnique({ where: { id: purchaseId } }) : null;
  if (!purchase) {
    log.warn('program checkout session has no matching purchase', { stripeCheckoutSessionId: session.id });
    return 'not-found';
  }

  const product = getProgramProductBySlug(purchase.courseId);
  const matches =
    (purchase.stripeCheckoutSessionId === null || purchase.stripeCheckoutSessionId === session.id) &&
    session.mode === 'payment' &&
    session.metadata.userId === purchase.userId &&
    (opts.expectedUserId === undefined || opts.expectedUserId === purchase.userId) &&
    session.metadata.productSlug === purchase.courseId &&
    Boolean(product?.programSlug) &&
    session.metadata.programSlug === product?.programSlug &&
    session.amount_total === purchase.amount &&
    session.currency?.toLowerCase() === purchase.currency.toLowerCase();

  if (!matches) {
    // Never grant on a mismatch — log for investigation instead. (Not thrown:
    // retrying the same event could never make it match.)
    log.error('program checkout session does not match its purchase; nothing granted', {
      purchaseId: purchase.id,
      stripeCheckoutSessionId: session.id,
    });
    return 'mismatch';
  }

  if (session.payment_status !== 'paid') {
    log.info('program purchase not settled: checkout session not paid', {
      purchaseId: purchase.id,
      paymentStatus: session.payment_status,
    });
    return 'not-paid';
  }

  const updated = await prisma.purchase.updateMany({
    where: { id: purchase.id, status: { in: UNSETTLED } },
    data: {
      status: PaymentStatus.SUCCEEDED,
      purchasedAt: new Date(),
      stripeCheckoutSessionId: session.id,
      stripePaymentIntentId: paymentIntentId(session),
    },
  });

  if (updated.count === 0 && purchase.status !== PaymentStatus.SUCCEEDED) {
    // FAILED / CANCELED / REFUNDED purchases are never resurrected here.
    log.warn('paid session for a purchase that is no longer settleable; nothing granted', {
      purchaseId: purchase.id,
      status: purchase.status,
    });
    return 'mismatch';
  }

  await grantProgramAccess({
    userId: purchase.userId,
    programSlug: product!.programSlug!,
    source: 'PURCHASE',
    purchaseId: purchase.id,
  });
  log.info('program purchase settled', { purchaseId: purchase.id, programSlug: product!.programSlug });
  return updated.count > 0 ? 'settled' : 'already-settled';
}

// checkout.session.async_payment_failed / checkout.session.expired: the
// purchase ends without payment. Only an unsettled purchase is touched.
export async function closeProgramPurchase(session: Stripe.Checkout.Session, status: 'FAILED' | 'CANCELED') {
  if (session.metadata?.kind !== 'program' || !session.metadata.purchaseId) return;
  await prisma.purchase.updateMany({
    where: { id: session.metadata.purchaseId, status: { in: UNSETTLED } },
    data: { status: status === 'FAILED' ? PaymentStatus.FAILED : PaymentStatus.CANCELED },
  });
}

// charge.refunded: a FULL refund marks the purchase REFUNDED and ends the
// access it granted. Partial refunds are only logged — what they should mean
// for access is an open business decision.
export async function refundProgramPurchase(charge: Stripe.Charge) {
  const intentId = typeof charge.payment_intent === 'string' ? charge.payment_intent : charge.payment_intent?.id;
  if (!intentId) return;
  const purchase = await prisma.purchase.findFirst({ where: { stripePaymentIntentId: intentId } });
  if (!purchase || !getProgramProductBySlug(purchase.courseId)) return;

  if (!charge.refunded) {
    log.info('partial refund on a program purchase — access unchanged', { purchaseId: purchase.id });
    return;
  }
  await prisma.$transaction([
    prisma.purchase.update({ where: { id: purchase.id }, data: { status: PaymentStatus.REFUNDED } }),
    prisma.entitlement.updateMany({
      where: { purchaseId: purchase.id, revokedAt: null },
      data: { revokedAt: new Date(), revokedReason: 'refunded' },
    }),
  ]);
  log.info('program purchase refunded; access revoked', { purchaseId: purchase.id });
}

// Account → "Your programs": the user's Reset Program purchases, newest first.
export async function listProgramPurchases(userId: string) {
  const slugs = programProducts().map((p) => p.slug);
  return prisma.purchase.findMany({
    where: { userId, courseId: { in: slugs }, NOT: { status: PaymentStatus.CANCELED } },
    orderBy: { createdAt: 'desc' },
    take: 20,
  });
}
