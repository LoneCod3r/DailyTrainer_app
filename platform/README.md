# KUKO WAY — Platform

A standalone, independently-deployable wellness/community platform. This
repository has **no connection to, dependency on, or shared infrastructure
with `app.humangarage.net`** — that product was used only as a
functional/structural reference during planning, never as code, content, or
a live integration.

The app is bilingual (Bulgarian default, English) throughout. Its main
sections are **Home**, **Practice**, **Programs**, **Learn** (Knowledge),
**Journey** and **Profile**; Community (Discussions, Courses, Meetings) and
the Blog are reachable from the mobile menu and the footer. See the
repository root [`README.md`](../README.md) for a product overview and
[`docs/v1-implementation-notes.md`](docs/v1-implementation-notes.md) for the
V1 details.

## What's been accomplished

**Foundation** — authentication (NextAuth, credentials + JWT sessions),
role-based access (Member / Moderator / Admin), an admin dashboard (users,
membership plans, site settings), and a reusable Tailwind design system
(KUKO WAY palette, Manrope + display serif with Cyrillic coverage) with full
dark-mode support.

**Registration security** — Google reCAPTCHA v3 (verified
server-side) plus an invisible honeypot field, a minimum-fill-time check,
and a randomly-generated arithmetic challenge (the expected answer never
leaves the server) on registration; mandatory email verification (signed, single-use,
time-limited tokens) before a member action (posting, replying, editing a
profile) is allowed; a self-service "forgot password" flow gated on the same
verified-link mechanism; per-account login lockout after repeated failed
attempts, alongside IP-based rate limiting on register/login/verification/
password-reset endpoints. See `docs/auth-security.md` for the full design.

**Practice** — "Start Here" (orientation chapters leading to the first
practice), "Feel Better Now", a searchable/filterable Library and Free Videos
(YouTube). Each practice runs as a guided flow: optional before/after
check-ins, a focused practice mode with a timer, and private notes. Practice
sessions, favorites, minutes and a local-calendar-day streak are saved to
the account; signed-out completions stay on the device and are imported
after sign-in.

**Learn and Journey** — Learn holds the handbook's background chapters and
articles (none of them repeated in Start Here).
Journey shows practice stats, program progress, recent practice with
check-ins, private notes and favorites; Profile leads with the same summary.

**Reset Programs** — 1, 3, 7 and 28-day programs (€19 / €39 / €79 / €149,
one-time) structured as phases → days → items, with server-side access
checks, sequential day unlocking, item completion and private day
reflections. Program content is still placeholder ("content coming soon")
and the programs are unpublished (visible outside production only).

**Community** — Discussions (create threads, reply), Courses (modules →
lessons, with progress), Meetings, and a Blog, all wired to real seeded
content and reachable from the primary nav.

**Payments** — one-time Reset Program purchases via Stripe Checkout in
**Stripe test mode**: access is granted only from the verified webhook (or a
server-side check of the paid session), duplicate webhook deliveries are
idempotent, and a full refund revokes access. One-off donations and the
billing portal also run in test mode. KUKO WAY **does not currently offer a
membership/subscription plan** — membership sales are off
(`NEXT_PUBLIC_FEATURE_MEMBERSHIP_SALES`); the subscription billing code is
kept for a future Community subscription. The donation flow gracefully
disables itself when Stripe isn't configured, rather than failing.

**Design & polish** — a topbar with flyout submenus and a flag-based
language switcher (replacing an earlier sidebar-based layout), a full-width
photo hero on Home with a real KUKO WAY philosophy quote for signed-out
visitors, and a site-wide typography pass (larger base font, with the
responsive nav breakpoints re-tuned to match).

**Testing** — Vitest unit tests for framework-agnostic logic (permissions,
validation, auth, rate limiting, CAPTCHA verification, email
verification/password-reset token lifecycle, billing/webhook idempotency),
plus a full Playwright end-to-end suite: accessibility (axe-core,
single-heading/contrast rules), theme/dark-mode, responsive/no-horizontal-
overflow checks at a real mobile viewport, and functional coverage of auth
(including CAPTCHA, honeypot, email verification, resend, login lockout, and
direct-API bypass attempts), navigation, practices, discussions, courses,
meetings, blog, payments, protected routes, and localization.

## What lies ahead

- **Program content** — the real videos, audio and texts for the four Reset
  Programs, and a hosting choice for program media (no media provider is
  integrated yet).
- **Live payments** — production checkout stays disabled until the pricing,
  VAT and legal terms are confirmed.
- **Newsletter** — scoped but not built (see `docs/v1-implementation-notes.md`).
- **Community subscription and Trainer program** — future stages; shown only
  as "coming later".
- **Notifications module** — still an empty placeholder (`modules/notifications`);
  no in-app or email notifications exist yet.
- **Real KUKO WAY photography/video** — the Home hero and Explore section
  currently use a mix of licensed stock photos and a few client-supplied
  images (see `public/images/home/CREDITS.md`); these should be replaced by
  real studio photography/video once available.
- **Content authoring UI** — Blog, Discussions, Courses, and Meetings all
  render real seeded content, but there's no admin CRUD screen yet to create
  or edit that content without touching the database directly.
- **Production billing** — Stripe is wired end-to-end but only in test mode;
  going live needs real API keys, a production webhook endpoint, and a
  final review of the checkout/donation flows.
- **SEO & performance pass, real-device QA** — the app has been verified via
  Playwright at emulated breakpoints (375/768/1024/1440px) and Lighthouse-
  style axe checks, but hasn't yet had a dedicated performance/SEO audit or
  a pass on physical devices.
- **Known issue**: a handful of WebKit/Firefox-only Playwright auth tests are
  intermittently flaky (pre-existing `next dev`-only React Strict Mode/CSRF
  race, unrelated to app code — documented in the test file,
  not currently blocking).

## Technology stack

| Layer          | Choice                                   |
| -------------- | ----------------------------------------- |
| Framework      | Next.js 14 (App Router) + React 18 + TS   |
| Styling        | Tailwind CSS (custom design tokens)       |
| Database       | PostgreSQL                                |
| ORM            | Prisma                                    |
| Auth           | NextAuth.js (credentials, JWT sessions)   |
| Bot protection | Google reCAPTCHA v3                       |
| Email          | Nodemailer (any SMTP provider)            |
| Payments       | Stripe (test mode)                        |
| Testing        | Vitest (unit) + Playwright (e2e)          |

See [`docs/ARCHITECTURE.md`](docs/ARCHITECTURE.md) for the reasoning behind
each choice.

## Local development setup

### 1. Prerequisites

- Node.js 20+
- A local or hosted PostgreSQL 14+ database

### 2. Install dependencies

```bash
npm install
```

### 3. Configure environment variables

```bash
cp .env.example .env
```

Then edit `.env`:

- `DATABASE_URL` — your PostgreSQL connection string.
- `NEXTAUTH_SECRET` — generate with `openssl rand -base64 32`.
- `NEXT_PUBLIC_RECAPTCHA_SITE_KEY` / `RECAPTCHA_SECRET_KEY` — Google
  reCAPTCHA v3 keys. Left empty in the example file — with no key
  configured, both the client and server sides fall back to a dev-only
  bypass outside production (see `docs/auth-security.md`) — but get real
  keys for production.
- `SMTP_*` / `EMAIL_FROM` — outbound email for verification/password-reset
  links. Optional for local dev (emails are logged instead of sent when
  `SMTP_HOST` is unset — point these at a free Ethereal/Mailtrap sandbox
  inbox instead to see real rendered emails locally) but **required** in
  production, where an unset `SMTP_HOST` makes registration fail outright
  rather than silently skip sending — see `docs/auth-security.md`.
- Stripe variables are optional for local development unless you're working
  on Reset purchases or donations (see `docs/billing.md`). Test-mode Reset
  checkout additionally needs `NEXT_PUBLIC_FEATURE_PROGRAM_CHECKOUT="true"`
  and an `sk_test_` key; forward webhooks locally with `stripe listen
  --forward-to localhost:3000/api/webhooks/stripe` (event list in
  `docs/v1-implementation-notes.md`).

**Never commit `.env`.** Only `.env.example` (with placeholder values) is
tracked in version control.

### 4. Set up the database

```bash
npm run db:migrate   # creates the database schema
npm run db:seed      # creates demo accounts + placeholder content
```

This creates three demo accounts, all using the password you set in
`SEED_DEMO_PASSWORD` in `.env` (the seed refuses to run without it; the e2e
suite logs in with the same value):

- `admin@example.dev` — ADMIN
- `moderator@example.dev` — MODERATOR
- `member@example.dev` — USER

These are development-only accounts with no real personal information.

### 5. Run the app

```bash
npm run dev
```

Visit `http://localhost:3000`. Sign in with one of the seeded accounts
above, or register a new account. Visit `/admin` while signed in as the
admin account to see the admin dashboard.

## Creating an admin user manually

Two options:

1. Register a normal account, then promote it:
   ```bash
   npx prisma studio
   ```
   Open the `users` table and change that row's `role` to `ADMIN`.
2. Or run the seed script (`npm run db:seed`), which always creates
   `admin@example.dev` as an ADMIN account.

## Running tests

```bash
npm run test              # unit tests, run once
npm run test:watch        # unit tests, watch mode
npm run test:e2e          # Playwright end-to-end suite
npm run test:e2e:ui       # Playwright UI mode
npm run test:e2e:headed   # Playwright, browser windows visible
npm run test:e2e:report   # open the last e2e HTML report
```

Unit tests cover framework-agnostic logic that doesn't require a live
database: role/permission checks, input validation, the auth service
(password hashing, duplicate-email handling), and the billing/webhook
foundation (idempotency, Stripe-customer de-duplication), using mocked
Prisma/Stripe clients.

The Playwright suite runs against a real running app (`npm run dev` first)
and covers accessibility, theming, responsive layout, and the functional
flows for every section listed above.

## Build

```bash
npm run build
npm run start
```

If a `next dev` server is already running on port 3000, stop it first —
running `dev` and `build` concurrently corrupts the shared `.next` cache.

## Database migrations

This project uses Prisma Migrate. Never hand-edit the database schema in
production.

```bash
npm run db:migrate   # create + apply a new migration (development)
npm run db:deploy    # apply existing migrations (production/CI)
```

## Project structure

```
app/                 Next.js App Router pages & API routes
  (app)/               Home, Practice, Programs, Learn, Journey, Account and Community — the main app shell
  (auth)/              Login / register pages
  admin/               Admin dashboard (server-protected, ADMIN only)
  api/                 REST-style API routes, grouped by concern
components/
  ui/                  Reusable design-system primitives (Button, Card, ...)
  layout/              Topbar, MobileDrawer, MobileBottomNav, AdminSidebar
  admin/, account/, practices/, programs/, journey/, commerce/, community/   Feature-specific components
modules/              Business logic, framework-agnostic where possible
  auth/, users/, profiles/, content/, media/, settings/   Foundation modules
  kuko-way/            Practices, handbook, check-ins and practice progress
  programs/            Reset Program content model, progression and progress
  commerce/            Product catalog, checkout, purchases and entitlements
  courses/, discussions/, events/     Community feature modules
  membership/, payments/              Billing foundation (Stripe); subscriptions not currently sold
  donations/, notifications/          Reserved module boundaries — see "What lies ahead"
lib/                  Cross-cutting utilities (prisma client, logger,
                       permissions, api-response, rate-limit, validations,
                       i18n dictionaries)
prisma/               schema.prisma, migrations, seed.ts
tests/                Vitest unit tests
tests/e2e/            Playwright end-to-end tests
docs/                 Architecture and billing documentation
```
