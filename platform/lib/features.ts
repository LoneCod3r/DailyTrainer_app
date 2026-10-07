// Product feature flags for decisions that are still open with the client
// (see the V1 decision document). Every flag defaults to the safe "off"
// state; nothing here is a business rule in itself, only a switch.
//
// NEXT_PUBLIC_ so the same value is readable from client components (the
// topbar/drawer/account menu) and server code alike.

function flag(value: string | undefined): boolean {
  return value === 'true' || value === '1';
}

export const features = {
  // Membership (future "KUKO WAY Community" subscription) is not launching in
  // V1 — its sales surfaces (nav link, Home strip, account-hub prompts) are
  // hidden. The billing plumbing and the /account/membership page itself are
  // untouched, so existing subscribers can still reach it directly.
  membershipSales: flag(process.env.NEXT_PUBLIC_FEATURE_MEMBERSHIP_SALES),

  // Reset Program checkout — Stripe TEST MODE only. Requires the explicit
  // opt-in AND a non-production build: production checkout stays off,
  // whatever the env says, until the pricing/VAT/legal decisions are
  // confirmed (enabling it then is a deliberate code change). The server
  // additionally refuses unless the Stripe key is a test key — see
  // isProgramCheckoutAvailable() in modules/commerce/checkout.service.ts.
  programCheckout:
    flag(process.env.NEXT_PUBLIC_FEATURE_PROGRAM_CHECKOUT) && process.env.NODE_ENV !== 'production',

  // Shows catalog prices (modules/commerce/catalog.ts) for product/UI review,
  // with every purchase action in a calm "coming soon" state. Display only —
  // independent of `programCheckout`, which alone could ever start a payment.
  // On by default outside production, opt-in in production (VAT/legal
  // presentation of prices is still open).
  pricingPreview:
    flag(process.env.NEXT_PUBLIC_FEATURE_PRICING_PREVIEW) || process.env.NODE_ENV !== 'production',

  // Founding Members pricing/status. Off until cap and prices are confirmed.
  founders: flag(process.env.NEXT_PUBLIC_FEATURE_FOUNDERS),

  // Shows programs whose manifest is not yet `published` (placeholder
  // content) so they can be reviewed. On by default outside production;
  // in production only an explicit opt-in turns it on.
  programsPreview:
    flag(process.env.NEXT_PUBLIC_FEATURE_PROGRAMS_PREVIEW) || process.env.NODE_ENV !== 'production',
};
