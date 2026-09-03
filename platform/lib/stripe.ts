import Stripe from 'stripe';

// Single Stripe client for the whole app — TEST MODE ONLY at this stage
// (Prompt3 §0). Nothing in this codebase processes a real charge; the
// secret key configured via STRIPE_SECRET_KEY is expected to be a
// `sk_test_...` key for as long as this billing foundation is the only
// payment code in the project.
//
// Lazily constructed so the app (and its tests) can boot without a Stripe
// key configured; only code paths that actually talk to Stripe require one.
let _stripe: Stripe | null = null;

export function getStripeClient(): Stripe {
  if (_stripe) return _stripe;

  const key = process.env.STRIPE_SECRET_KEY;
  if (!key) {
    throw new Error(
      'STRIPE_SECRET_KEY is not configured. Set it in .env (use a Stripe TEST key) before using billing features.',
    );
  }
  if (process.env.NODE_ENV === 'production' && !key.startsWith('sk_test_')) {
    // Foundation-phase guardrail: this codebase has no reviewed path for
    // live payments yet, so refuse to run with a live secret key.
    throw new Error('Refusing to start with a non-test Stripe secret key during the billing foundation phase.');
  }

  _stripe = new Stripe(key, {
    apiVersion: '2024-06-20',
    typescript: true,
  });
  return _stripe;
}
