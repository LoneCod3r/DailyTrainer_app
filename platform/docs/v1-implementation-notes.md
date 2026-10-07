# V1 implementation notes — P1–P6

Working architecture: the approved V1 Product + Architecture Decision
Document. This note records only what was built and what is genuinely
blocked or deferred — not a restatement of that document.

## Built

| Phase | What | Where |
| --- | --- | --- |
| P1 Design system | Warm Ivory / Deep Earth / Natural Sage / Clay / Warm Sand tokens (light + dark), WCAG-AA-checked text shades; Manrope + "KUKO Display" serif (DM Serif Display for Latin, Playfair Display for Cyrillic — DM Serif has no Cyrillic); serif headings now opt-in (`font-serif`); `inverse` button for the near-black practice mode; outlined secondary button | `app/globals.css`, `tailwind.config.ts`, `app/fonts/*`, `components/ui/Button.tsx` |
| P2 Navigation / IA | Desktop: Practice · Programs · Learn · Journey (logo = Home), "Start your journey →" for visitors. Mobile bottom: Home · Practice · Programs · Journey · Profile. Community moved to drawer + footer. Learn hub. 14-day → 307 to `/practices/programs`. Membership sales surfaces hidden behind `NEXT_PUBLIC_FEATURE_MEMBERSHIP_SALES` (existing subscribers still see their plan) | `components/layout/nav.ts`, `Topbar.tsx`, `MobileBottomNav.tsx`, `MobileDrawer.tsx`, `app/(app)/learn`, `next.config.js`, `lib/features.ts` |
| P3 Practice persistence | `PracticeSession` (idempotent on client id, local calendar day), `FavoritePractice`; hybrid progress facade (account when signed in, device when not) with one-time idempotent device→account import; UTC-midnight streak bug fixed | `prisma/schema.prisma` + migration `…_add_practice_sessions_and_favorites`, `modules/kuko-way/progress.service.ts`, `lib/progress/*`, `lib/local-progress.ts`, `app/api/practice-sessions/*`, `app/api/favorites/*` |
| P4 Practice experience + Journey/Profile | Begin → before check-in → practice mode (near-black, timer, one step at a time) → "Take a moment" + private note → "Practice complete. You showed up for yourself."; favorites; Journey (stats, programs, recent practice with check-ins, private notes, favorites); Profile leads with the journey | `components/practices/PracticeSession.tsx`, `FavoriteButton.tsx`, `app/(app)/journey`, `app/(app)/account/page.tsx` |
| P5 Program model + entitlement boundary | Program → Phase → Day → Item model; placeholder manifests for 1 / 3 / 7 / 28 Day Reset (all `contentRequired`, unpublished); `Entitlement` table + `hasProgramAccess()` as the single access check; Admin grant/revoke API; gated day pages | `modules/programs/*`, `modules/commerce/entitlements.service.ts`, migration `…_add_program_entitlements`, `app/api/admin/entitlements`, `app/(app)/practices/programs/**` |
| P6 Program progress | Item completion, sequential unlock (enforced in pages *and* API), private day reflections, enrollment completion, program progress on Journey/Profile/Home | `modules/programs/progress.ts`, `progress.service.ts`, migration `…_add_program_progress`, `app/api/programs/**` |

Removed after the new program system replaced them: the static 7/14/28 program
pages, `ProgramTrail` / `ProgramDayGrid` / `ProgramDayProgress` /
`ProgramOverview` / `ProgramCard`, `modules/kuko-way/content/programs.ts`,
`demo-progress.ts`, `MarkCompleteButton`. URLs `/practices/programs/7-days` and
`/28-days` still resolve (now the 7 and 28 Day Reset).

## Demo pricing (for product / UI review)

- **Catalog:** `modules/commerce/catalog.ts` — the single source of displayed
  prices, shaped like the planned Product/ProductPrice tables. Standard
  prices only: 1/3/7/28 Day Reset €19/€39/€79/€149 (one-time); Community
  €19/month or €190/year and Trainer Program €1,490 (both "coming later").
  No founder prices.
- **Shown** on `/practices/programs` (program tiles + a "Coming later"
  section), on each program overview, and on the Practice hub tiles — only
  while `NEXT_PUBLIC_FEATURE_PRICING_PREVIEW` is on (default on outside
  production).
- **Every purchase action** is a disabled "Coming soon" `<button>` with no
  handler (`components/commerce/ComingSoonButton.tsx`). No checkout, Purchase,
  Entitlement, founder seat or subscription can be created from it.
- The old `MembershipPlan` "KUKO WAY Premium" (€29.99/month, real test-mode
  Stripe subscribe) is untouched and still hidden — it doesn't match the
  approved Community pricing.

## Reset Program purchases — Stripe TEST MODE

Flow: catalog → `POST /api/programs/[slug]/checkout` → Stripe Checkout
(`mode: 'payment'`, one-time, `price_data` from the catalog — no Stripe Price
ids) → signed webhook → `Purchase` SUCCEEDED → `Entitlement` (source
PURCHASE) → program days open.

- **Enabled only when** `NEXT_PUBLIC_FEATURE_PROGRAM_CHECKOUT="true"` AND the
  build is not production AND `STRIPE_SECRET_KEY` is an `sk_test_` key
  (`isProgramCheckoutAvailable()`). Production checkout is off regardless of
  env — enabling it is a deliberate code change after the legal/VAT decisions.
- **Who can buy:** signed in, email verified, not a Moderator, not already
  owning the program. Only the four Reset products; Community and Trainer are
  not purchasable. Standard prices only — no founder price, no upgrade credit.
- **Access** comes only from verified payment state: the signature-checked
  webhook, or (return-page fallback when the webhook is late) a server-side
  Stripe lookup. Both use `settleProgramPurchase()`, which checks session,
  purchase, user, product, mode, amount and currency, and is idempotent.
- **Events handled:** `checkout.session.completed`,
  `checkout.session.async_payment_succeeded` (settle if paid),
  `checkout.session.async_payment_failed` (FAILED),
  `checkout.session.expired` (CANCELED), `charge.refunded` (full refund →
  REFUNDED + access revoked; partial refunds only logged).
- **Data:** no migration. `Purchase.courseId` stores the catalog product slug
  (e.g. `reset-28-days`) — the column is the generic one-time-purchase
  reference. Rename to `productSlug` with the P8 schema work.
- **Local webhooks:** `stripe listen --events
  checkout.session.completed,checkout.session.async_payment_succeeded,checkout.session.async_payment_failed,checkout.session.expired,charge.refunded,customer.subscription.created,customer.subscription.updated,customer.subscription.deleted,payment_intent.succeeded,payment_intent.payment_failed
  --forward-to localhost:3000/api/webhooks/stripe` (its signing secret must be
  `STRIPE_WEBHOOK_SECRET`).
- **Manual test:** open a Reset program → "Continue to payment" → card
  `4242 4242 4242 4242`, any future expiry, any CVC → return → "Payment
  confirmed" → Account shows the purchase (Succeeded · Access open).

## Disabled / not live (by design, pending client decisions)

- **Live checkout** — production purchasing is off (see "Reset Program
  purchases — Stripe TEST MODE" above; only test mode exists).
- **Founders** — `NEXT_PUBLIC_FEATURE_FOUNDERS` (off). Nothing implemented.
- **Upgrade credit** — not implemented (P9).
- **Media** — no provider. VIDEO/AUDIO items render a neutral placeholder
  area; items reference media only by asset id, to be resolved later by a
  server-side, access-checked playback endpoint (P7).
- **Programs are unpublished** — visible only while
  `NEXT_PUBLIC_FEATURE_PROGRAMS_PREVIEW` is on (default on outside
  production, off in production).

## Decisions taken during implementation (technical, reversible)

- **Admins have implicit access to every program** (content review /
  support). Moderators do not. Everyone else needs an `Entitlement`.
- **Practice tracking does not require a verified email** — it's private
  data, unlike posting to Discussions.
- **Check-ins and notes are account-only.** Signed-out visitors can practise;
  only "practice X done on day Y" is kept on the device. No health-related
  data is written to localStorage.
- **One enrollment per user per program** (no restart yet — open product
  question).
- **Bulgarian microcopy** for the new flows is a working translation and
  needs client approval (as do the English summaries of the 28 Day Reset
  phases, which fall back to Bulgarian with a note).

## Newsletter — V1 requirement assessment

Not implemented yet. Assessment only (second pass, all sources).

**Evidence**
- Client chat `Screenshot_20261007_155456`: the client links the gallery
  titled "Choose a newsletter design — six design directions for the first
  issue of the DailyTrainer newsletter" and picks No.03 as the main visual
  system with elements of No.05 (personal coaching: "Your coach", personal
  address, the reader can reply and share how they feel). Strong evidence
  the newsletter workstream was presented and accepted; weaker evidence of
  its scope, because the same thread and the DOCX also reuse Template 03 as
  the *app's* UI base ("Use Template 03 Modern as the base UI system").
- `26.09.2026/Newsletter-plan.docx` (created 2026-09-25 on this machine, in
  a dated working folder — the developer's plan, not a client document):
  own newsletter in the app — signup without an account, confirmation link
  (double opt-in), duplicate check, unsubscribe link in every email,
  re-subscribe, admin subscriber list, BG/EN, abuse protection. Intended
  content: new practices, videos, paid content, news, promotions.
- `newsletter-templates/` (6 designs, BG/EN, published to GitHub Pages
  2026-09-26) with `{{unsubscribe_url}}` / `{{preferences_url}}` merge tags.
- DOCX: no newsletter, email capture or consent content. Its V1/V2/V3 list
  covers app features only and does not mention a newsletter either way.
- Original prompts (`Prompt*.docx`, `Personal_Daily_Trainer_Structure.docx`):
  no newsletter; "notifications" (§19) and "Subscriber" (= paying member)
  are different things.
- Human Garage (reference only, public site checked 2026-10-07): a plain
  email-only newsletter signup in the site **footer** ("events, tips &
  announcements"); the main funnel is free YouTube content, the app and
  events. Signal that a quiet, site-wide signup fits the reference — not a
  specification.

**Verdict:** B — strongly implied V1 requirement. **Confidence: ~65%.** The
capability is implied by the client engaging with and choosing a newsletter
design; the implementation (provider, placement, copy, consent, cadence,
sender) was never specified.

**Minimum V1 scope (when approved)**
- One signup form: email only, explicit unticked marketing-consent checkbox,
  separate from account/service emails.
- Never subscribe anyone through registration, purchase or onboarding.
- Provider-neutral `modules/newsletter` boundary with a local consent record
  (email, status, consent timestamp, locale, source, consent-text version)
  so consent can be proven whatever provider is chosen.
- Duplicate-safe subscribe; neutral response that doesn't reveal whether an
  email is already on the list.
- Double opt-in confirmation and one-click unsubscribe — recommended
  (developer plan + GDPR proof of consent); delivered by the provider once
  chosen.
- Clear success/error states, BG/EN, accessible, rate-limited, honeypot.
- Behind a feature flag, off until the provider and consent/privacy wording
  are confirmed (the privacy policy must cover the list before collecting).
- Not in V1 scope: campaign editor/sending UI, frequency, content strategy,
  welcome-email copy, segmentation, open/click tracking, pop-ups.

**Recommended placement:** the site footer (already on every page, calm,
the same place as the reference), optionally repeated at the end of Learn.
Not: pop-ups/modals, registration or checkout checkboxes (pre-ticked or
bundled), onboarding gates, practice or program flows.

**Provider:** unresolved. Nodemailer stays strictly transactional
(verification, password reset); it is not a bulk/marketing sender.

**Still needs the client:** confirm the newsletter is in V1; provider;
signup placement and copy; consent and privacy wording (legal); sender name
and a monitored reply-to address (Template 05 invites replies); frequency
and content; whether double opt-in is required.

## Blocking / needs input

1. **CONTENT REQUIRED** — every program item, the program documents
   (description / what to expect / guidance), the 28-day phase translations,
   and the day mapping (28 days vs 31 videos).
2. **LEGAL INPUT** — check-ins and notes are stored server-side and may be
   health-related data; the privacy policy should cover them before launch
   (unchanged from the decision document).
3. **Dev environment** — the Prisma client is cached on `globalThis` in dev
   (`lib/prisma.ts`), so after these migrations the dev server must be
   restarted from a fresh process for the new tables to work.
