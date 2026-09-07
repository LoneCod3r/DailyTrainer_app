# Auth security: CAPTCHA, email verification, rate limiting

Status: **implemented**. Adds bot protection and mandatory email verification
to registration/login, on top of the existing NextAuth credentials + JWT
foundation — see [`ARCHITECTURE.md`](./ARCHITECTURE.md) for that foundation.

## What this adds

- **CAPTCHA** — Google reCAPTCHA v3 on `/register`, verified server-side
  (`lib/recaptcha.ts`) via a real POST to Google's `siteverify` endpoint.
  Chosen over v2 (checkbox / "I'm not a robot") for the lowest-friction
  experience: v3 runs invisibly and scores every visitor (0.0–1.0, rejected
  below 0.5) instead of interrupting legitimate ones with a puzzle; the
  verify call also checks the token's `action` matches `register`, so a
  token minted for one flow can't be replayed against another. The
  client-side widget (`components/auth/Recaptcha.tsx`) only collects the
  token; the server decides pass/fail.
- **Honeypot + timing check** — an off-screen `website` field
  (`components/auth/HoneypotField.tsx`) and a minimum-elapsed-time-since-
  form-render check, both enforced in `modules/auth/auth.service.ts`. Neither
  is a security boundary by itself (both are client-reported) — they're
  cheap friction layered under the CAPTCHA, which is.
- **Math challenge** — a randomly-generated `a + b = ?` question
  (`lib/math-challenge.ts`, `components/auth/MathChallenge.tsx`), one more
  layer alongside (not instead of) CAPTCHA/honeypot/rate limiting. The
  question is generated server-side with a CSPRNG (`crypto.randomInt`); only
  the question text and an opaque `challengeId` ever reach the client — the
  expected answer lives solely in the `MathChallenge` database row and is
  checked server-side in `registerUser`, before the CAPTCHA network call (a
  cheap DB check that fails fast). Single-use (`consumedAt`), 5-minute TTL,
  capped at 5 attempts per challenge, and rate limited both for generating
  new challenges and for checking answers. A "New question" button lets a
  user who can't read/solve the current one get a fresh one; the register
  page also silently fetches a fresh CAPTCHA + math challenge (remounting
  both widgets) after any failed submit, since a spent/rejected one can't be
  reused on retry.
- **Email verification** — new accounts start with `User.emailVerified =
  null`. Registration issues a single-use, SHA-256-hashed, 24-hour token
  (`VerificationToken`, type `EMAIL_VERIFICATION`) and emails a link (a
  styled button plus a plain-text fallback URL — see `lib/mail.ts`'s
  `renderButton`/`renderEmail`) to `/verify-email?token=...`. The raw token
  is never shown anywhere in the UI — only the emailed link carries it, and
  the client-rendered `/verify-email` page immediately consumes it via a
  POST rather than displaying it. A resend endpoint (rate limited,
  enumeration-safe) is available from the login banner, the account
  settings page, and the verify-email page's expired/invalid states.
- **Real email delivery, fail-clearly** — `lib/mail.ts` sends through SMTP
  whenever `SMTP_HOST` is configured (any standard provider — see
  "Configuration required for production" below); with no SMTP configured,
  it falls back to logging the email **outside production only**. A
  `NODE_ENV=production` process with `SMTP_HOST` unset, or a configured
  SMTP send that genuinely fails, throws `EmailDeliveryError` instead of
  silently swallowing it — see "Fail-clearly semantics" below for exactly
  how each caller reacts to that.
- **Member-action gate** — `lib/auth-guards.ts`'s `requireVerifiedUser` is
  called server-side in the routes that create/edit community content:
  `POST /api/discussions`, `POST /api/discussions/:slug/replies`, and
  `PATCH /api/profiles/me`. An unverified session gets a real JWT (so the UI
  can show a "please verify" prompt) but a 403 `EMAIL_NOT_VERIFIED` from
  these endpoints regardless of what the client does — this can't be
  bypassed by calling the API directly. Deliberately scoped to
  community-content actions, not payments or personal progress tracking
  (see "What is intentionally NOT implemented" below).
- **Password reset** — `/forgot-password` → `/reset-password`, using the
  same hashed/single-use/time-limited token mechanism (type
  `PASSWORD_RESET`, 1 hour). Always responds with the same generic message
  regardless of whether the email is registered. Completing a reset is
  equally strong proof of email control as the verification link, so it also
  sets `emailVerified` if it wasn't already, and clears any login lockout.
- **Login brute-force protection** — `User.failedLoginAttempts` /
  `lockedUntil` lock an account for 15 minutes after 5 consecutive failed
  password attempts (persists across restarts/IPs, unlike the in-memory rate
  limiter). A coarser, in-memory per-IP rate limit
  (`lib/rate-limit.ts`) guards against volumetric credential stuffing across
  many accounts from one source.
- **Enumeration safety** — registration still returns a distinct "already
  exists" error (pre-existing behavior, unchanged), but resend-verification
  and forgot-password always return the same generic message whether or not
  the address is registered/already verified.

## Rate limits (all via the existing `lib/rate-limit.ts` in-memory limiter)

| Endpoint | Limit |
| --- | --- |
| `POST /api/auth/register` | 20 / min / IP |
| `POST /api/auth/math-challenge` (generate) | 30 / min / IP |
| Math challenge answer check (inside `registerUser`) | 30 / min / IP, plus a 5-attempt cap **per challenge** |
| Credentials login (`lib/auth.ts` `authorize`) | 20 / 5 min / IP, plus a 5-attempt/15-min **persistent** per-account lockout |
| `POST /api/auth/verify-email` (confirm) | 20 / min / IP |
| `POST /api/auth/verify-email/resend` | 3 / hour / email, 10 / hour / IP |
| `POST /api/auth/forgot-password` | 3 / hour / email, 10 / hour / IP |
| `POST /api/auth/reset-password` (confirm) | 20 / min / IP |

## Fail-clearly semantics for email delivery

`sendMail` (`lib/mail.ts`) throws `EmailDeliveryError` — never returns
success-shaped — when an email genuinely wasn't sent: `SMTP_HOST` missing in
production, or a configured transporter's send rejecting/erroring in any
environment. Two different callers react to that differently, deliberately:

- **`registerUser`** (registration) — lets it propagate, but first deletes
  the user row it just created and re-throws a generic 500. Registration
  genuinely fails from the caller's point of view (no 201, no "check your
  email" message for an email that was never sent), and the address is
  freed up to retry once delivery is fixed — an account nobody could ever
  verify would otherwise permanently occupy that email address.
- **`resendVerificationEmail`** and **`requestPasswordReset`** — catch it,
  log it at `error` level for operators, and still return their normal
  generic response. Both of these endpoints' whole contract is "identical
  response whether or not the account exists"; letting a delivery failure
  produce a *different* response than usual would let an attacker
  distinguish "account exists but SMTP is down" from "no such account"
  during an SMTP outage. The user still has the resend button to try again
  once delivery is restored.

## Local email testing (Mailtrap / Ethereal)

`lib/mail.ts` has no separate "sandbox mode" — pointing the same `SMTP_*`
variables at a sandbox inbox instead of a production sender *is* the
supported way to see real verification/reset emails locally, and it
exercises the exact same code path production uses.

**Ethereal (fastest — no signup):**

1. Visit https://ethereal.email/create to generate a throwaway inbox's
   credentials (or generate one from Node with Nodemailer's own
   `nodemailer.createTestAccount()` helper, if scripting this).
2. Set in `.env`:
   ```
   SMTP_HOST="smtp.ethereal.email"
   SMTP_PORT="587"
   SMTP_SECURE="false"
   SMTP_USER="<generated user>"
   SMTP_PASSWORD="<generated pass>"
   ```
3. Restart `npm run dev`, register an account. The server log's `email
   sent` line includes a `previewUrl` (Nodemailer's built-in
   `getTestMessageUrl` — only ever populated for an Ethereal transport) —
   open it to see the real rendered email, including the verify button.
   Ethereal never delivers anywhere; it only captures.

**Mailtrap (persistent sandbox inbox you can revisit):**

1. Create a free account at https://mailtrap.io, open its **Sandbox** →
   **My Inbox** → **SMTP Settings**, and copy the credentials shown there.
2. Set the same five `SMTP_*` variables to those values.
3. Restart `npm run dev` and register — the email appears in the Mailtrap
   inbox in the browser, not in any real mailbox.

## Why login itself isn't blocked for unverified accounts

An unverified user can still sign in and get a real session — only the
specific member actions above are refused, server-side. Blocking login
entirely was considered and rejected: it would leave a freshly-registered,
signed-out user with no authenticated route back to "resend my verification
email," and it would make "an unverified account tries a protected action"
and "bypass verification via a direct API call" (both explicit test
requirements) collapse into the same trivial "no session" case as an
unauthenticated visitor, instead of testing the actual server-side gate.

## Endpoints

- `POST /api/auth/math-challenge` — no body → `{ challengeId, question }`
  (e.g. `question: "27 + 86"`). Never returns the answer.
- `POST /api/auth/register` — `{ name, email, password, captchaToken,
  mathChallengeId, mathAnswer, website?, formRenderedAt? }` → `{ user }`.
  `mathAnswer` failures come back as 400 with `error.details.reason` of
  `INVALID` / `USED` / `EXPIRED` / `TOO_MANY_ATTEMPTS` / `INCORRECT`.
- `POST /api/auth/verify-email` — `{ token }` → `{ verified: true }` or 400
  with `error.details.reason` of `INVALID` / `USED` / `EXPIRED`. POST, not
  the GET the emailed link itself navigates to — the client-rendered
  `/verify-email` page reads the token from its own URL and POSTs it here,
  so the raw token never appears in a server access log.
- `POST /api/auth/verify-email/resend` — `{ email }` → always `{ message }`.
- `POST /api/auth/forgot-password` — `{ email }` → always `{ message }`.
- `POST /api/auth/reset-password` — `{ token, password }` → `{ reset: true
  }` or the same 400 + reason shape as verify-email.

## Database

Two new fields on `User` (`emailVerified`, `failedLoginAttempts` +
`lockedUntil`) and one new model, `VerificationToken` (`tokenHash`, `type`,
`expiresAt`, `usedAt`), shared by both token kinds via the
`VerificationTokenType` enum rather than two near-identical tables. A
backfill migration marks every pre-existing `ACTIVE` user as verified as of
their original `createdAt`, so shipping this didn't lock anyone out.

A separate `MathChallenge` model (`answer`, `attempts`, `consumedAt`,
`expiresAt`) isn't tied to a `User` — a challenge exists before any account
does. `answer` is a plain integer, not hashed: the answer space for a
two-digit sum is small enough that hashing it would add no real protection,
and the actual guarantee (never sent to the client) doesn't depend on it.

## What is intentionally NOT implemented

- Verification is not required for payments (`/api/membership/subscribe`,
  `/api/donations/checkout`) or personal progress tracking
  (`/api/courses/:slug/progress`) — neither is a spam/abuse vector the way
  posted content is, and gating them would just be friction with no security
  benefit.
- The in-memory rate limiter is single-instance, same tradeoff already
  accepted by every other rate-limited route in this codebase (see
  `lib/rate-limit.ts`) — swap it for Redis/Upstash behind the same
  `checkRateLimit` signature when running multiple instances.
- No admin UI to manually mark a user verified or clear a lockout — would go
  through `/admin/users` if/when that gains write actions.

## Configuration required for production

- `NEXT_PUBLIC_RECAPTCHA_SITE_KEY` / `RECAPTCHA_SECRET_KEY` — real v3 keys
  from https://www.google.com/recaptcha/admin. Google publishes no
  universal "always passes" test key pair that works on an unregistered
  domain (unlike some other CAPTCHA providers), so `.env.example` ships
  both empty; with `RECAPTCHA_SECRET_KEY` unset, `lib/recaptcha.ts` skips
  real verification outside production, and the widget
  (`components/auth/Recaptcha.tsx`) synthesizes a placeholder token instead
  of loading Google's script — this is what local dev and this project's
  Playwright suite run against. Both env vars **must** be set in production
  or the CAPTCHA becomes a no-op.
- `SMTP_HOST` / `SMTP_PORT` / `SMTP_SECURE` / `SMTP_USER` / `SMTP_PASSWORD` /
  `EMAIL_FROM` — any standard SMTP provider (Postmark, SES, Mailgun,
  Resend's SMTP endpoint, ...). With `SMTP_HOST` unset, `lib/mail.ts` logs
  the email instead of sending it — but only outside production. With
  `NODE_ENV=production` and `SMTP_HOST` unset, registration fails outright
  (see "Fail-clearly semantics" above) rather than silently never sending
  the email — this is a hard requirement, not a soft recommendation.
