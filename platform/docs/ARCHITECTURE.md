# Architecture decisions — Foundation Phase

## Independence from app.humangarage.net

This codebase, database, and deployment are entirely separate from
`app.humangarage.net`. No code was copied from it, no API calls are made to
it, and nothing in this repository reads from or writes to its systems. It
was used only as a product/structure reference during planning.

## Why this stack

- **Next.js (App Router) + TypeScript** — one framework for both the
  frontend and the API routes, first-class React Server Components (fast
  initial loads for content-heavy pages like Home/Articles), file-system
  routing that scales well as modules (Discussions, Courses, Events) are
  added under `app/`.
- **PostgreSQL + Prisma** — a relational database fits this domain well
  (users, memberships, enrollments, events, payments are all naturally
  relational with real constraints). Prisma gives us typed queries and a
  migration workflow from day one, per the spec's requirement to "use
  migrations from the beginning."
- **Tailwind CSS** — enables the "reusable design system" requirement
  (`tailwind.config.ts` defines the color/spacing/shadow tokens once;
  `components/ui/*` builds primitives on top of them) without a heavier
  component-library dependency.
- **NextAuth.js (JWT sessions, Credentials provider)** — a mature,
  widely-used authentication library rather than a hand-rolled auth system,
  per Prompt2 §3 ("do not build a custom authentication system
  unnecessarily"). JWT sessions (not database sessions) were chosen because
  the credentials provider doesn't need NextAuth's database adapter — this
  keeps the schema smaller. OAuth providers can be added to
  `lib/auth.ts`'s `providers` array later without touching the rest of the
  app.
- **Stripe** — industry-standard, and explicitly requested for the billing
  foundation (Prompt3).

## Modular boundary

`/modules/<name>` holds business logic (`*.service.ts`) with no framework
dependency beyond Prisma/Stripe clients. `app/api/**/route.ts` files are
thin — they parse/validate the request, call a module function, and shape
the response via `lib/api-response.ts`. This means:

- A future module (e.g. Discussions) adds its own `modules/discussions/`,
  its own Prisma models + migration, its own `app/api/discussions/*`
  routes, and its own admin UI — without editing existing modules.
- Business logic is unit-testable without spinning up Next.js or an HTTP
  server (see `tests/*.test.ts`).

## Authorization model

`lib/permissions.ts` defines a single role hierarchy (`USER < MODERATOR <
ADMIN`) used everywhere a role check happens. Every admin-only server
action re-checks the role server-side (`app/admin/layout.tsx` for pages,
each `app/api/**/route.ts` for API calls) — the frontend never being
trusted for authorization, per Prompt2 §2/§12.

## Settings

`Setting` is a generic key/value table (`lib/` + `modules/settings`) rather
than dedicated columns, so future settings (membership pricing, donation
presets, feature toggles) can be added without another migration. Values
are typed at the module boundary (`modules/settings/settings.service.ts`),
not in the database.

## Content & Media foundation

`ContentItem` is intentionally generic (`type: ARTICLE | ANNOUNCEMENT |
EDUCATIONAL | OTHER`) rather than separate `Article`/`Announcement` tables,
so the Home page has real data to render today without committing to the
full CMS schema (categories, tags, drafts/scheduling workflow, galleries)
that a dedicated Blog module will add later.

`Media` stores a `provider` + `url` rather than assuming a specific storage
backend, so local dev storage and S3-compatible storage can coexist across
environments (`modules/media/storage.ts`).

## Billing foundation (Stripe, test mode)

See [`billing.md`](./billing.md) for the full billing architecture. In
short: all Stripe calls are isolated to `modules/payments/billing.service.ts`
and `lib/stripe.ts`; the database is the source of truth for payment state,
never the frontend or a redirect URL; webhook events are idempotent via the
`PaymentEvent` audit table.

## Membership module

See [`membership.md`](./membership.md). Built entirely on top of the billing
foundation above — `modules/membership/membership.service.ts` owns
`MembershipPlan` CRUD (delegating the actual Stripe Product/Price calls to
`billing.service.ts`, never calling the SDK itself) and exposes
`getActiveSubscriptionForUser()` as the single choke point a future module
should use to check membership access, mirroring the `isProfileVisibleTo()`
pattern in `modules/profiles`.

## Known risks / things to watch

- **JWT session size** — role/status are embedded in the JWT; if a user's
  role changes, they need to sign in again (or a short session `maxAge`)
  for it to take effect. Acceptable for the foundation; worth revisiting if
  frequent role changes become common.
- **In-memory rate limiting** (`lib/rate-limit.ts`) only works correctly on
  a single instance. Fine for one Next.js server; must move to a shared
  store (e.g. Redis) before running multiple instances behind a load
  balancer.
- **Local media storage** (`modules/media/storage.ts`) is a stub — no
  Articles/Courses module writes to it yet, and it must be replaced with a
  real implementation (local filesystem for dev, S3-compatible for
  production) when the Media module is built out.
- **No OAuth provider yet** — only email/password. Adding Google/Apple
  sign-in later is additive (new entry in `lib/auth.ts`'s `providers`
  array) but will need the NextAuth Prisma adapter + `Account`/`Session`
  tables if a database session strategy becomes necessary.
