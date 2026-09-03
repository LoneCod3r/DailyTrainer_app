# Community Platform — Foundation

A standalone, independently-deployable community & educational platform.
This repository has **no connection to, dependency on, or shared
infrastructure with `app.humangarage.net`** — that product was used only as
a functional/structural reference during planning, never as code, content,
or a live integration.

This is the **Foundation Phase**: authentication, users, roles, a basic
admin dashboard, a reusable design system, and a billing/Stripe foundation
(test mode, no real payments yet). Discussions, Courses, Events,
Membership, Donations UI, and Notifications are intentionally **not** built
yet — see [`docs/ARCHITECTURE.md`](docs/ARCHITECTURE.md) for what's next.

## Technology stack

| Layer          | Choice                                   |
| -------------- | ----------------------------------------- |
| Framework      | Next.js 14 (App Router) + React 18 + TS   |
| Styling        | Tailwind CSS (custom design tokens)       |
| Database       | PostgreSQL                                |
| ORM            | Prisma                                    |
| Auth           | NextAuth.js (credentials, JWT sessions)   |
| Payments       | Stripe (test mode foundation only)        |
| Testing        | Vitest                                    |

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
  on the billing foundation (see `docs/billing.md`).

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
npm run test         # run once
npm run test:watch   # watch mode
```

Tests cover the framework-agnostic logic that doesn't require a live
database: role/permission checks, input validation, the auth service
(password hashing, duplicate-email handling), and the billing/webhook
foundation (idempotency, Stripe-customer de-duplication), using mocked
Prisma/Stripe clients.

## Build

```bash
npm run build
npm run start
```

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
  admin/              Admin dashboard (server-protected, ADMIN only)
  api/                 REST-style API routes, grouped by concern
  login/, register/    Public auth pages
  account/             Authenticated member profile page
components/
  ui/                  Reusable design-system primitives (Button, Card, ...)
  layout/              Navbar, Footer, AdminSidebar, Providers
  admin/, account/, home/   Feature-specific composed components
modules/              Business logic, framework-agnostic where possible
  auth/, users/, profiles/, content/, media/, settings/   Foundation modules
  payments/            Stripe billing foundation (test mode)
  discussions/, courses/, events/, membership/, donations/, notifications/
                       Reserved, empty module boundaries — see their README.md
lib/                  Cross-cutting utilities (prisma client, logger,
                       permissions, api-response, rate-limit, validations)
prisma/               schema.prisma, migrations, seed.ts
tests/                Vitest unit tests
docs/                 Architecture and billing documentation
```

## What is intentionally NOT implemented yet

Per the Foundation Phase scope, this repository does **not** yet include:

- Discussions / forum
- Courses / lessons / progress tracking
- Meetings / Events
- Membership purchase UI, course purchase UI, donation UI
- Notifications
- Advanced search, advanced analytics, gamification

The architecture (modular `/modules` boundary, admin nav placeholders,
billing service abstraction) is deliberately shaped so each of these can be
added as its own module without restructuring the core.

## Recommended next module

**Content / Blog module** — the Content foundation (`ContentItem` model,
`modules/content`) already powers the Home page's featured/latest sections;
extending it into a full CMS (categories, tags, admin CRUD UI, scheduling)
is the most natural next step and unlocks real content quickly. After that,
**Discussions** and **Membership** (which can now reuse the billing
foundation) are the next highest-value modules.
