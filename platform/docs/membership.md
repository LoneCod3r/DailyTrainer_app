# Membership module

Status: **implemented** (admin CRUD, public pricing page, subscription checkout, and
account status). Built on top of the billing foundation — see
[`billing.md`](./billing.md) for the underlying Stripe architecture.

## What this module adds

- Admin CRUD for `MembershipPlan` (`/admin/membership`), each plan backed by a
  real Stripe Product/Price (Test Mode).
- A public pricing page (`/membership`) listing active plans with a "Join"
  button that starts a Stripe subscription Checkout Session.
- An account page section (`/account`) showing the member's current
  subscription status and a "Manage billing" button (Stripe's hosted
  Customer Portal) — this is also how a member cancels or updates their
  payment method, rather than a custom cancellation UI.

## Bug fixed while building this module

`createSubscriptionCheckout` (in `modules/payments/billing.service.ts`) set
`metadata` only on the Checkout Session, not on the Subscription Stripe
creates from it. The `customer.subscription.created`/`.updated` webhook
handlers read `sub.metadata.userId`/`membershipPlanId` — without
`subscription_data.metadata` on the Checkout Session, a completed
subscription checkout would never have been recorded in the database. Fixed
by passing `subscription_data: { metadata: { userId, membershipPlanId } }`.

## Stripe Price immutability

Stripe Prices can't be edited once created. `modules/membership/membership.service.ts`'s
`updatePlan` handles this: if `amount`/`currency`/`interval` change, it calls
`replaceMembershipPlanPrice` (in `billing.service.ts`), which creates a new
Price on the same Product and archives (`active: false`) the old one. The
Product itself (name/description) is updated in place. Existing subscribers
keep billing at their original Price — Stripe does not retroactively change
an active subscription — until they resubscribe at the new price.

## Endpoints

- `GET /api/membership/plans` — public, active plans only.
- `POST /api/membership/subscribe` — authenticated; `{ membershipPlanId }` →
  `{ url }` (Stripe Checkout URL to redirect to).
- `POST /api/membership/portal` — authenticated; `{ }` → `{ url }` (Stripe
  Customer Portal URL).
- `GET /api/admin/membership-plans`, `POST /api/admin/membership-plans` —
  admin only.
- `PATCH /api/admin/membership-plans/:id` — admin only; also used to
  activate/deactivate a plan.

No new database migration was needed — `MembershipPlan` and `Subscription`
were already modeled in the billing foundation phase.

## What is intentionally NOT implemented

- Membership-gated access to content/courses/discussions — those modules
  don't exist yet. `getActiveSubscriptionForUser` is the choke point a future
  module should call to check membership access.
- Multiple simultaneous plans per user, prorated upgrades/downgrades beyond
  what the Stripe Customer Portal already offers.
- Admin views of subscription history, failed payments, or refunds — still
  deferred to the future "admin billing dashboard" (see `billing.md`).
- Free trials — `MembershipPlan`/checkout have no trial-period wiring.

## Manually configure in Stripe (Test Mode)

Nothing beyond what `billing.md` already lists — Products/Prices are now
created automatically from the admin UI, so there's no need to create them
by hand in the Stripe Dashboard.
