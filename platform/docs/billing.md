# Billing & Payments — Foundation (Stripe, Test Mode)

Status: **foundation only**. No checkout UI, no production payments, no real
membership/course/donation flows are wired up yet. This document describes
what exists today and what a future module needs to add.

## Scope of this phase

Implemented:

- Database models for memberships, subscriptions, one-off payments,
  course purchases, donations, and a webhook audit log.
- A single billing service (`modules/payments/billing.service.ts`)
  wrapping the Stripe SDK — nothing else in the app should import `stripe`
  directly.
- A verified, idempotent webhook endpoint (`app/api/webhooks/stripe`).
- Server-side validation for donation amounts/currency
  (`lib/validations/billing.ts`).
- Basic tests for the foundation (`tests/billing.test.ts`), using mocked
  Prisma/Stripe clients — no real Stripe calls are made in tests.

Explicitly **not** implemented yet (per Prompt3 §17):

- Checkout UI (membership, course, donation pages)
- Invoice/refund/subscription-management UI
- Payment-related notifications
- Payment analytics

## Architecture

```
User → Stripe Customer → Subscription (membership)
                        → Payment      (one-off: membership/course/donation/other)
                        → Purchase     (course-specific one-off)
                        → Donation     (guest or logged-in)
```

- `User.stripeCustomerId` — set lazily on first checkout/donation via
  `getOrCreateStripeCustomer()`. A conditional `updateMany` (`WHERE
  stripeCustomerId IS NULL`) prevents a race from creating two Stripe
  Customers for the same user; if a race is detected, the just-created
  Stripe customer is deleted and the winner's id is reused.
- All amounts are stored in the smallest currency unit (cents), matching
  Stripe's convention.
- **The backend/database is the source of truth for payment state.** A
  Checkout success redirect never marks anything paid; only a verified
  webhook event does (`handleWebhook`).

## Database models (`prisma/schema.prisma`)

- `MembershipPlan` — admin-configured price/interval, linked to a Stripe
  Product/Price once created in the Stripe Dashboard.
- `Subscription` — one per user membership subscription; status mirrors
  Stripe's subscription status model.
- `Payment` — generic one-off payment record (`type`: membership | course |
  donation | other).
- `Purchase` — course-specific purchase record. `courseId` is a plain
  string field (not a foreign key) because the Courses module doesn't
  exist yet; the future Courses module should add a proper relation once
  it ships, via a migration.
- `Donation` — `userId` is nullable to support guest donations.
- `PaymentEvent` — one row per processed Stripe webhook event id, used for
  idempotency and debugging.

## Statuses

`PaymentStatus`: `PENDING | PROCESSING | SUCCEEDED | FAILED | CANCELED |
REFUNDED | REQUIRES_ACTION`

`SubscriptionStatus`: `ACTIVE | TRIALING | PAST_DUE | CANCELED | INCOMPLETE
| INCOMPLETE_EXPIRED | UNPAID` (mirrors Stripe's subscription status
model).

Nothing in this codebase uses a boolean `paid = true/false` flag — status
is always one of the enums above.

## Webhook flow (`app/api/webhooks/stripe/route.ts`)

1. Read the **raw** request body (`req.text()` — required for signature
   verification; do not `JSON.parse` before verifying).
2. Verify the `stripe-signature` header against `STRIPE_WEBHOOK_SECRET`
   using `stripe.webhooks.constructEvent`. Invalid signature → `400`,
   nothing is processed.
3. `handleWebhook(event)`:
   - Looks up `PaymentEvent` by `event.id`. If found, the event is a
     duplicate/retry — return early (`{ duplicate: true }`), nothing is
     re-applied.
   - Otherwise, dispatch on `event.type` (`processStripeEvent`), updating
     the relevant `Donation` / `Purchase` / `Subscription` / `Payment`
     row(s), then record a `PaymentEvent` row with `status: "processed"`.
   - If processing throws, a `PaymentEvent` row is still recorded with
     `status: "error"` and the error message, and the route responds `500`
     so Stripe retries.
4. Handled event types today: `checkout.session.completed`,
   `customer.subscription.created` / `.updated` / `.deleted`,
   `payment_intent.succeeded` / `.payment_failed`. Unhandled event types
   are logged (`debug`) and otherwise ignored — extend
   `processStripeEvent` when a future module needs a new event type.

## Environment variables

Add to `.env` (see `.env.example`):

```
STRIPE_SECRET_KEY=sk_test_...
STRIPE_PUBLISHABLE_KEY=pk_test_...
STRIPE_WEBHOOK_SECRET=whsec_...
```

`lib/stripe.ts` refuses to start with a non-`sk_test_` key while
`NODE_ENV=production`, as a guardrail for this billing-foundation phase
(remove that guard only once a real, reviewed live-payments path exists).

## Running Stripe Test Mode locally

1. Create a free Stripe account if you don't have one, and switch to
   **Test mode** in the dashboard.
2. Copy your test keys from
   https://dashboard.stripe.com/test/apikeys into `.env`.
3. Install the [Stripe CLI](https://stripe.com/docs/stripe-cli) and run:
   ```bash
   stripe listen --forward-to localhost:3000/api/webhooks/stripe
   ```
   This prints a `whsec_...` value — put it in `STRIPE_WEBHOOK_SECRET`.
4. Use Stripe's test card `4242 4242 4242 4242` (any future expiry, any
   CVC) once a checkout UI exists in a future module.

## What you must manually configure in the Stripe Dashboard

- Create a test-mode Product + Price for each `MembershipPlan` you intend
  to seed, then set that plan's `stripeProductId` / `stripePriceId`.
- Configure the Customer Portal (Settings → Billing → Customer portal) if
  you want `createCustomerPortalSession()` to work end-to-end.
- Nothing else is required for the foundation phase — no live keys, no
  production webhook endpoint yet.

## Production considerations (not addressed in this phase)

- Switching `STRIPE_SECRET_KEY`/`STRIPE_PUBLISHABLE_KEY` to live keys, and
  removing the test-key guard in `lib/stripe.ts` only after a security
  review of the full payment path.
- A durable, shared idempotency store if the app ever runs the webhook
  handler across multiple concurrent instances with a race on the same
  event (Postgres unique constraint on `PaymentEvent.eventId` already
  prevents double-processing; make sure retries still hit the same
  database).
- Refund handling, dunning/past-due emails, and admin UI for
  transactions/subscriptions/refunds — all deferred to a future module.

## Future implementation steps (suggested order)

1. ~~**Membership module**~~ — done, see [`membership.md`](./membership.md).
2. **Donations module**: a donation page using
   `createDonationCheckout()` (preset + custom amounts).
3. **Courses module**: once Courses exist, replace `Purchase.courseId`'s
   plain string with a real foreign key (migration), and resolve course
   prices server-side before calling `createOneTimeCheckout()`.
4. Admin billing dashboard: list `Payment`/`Purchase`/`Donation`/
   `Subscription` rows, refund actions, `PaymentEvent` viewer for
   debugging.
