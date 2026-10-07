import { PaymentStatus, type Role } from '@prisma/client';
import { prisma } from '@/lib/prisma';
import { features } from '@/lib/features';
import { isStripeTestMode } from '@/lib/stripe';
import { createLogger } from '@/lib/logger';
import type { Locale } from '@/lib/i18n/locale';
import { createProgramCheckoutSession, retrieveCheckoutSession } from '@/modules/payments/billing.service';
import { getVisibleProgram } from '@/modules/programs/service';
import { localize } from '@/modules/kuko-way/types';
import { getProgramProduct } from './catalog';
import { hasProgramAccess } from './entitlements.service';
import { settleProgramPurchase } from './purchases.service';

const log = createLogger('commerce.checkout');

// Reset Program checkout — Stripe TEST MODE only (V1 decision document §3).
// The client sends only the program slug; product, price and currency come
// from the server-side catalog. Founder pricing and upgrade credit are not
// implemented (their rules are unresolved) — the standard price is charged.

// All three must hold: the opt-in flag, a non-production build (both in
// features.programCheckout) and a Stripe TEST secret key.
export function isProgramCheckoutAvailable(): boolean {
  return features.programCheckout && isStripeTestMode();
}

export class CheckoutError extends Error {
  constructor(public code: 'DISABLED' | 'NOT_FOUND' | 'NOT_PURCHASABLE' | 'ALREADY_OWNED') {
    super(code);
  }
}

// A checkout left open is reused for this long (it expires after 30 min).
const REUSE_WINDOW_MS = 25 * 60 * 1000;

export async function startProgramCheckout(input: {
  user: { id: string; role: Role };
  programSlug: string;
  locale: Locale;
}): Promise<{ url: string }> {
  if (!isProgramCheckoutAvailable()) throw new CheckoutError('DISABLED');

  const program = getVisibleProgram(input.programSlug);
  if (!program) throw new CheckoutError('NOT_FOUND');

  // Only current, one-time Reset products are purchasable — never a future
  // product (Community / Trainer), never a subscription.
  const product = getProgramProduct(program.slug);
  const price = product?.prices[0];
  if (!product || product.kind !== 'PROGRAM' || product.status !== 'current' || !price || price.interval) {
    throw new CheckoutError('NOT_PURCHASABLE');
  }

  if (await hasProgramAccess(input.user, program.slug)) throw new CheckoutError('ALREADY_OWNED');

  // A double click or a quick retry returns the same open checkout instead
  // of starting a second purchase.
  const pending = await prisma.purchase.findFirst({
    where: {
      userId: input.user.id,
      courseId: product.slug,
      status: PaymentStatus.PENDING,
      stripeCheckoutSessionId: { not: null },
      createdAt: { gt: new Date(Date.now() - REUSE_WINDOW_MS) },
    },
    orderBy: { createdAt: 'desc' },
  });
  if (pending?.stripeCheckoutSessionId) {
    try {
      const existing = await retrieveCheckoutSession(pending.stripeCheckoutSessionId);
      if (existing.status === 'open' && existing.url) return { url: existing.url };
    } catch (err) {
      log.warn('could not reuse pending checkout; starting a new one', { message: (err as Error).message });
    }
  }

  const purchase = await prisma.purchase.create({
    data: {
      userId: input.user.id,
      courseId: product.slug,
      amount: price.amount,
      currency: price.currency,
      status: PaymentStatus.PENDING,
    },
  });

  try {
    const session = await createProgramCheckoutSession({
      userId: input.user.id,
      purchaseId: purchase.id,
      productSlug: product.slug,
      programSlug: program.slug,
      productName: localize(product.title, input.locale).value,
      amount: price.amount,
      currency: price.currency,
      locale: input.locale,
    });
    await prisma.purchase.update({ where: { id: purchase.id }, data: { stripeCheckoutSessionId: session.id } });
    if (!session.url) throw new Error('Stripe returned no checkout URL');
    return { url: session.url };
  } catch (err) {
    await prisma.purchase.update({ where: { id: purchase.id }, data: { status: PaymentStatus.CANCELED } });
    throw err;
  }
}

// Return-page fallback for when the webhook is delayed (or not forwarded in
// local development): asks Stripe directly — server-side — whether this
// user's checkout was paid, and settles through the exact same rules as the
// webhook. The redirect itself grants nothing. Never throws.
export async function reconcileProgramPurchase(userId: string, stripeCheckoutSessionId: string) {
  const purchase = await prisma.purchase.findFirst({ where: { userId, stripeCheckoutSessionId } });
  if (!purchase || purchase.status !== PaymentStatus.PENDING) return purchase;
  try {
    const session = await retrieveCheckoutSession(stripeCheckoutSessionId);
    await settleProgramPurchase(session, { expectedUserId: userId });
  } catch (err) {
    log.warn('program purchase reconcile failed; keeping local status', { message: (err as Error).message });
  }
  return prisma.purchase.findFirst({ where: { userId, stripeCheckoutSessionId } });
}
