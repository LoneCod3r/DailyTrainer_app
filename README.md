# DailyTrainer_app — KUKO WAY Platform

This repository holds **KUKO WAY**, a standalone, independently-deployable
platform for body awareness and daily practice — guided Fascial Maneuvers,
breathing and reset practices, educational content and personal progress —
in Bulgarian (default) and English. It is designed as a calm practice space,
not a fitness or medical app. The Next.js application lives in
[`platform/`](platform/) — see [`platform/README.md`](platform/README.md) for
setup instructions. This top-level README summarizes what the product is,
what is built, and what is not yet.

**Production (test phase):** https://daily-trainer-app.vercel.app/ — see
[Deployment and CI](#deployment-and-ci) for what is live and what is still
limited (payments run in Stripe test mode only).

> This project has no connection to, dependency on, or shared infrastructure
> with `app.humangarage.net` — that product was used only as a
> functional/structural reference during planning, never as code, content,
> or a live integration.

## Repository layout

```
platform/              The Next.js application (see platform/README.md)
newsletter-templates/  Newsletter design explorations (static HTML, not used by the app)
*.docx                 Planning documents (structure, prompts, security notes — Bulgarian/English)
*.png/.webm            Reference screenshots and a short demo recording
```

## Main sections and user flow

| Section | Purpose |
| --- | --- |
| **Home** | Entry point: a practice to start, the program in progress and personal progress at a glance. |
| **Practice** | The handbook practices — *Start Here* (first steps), *Feel Better Now*, the searchable Library and the free videos. |
| **Programs** | The Reset Programs (1, 3, 7 and 28 days) with prices, access and progress. |
| **Knowledge** (*Learn*, BG „Знание“) | Educational reference: the handbook's chapters on the body and fascia, and articles. |
| **Journey** | Personal progress over time: practice statistics, programs, favorites, recent practice with check-ins, and private notes. |
| **Profile** | The account: journey summary, purchased programs, settings (including password change) and billing. |

Desktop shows Practice · Programs · Learn · Journey in the top bar (the logo
leads Home); on mobile a bottom bar gives one-tap access to Home, Practice,
Programs, Journey and Profile. Community (Discussions, Courses, Meetings) and
the Blog remain available from the mobile menu and the footer.

Typical flow: start with *Start Here* → do a practice → see it in *Journey* →
continue with a Reset Program.

## What's implemented

**Practice flow and progress** — every practice runs as a guided flow:
*Begin* → an optional "before" check-in (tension, pressure, fatigue,
restlessness) → a focused practice mode with a timer and one step at a time
→ an optional "after" check-in → completion. For signed-in users each
practice is saved with its measured time and check-ins; practice history,
total minutes, practised days and the consecutive-day streak (counted by the
user's own calendar day) appear in Journey and Profile. Signed-out visitors
can practise too; their completions are kept on the device and added to
their account after they sign in.

**Favorites, history and private notes** — signed-in users can save
practices as favorites, see their recent practice history with before/after
check-ins, and write private notes after a practice and a reflection for
each program day. Notes are visible only to their author.

**Journey dashboard** — the Journey page opens with the practice statistics
(days of showing up, practices completed, minutes of practice) as cards
beside the page title on wide screens. Below them, four cards in a two-column
grid: *Your programs*, *Favorites*, *Recent practice* and *Your notes*
(one column on tablets and phones). Each empty card says what will appear
there, with a link to get started where relevant. Signed-out visitors see
this device's numbers and an invitation to create an account.

**Start Here and Knowledge** — each handbook chapter has a single home:
*Start Here* holds the orientation chapters and leads to the first practice;
*Knowledge* holds the background chapters and articles. Practice videos are
reached through the Practice section.

**Reset Programs (1, 3, 7 and 28 days)** — each program is structured into
days with their materials; the 28 Day Reset is organized in four weekly
phases (Release, Restore, Reconnect, Reset). Days open in sequence — the next
day unlocks when the previous one is complete — and each day has an optional
private reflection. Progress is shown on the program page, in Journey, in
Profile and on Home.

**Payment and access to purchased content** — a program is bought with a
one-time card payment; access is granted only after the payment is
confirmed, appears in Profile ("Purchased programs"), and ends again if the
payment is fully refunded. A user cannot buy a program they already have.
Purchasing currently runs in **payment test mode only** (see *Next steps*).

**Accounts and security** — registration with email verification, password
reset, bot protection (reCAPTCHA v3, honeypot, minimum fill time, an
arithmetic challenge), login lockout after repeated failed attempts and rate
limiting; roles Member / Moderator / Admin with an admin dashboard. Signed-in
users can change their password in Profile & Settings (the current password
is required); changing or resetting a password signs the account out on all
other devices. Design in `platform/docs/auth-security.md`.

**Community and support** — Discussions (threads, replies, moderation and
reports), Courses (modules → lessons with progress), Meetings, a Blog, and
voluntary one-off donations.

**Bulgarian and English** — the whole interface is available in both
languages (Bulgarian by default), switchable at any time.

**Mobile experience** — layouts and navigation are built for phones as well
as desktop and checked at a 375 px viewport. Profile & Settings and Journey
use two columns on wide screens and stack into one column on smaller ones.

**Accessibility** — automated accessibility checks (axe) on the main pages,
WCAG AA colour contrast in light and dark themes, a single top-level heading
per page and keyboard-operable navigation. Form fields are linked to their
labels, and icon-only controls (such as the account menu on phones) have an
accessible name.

## Programs and prices

| Program | Price |
| --- | --- |
| 1 Day Reset | €19 (one-time) |
| 3 Day Reset | €39 (one-time) |
| 7 Day Reset | €79 (one-time) |
| 28 Day Reset | €149 (one-time) |

KUKO WAY **currently does not offer a membership or subscription plan.**
*KUKO WAY Community* (subscription) and the *Trainer Program* are shown on the
Programs page only as "Coming soon" (BG „Предстои“) and cannot be purchased.

**Program content:** the functional foundation of the programs (structure,
days, sequential access, progress, reflections, purchase and access) is
ready for the real content, but the actual program materials — videos,
audio and texts — have not yet been provided and added. Until then every
program item is a placeholder ("content coming soon").

## Next steps

- **Program content** — add the real videos, audio and texts to the four
  programs, and choose the hosting for program video and audio.
- **Texts and terms** — final approval of the Bulgarian (and English)
  wording; finalize the commercial and legal terms (pricing rules, VAT,
  terms of sale, refunds, privacy) needed before real payments are enabled.
- **Newsletter** — define the scope and provider, then build it (see the
  assessment in `platform/docs/v1-implementation-notes.md`).
- **Production setup** — connect the `kukoway.com` domain, verify it for
  outgoing email, and move payments from Stripe test mode to live mode (a
  reviewed code change plus live Stripe configuration).
- **Future stages** — KUKO WAY Community and the Trainer education program.

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
| Payments       | Stripe (test mode)                         |
| Testing        | Vitest (unit) + Playwright (e2e, incl. axe-core a11y) |
| Hosting        | Vercel (functions in `fra1`) + Neon PostgreSQL (Frankfurt) |
| CI             | GitHub Actions (Smoke Test; production DB migrations) |

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
on checkout (Reset Programs, donations), Billing Portal access, and when a
logged-in user switches language (`POST /api/account/locale`). It only updates
when the value differs, never creates a Customer by itself, and a Stripe
failure never blocks the user.

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

## Deployment and CI

- **Production:** https://daily-trainer-app.vercel.app/ (Vercel, Root
  Directory `platform`). Every push to `main` deploys automatically. The build
  only runs `prisma generate` and `next build`; it never touches the database
  schema.
- **Database migrations:** production migrations run separately, from the
  *Production DB Migrations* GitHub Actions workflow (`prisma migrate deploy`
  over Neon's direct connection, never reset). See
  [`platform/README.md`](platform/README.md#database-migrations).
- **Smoke Test (CI):** on every push and pull request to `main`: type check,
  lint, unit tests, production build and the full Playwright e2e suite against
  a throwaway PostgreSQL database.
- **Latest verified state (8 October 2026):** commit `4251e43` deployed to
  production (Vercel status *Ready*), and its Smoke Test run passed. The
  production database is up to date (10 of 10 migrations applied).

Still limited in production at this stage:

- payments run in **Stripe test mode** only — no real charges;
- the Reset Programs are shown through preview feature flags and their
  content is still placeholder;
- outgoing email uses a temporary test sender until `kukoway.com` is verified
  for sending, so verification emails only reach the sending account's own
  address;
- the app is served on the Vercel URL; the `kukoway.com` domain is not
  connected yet.

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

- [`platform/docs/v1-implementation-notes.md`](platform/docs/v1-implementation-notes.md) — what V1 implements, feature flags, test-mode purchasing, open decisions
- [`platform/docs/ARCHITECTURE.md`](platform/docs/ARCHITECTURE.md) — architecture and tech choices
- [`platform/docs/auth-security.md`](platform/docs/auth-security.md) — auth/registration security design
- [`platform/docs/billing.md`](platform/docs/billing.md) and [`platform/docs/membership.md`](platform/docs/membership.md) — Stripe billing foundation and the (currently not offered) membership design
