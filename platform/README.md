# KUKO WAY — Platform

A standalone, independently-deployable wellness/community platform. This
repository has **no connection to, dependency on, or shared infrastructure
with `app.humangarage.net`** — that product was used only as a
functional/structural reference during planning, never as code, content, or
a live integration.

The app is bilingual (Bulgarian default, English) throughout, and organized
around four sections: **Home**, **Practices**, **Community**, and
**Account**.

## What's been accomplished

**Foundation** — authentication (NextAuth, credentials + JWT sessions),
role-based access (Member / Moderator / Admin), an admin dashboard (users,
membership plans, site settings), and a reusable Tailwind design system with
full dark-mode support.

**Practices** — a "Start Here" onboarding track, a "Feel Better Now" quick-
relief section, 7/14/28-day guided programs, a searchable/filterable
practice Library, a Free Videos section (real YouTube embeds), and per-user
progress tracking that persists real completions (not fixed demo data) both
for signed-in members and locally on-device.

**Community** — Discussions (create threads, reply), Courses (modules →
lessons, with progress), Meetings, and a Blog, all wired to real seeded
content and reachable from the primary nav.

**Membership & payments** — Stripe-backed subscription checkout, a billing
portal, and one-off donations, all in **Stripe test mode**; admin UI to
manage membership plans. The donation flow gracefully disables itself when
Stripe isn't configured, rather than failing.

**Design & polish** — a topbar with flyout submenus and a flag-based
language switcher (replacing an earlier sidebar-based layout), a full-width
photo hero on Home with a real KUKO WAY philosophy quote for signed-out
visitors, and a site-wide typography pass (larger base font, with the
responsive nav breakpoints re-tuned to match).

**Testing** — Vitest unit tests for framework-agnostic logic (permissions,
validation, auth, billing/webhook idempotency), plus a full Playwright
end-to-end suite: accessibility (axe-core, single-heading/contrast rules),
theme/dark-mode, responsive/no-horizontal-overflow checks at a real mobile
viewport, and functional coverage of auth, navigation, practices,
discussions, courses, meetings, blog, payments, protected routes, and
localization.

## What lies ahead

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
- **Known issue**: two WebKit-only Playwright auth tests are intermittently
  flaky (pre-existing, unrelated to app code — documented in the test file,
  not currently blocking).

## Technology stack

| Layer          | Choice                                   |
| -------------- | ----------------------------------------- |
| Framework      | Next.js 14 (App Router) + React 18 + TS   |
| Styling        | Tailwind CSS (custom design tokens)       |
| Database       | PostgreSQL                                |
| ORM            | Prisma                                    |
| Auth           | NextAuth.js (credentials, JWT sessions)   |
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
- Stripe variables are optional for local development unless you're working
  on membership/donations (see `docs/billing.md`, `docs/membership.md`).

**Never commit `.env`.** Only `.env.example` (with placeholder values) is
tracked in version control.

### 4. Set up the database

```bash
npm run db:migrate   # creates the database schema
npm run db:seed      # creates demo accounts + placeholder content
```

This creates three demo accounts (password `DevPassword123!`):

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
  (app)/               Home, Practices, Community, Account — the main app shell
  (auth)/              Login / register pages
  admin/               Admin dashboard (server-protected, ADMIN only)
  api/                 REST-style API routes, grouped by concern
components/
  ui/                  Reusable design-system primitives (Button, Card, ...)
  layout/              Topbar, MobileDrawer, MobileBottomNav, AdminSidebar
  admin/, account/, home/, practices/, community/   Feature-specific components
modules/              Business logic, framework-agnostic where possible
  auth/, users/, profiles/, content/, media/, settings/   Foundation modules
  kuko-way/            Practices/programs domain logic + demo progress
  courses/, discussions/, events/     Community feature modules
  membership/, payments/              Billing foundation + subscriptions (Stripe)
  donations/, notifications/          Reserved module boundaries — see "What lies ahead"
lib/                  Cross-cutting utilities (prisma client, logger,
                       permissions, api-response, rate-limit, validations,
                       i18n dictionaries)
prisma/               schema.prisma, migrations, seed.ts
tests/                Vitest unit tests
tests/e2e/            Playwright end-to-end tests
docs/                 Architecture and billing documentation
```
