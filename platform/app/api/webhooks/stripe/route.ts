import { NextResponse } from 'next/server';
import type Stripe from 'stripe';
import { getStripeClient } from '@/lib/stripe';
import { handleWebhook } from '@/modules/payments/billing.service';
import { createLogger } from '@/lib/logger';

const log = createLogger('billing.webhook');

// Stripe webhooks must receive the raw request body (signature verification
// hashes the exact bytes Stripe sent) — Next.js route handlers give us that
// via req.text(), so no bodyParser config is needed here (that was a
// pages/api concern; app router route handlers don't parse the body for you).
export async function POST(req: Request) {
  const signature = req.headers.get('stripe-signature');
  const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET;

  if (!signature || !webhookSecret) {
    log.error('webhook rejected: missing signature or webhook secret configuration');
    return NextResponse.json({ error: 'Webhook not configured' }, { status: 400 });
  }

  const rawBody = await req.text();
  let event: Stripe.Event;

  try {
    const stripe = getStripeClient();
    event = stripe.webhooks.constructEvent(rawBody, signature, webhookSecret);
  } catch (err) {
    log.warn('webhook signature verification failed', { message: (err as Error).message });
    return NextResponse.json({ error: 'Invalid signature' }, { status: 400 });
  }

  try {
    const result = await handleWebhook(event);
    return NextResponse.json({ received: true, duplicate: result.duplicate });
  } catch (err) {
    // Return 500 so Stripe retries — the event is recorded as errored in
    // PaymentEvent for investigation either way (see billing.service.ts).
    log.error('webhook processing failed', { eventId: event.id, type: event.type, message: (err as Error).message });
    return NextResponse.json({ error: 'Webhook processing failed' }, { status: 500 });
  }
}
