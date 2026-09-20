# DailyTrainer_app — KUKO WAY Platform

This repository holds **KUKO WAY**, a standalone, independently-deployable
wellness/community platform (bilingual, Bulgarian default + English). The
actual Next.js application lives in [`platform/`](platform/) — see
[`platform/README.md`](platform/README.md) for full setup instructions. This
top-level README summarizes what the project is, what's built, and what
isn't yet, for anyone landing on the repo root.

> This project has no connection to, dependency on, or shared infrastructure
> with `app.humangarage.net` — that product was used only as a
> functional/structural reference during planning, never as code, content,
> or a live integration.

## Repository layout

```
platform/    The Next.js application (see platform/README.md for details)
*.docx       Planning documents (structure, prompts, security notes — Bulgarian/English)
*.png/.webm  Reference screenshots and a short demo recording
```

The app itself is organized around four sections: **Home**, **Practices**,
**Community**, and **Account**.

## Technology stack

| Layer          | Choice                                    |
| -------------- | ------------------------------------------ |
| Framework      | Next.js 14 (App Router) + React 18 + TypeScript |
| Styling        | Tailwind CSS (custom design tokens, dark mode) |
| Database       | PostgreSQL                                 |
| ORM            | Prisma                                     |
| Auth           | NextAuth.js (credentials, JWT sessions)    |
| Bot protection | Google reCAPTCHA v3 + honeypot + math challenge |
| Email          | Nodemailer (any SMTP provider)             |
| Payments       | Stripe (currently test mode)               |
| Testing        | Vitest (unit) + Playwright (e2e, incl. axe-core a11y) |

## What's implemented

**Foundation** — NextAuth-based authentication with credentials + JWT
sessions, role-based access (Member / Moderator / Admin), an admin dashboard
(users, membership plans, site settings), and a reusable Tailwind design
system with full dark-mode support.

**Registration & account security** — Google reCAPTCHA v3 (verified
server-side), an invisible honeypot field, a minimum-fill-time check, and a
server-side arithmetic ("math challenge") anti-bot check on registration;
mandatory email verification (signed, single-use, time-limited tokens)
gating member actions (posting, replying, editing a profile); a
self-service "forgot password" flow using the same verified-link mechanism;
per-account login lockout after repeated failed attempts; IP-based rate
limiting on register/login/verification/password-reset endpoints. Full
design in `platform/docs/auth-security.md`.

**Practices** — a "Start Here" onboarding track, a "Feel Better Now"
quick-relief section, 7/14/28-day guided programs, a searchable/filterable
practice Library, a Free Videos section (real YouTube embeds), and per-user
progress tracking that persists real completions for both signed-in members
and locally on-device.

**Community** — Discussions (create threads, reply), Courses (modules →
lessons with progress tracking), Meetings, and a Blog — all wired to real
seeded content and reachable from the primary nav.

**Membership & payments** — Stripe-backed subscription checkout, a billing
portal, and one-off donations, all in Stripe **test mode**; admin UI to
manage membership plans. The donation flow degrades gracefully (disables
itself) when Stripe isn't configured, rather than failing.

**Design & polish** — a topbar with flyout submenus and a flag-based
language switcher, a full-width photo hero on Home with a KUKO WAY
philosophy quote for signed-out visitors, and a site-wide typography pass
with responsive nav breakpoints re-tuned to match.

**Testing** — Vitest unit tests for framework-agnostic logic (permissions,
validation, auth, rate limiting, CAPTCHA verification, email
verification/password-reset token lifecycle, billing/webhook idempotency),
plus a full Playwright end-to-end suite covering accessibility, theming,
responsive layout at real breakpoints, and functional flows for auth,
navigation, practices, discussions, courses, meetings, blog, payments,
protected routes, and localization.

## What's NOT implemented yet

- **Notifications module** — `platform/modules/notifications` is a reserved,
  empty placeholder. No in-app or email notifications exist yet (beyond the
  transactional auth/verification emails).
- **Real KUKO WAY photography/video** — the Home hero and Explore section
  currently use licensed stock photos and a few client-supplied images (see
  `platform/public/images/home/CREDITS.md`); real studio photography/video
  is still pending.
- **Content authoring UI** — Blog, Discussions, Courses, and Meetings render
  real seeded content, but there is no admin CRUD screen yet to create or
  edit that content without touching the database directly (e.g. via
  `npx prisma studio`).
- **Production billing** — Stripe is wired end-to-end but only in test mode.
  Going live requires real API keys, a production webhook endpoint, and a
  final review of the checkout/donation flows.
- **Donations module beyond the basic flow** — `platform/modules/donations`
  is largely a reserved module boundary; the working donation flow exists at
  the route/API level but the module itself isn't fully fleshed out.
- **SEO & performance pass, real-device QA** — verified via Playwright at
  emulated breakpoints (375/768/1024/1440px) and axe-core accessibility
  checks, but there hasn't been a dedicated performance/SEO audit or a pass
  on physical devices yet.
- **Known flaky tests** — a handful of WebKit/Firefox-only Playwright auth
  tests are intermittently flaky, tied to a pre-existing `next dev`-only
  React Strict Mode/CSRF race unrelated to app code (documented in the test
  file itself, not currently blocking).

## Stripe Billing Localization

The app supports Bulgarian (`bg`) and English (`en`). Stripe localizes
different billing surfaces from different inputs, so they can legitimately
show different languages for the same invoice:

| Surface | Language comes from | Controlled by DailyTrainer? |
| --- | --- | --- |
| DailyTrainer UI | the `ptd_locale` cookie (`bg` / `en`) | Yes |
| Invoice PDF, receipt PDF, invoice/receipt emails | the Stripe Customer's `preferred_locales` | Yes (synced from the app language) |
| Stripe Hosted Invoice Page (the invoice **Review** link, `hosted_invoice_url`) | the viewer's **browser language** | **No** |

**Customer sync.** The app mirrors the selected app language onto the user's
*existing* Stripe Customer as `preferred_locales: ['bg']` or `['en']`. It runs
on subscription checkout, Billing Portal access, donation checkout, and when a
logged-in user switches language (`POST /api/account/locale`). It only updates
when the value differs, never creates a Customer, and a Stripe failure never
blocks the user.

**Hosted Invoice Page.** Stripe determines its language from the customer's
browser settings; it is not controlled by the DailyTrainer locale or by
`preferred_locales`. Stripe documents that the hosted invoice payment page
checks the browser's language settings (and that browser language takes
priority there, while the PDF and email keep the language set on the
Customer). See
[Language recognition for invoices with Stripe Billing](https://support.stripe.com/questions/language-recognition-for-invoices-with-stripe-billing).

Verified examples:

- DailyTrainer in English + browser language English → Hosted Invoice Page in English.
- DailyTrainer in English + browser language Bulgarian → Hosted Invoice Page in Bulgarian.
- With a Bulgarian browser, the invoice PDF can be English (Customer
  `preferred_locales: ['en']`) while the Hosted Invoice Page is Bulgarian.

This is expected Stripe behavior, not a DailyTrainer bug. Stripe documents no
supported way for an application to set the Hosted Invoice Page language, so
none is used here.

## Getting started

Full setup instructions (prerequisites, environment variables, database
migrations, seeding, running the dev server and tests) live in
[`platform/README.md`](platform/README.md). Quick pointer:

```bash
cd platform
npm install
cp .env.example .env   # then fill in DATABASE_URL, NEXTAUTH_SECRET, etc.
npm run db:migrate
npm run db:seed
npm run dev
```

See also:

- [`platform/docs/ARCHITECTURE.md`](platform/docs/ARCHITECTURE.md) — architecture and tech choices
- [`platform/docs/auth-security.md`](platform/docs/auth-security.md) — auth/registration security design
- [`platform/docs/billing.md`](platform/docs/billing.md) and [`platform/docs/membership.md`](platform/docs/membership.md) — Stripe billing/membership design
