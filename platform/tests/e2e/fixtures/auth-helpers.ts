import type { Page } from '@playwright/test';
import { expect } from '@playwright/test';

// The register page disables "Create account" until the reCAPTCHA widget's
// onVerify callback fires (see app/(auth)/register/page.tsx and
// components/auth/Recaptcha.tsx). Local dev/test runs have no
// NEXT_PUBLIC_RECAPTCHA_SITE_KEY configured — Google publishes no universal
// "always passes" test key pair that works on an unregistered domain — so
// the component synthesizes a placeholder token immediately instead of
// loading the real widget (see lib/recaptcha.ts for the matching
// server-side dev fallback). The button still becomes enabled
// asynchronously (a tick after mount), so this still needs to be awaited.
export async function waitForRecaptchaToken(page: Page, buttonName: string = 'Create account'): Promise<void> {
  await expect(page.getByRole('button', { name: buttonName })).toBeEnabled({ timeout: 20_000 });
}

// Reads the server-generated "a + b" question (see components/auth/
// MathChallenge.tsx) and fills in the correct sum — the answer is never
// present in the page/response, so the test computes it itself rather than
// reading it. Call after waitForRecaptchaToken: the "Create account" button
// only enables once the challenge has loaded, and filling the answer input
// before then would race the same `next dev` hydration issue documented
// where Name/Email/Password are filled.
export async function solveMathChallenge(page: Page): Promise<void> {
  const questionText = (await page.getByTestId('math-question').textContent()) ?? '';
  const match = questionText.match(/(\d+)\s*\+\s*(\d+)/);
  if (!match) throw new Error(`Could not parse math challenge question: "${questionText}"`);
  const [, a, b] = match;
  await page.getByLabel('Quick security check').fill(String(Number(a) + Number(b)));
}

// The minimum-fill-time anti-bot check (modules/auth/auth.service.ts,
// MIN_HUMAN_SUBMIT_MS = 1500ms) rejects a registration submitted implausibly
// soon after the form rendered. Previously the real CAPTCHA widget's script
// load provided that delay "for free" in tests; the dev-mode reCAPTCHA
// fallback (no site key configured — see waitForRecaptchaToken above)
// resolves near-instantly, so a fast test run can now finish filling the
// form before that floor.
//
// This deliberately does NOT try to compute "remaining time since the form
// rendered" from a timestamp captured in the test: the form's own
// `formRenderedAt` is captured client-side at React mount, which happens
// *after* page.goto() resolves (navigation + hydration), not before it —
// using a Node-side "before goto" timestamp as that anchor undercounts the
// real gap and can still trip the floor. A flat wait immediately before
// submitting is simpler and correct regardless: by the time this is called
// (after the CAPTCHA/math challenge are ready), the component has
// definitely already mounted, so waiting minMs from *here* guarantees more
// than minMs has elapsed since the real, earlier mount time.
export async function ensureMinHumanFillTime(page: Page, minMs = 1700): Promise<void> {
  await page.waitForTimeout(minMs);
}

// React marks every DOM node it has hydrated with an internal `__reactProps$…`
// key. `page.goto()` resolves at the `load` event, which fires BEFORE hydration
// finishes (~50ms later in Chromium, ~200ms in WebKit against `next dev`).
// A `fill()` in that window is wiped when hydration resets the controlled
// inputs to their initial state, and the submit then never reaches
// signIn(). Waiting on this marker (instead of a fixed sleep) makes each
// attempt — and therefore the retry — start from an interactive form.
async function waitForFormHydrated(page: Page, inputSelector: string = 'input[name="email"]'): Promise<void> {
  await page.waitForFunction(
    (selector) => {
      const el = document.querySelector(selector);
      return !!el && Object.keys(el).some((key) => key.startsWith('__reactProps'));
    },
    inputSelector,
    { timeout: 20_000 },
  );
}

// `npm run dev` only: React 18 Strict Mode double-invokes effects, so
// <SessionProvider> fires two concurrent initial `/api/auth/session`
// requests on mount. Each one causes NextAuth's core handler to reissue the
// `next-auth.csrf-token` cookie as a side effect; when they land out of
// order, the cookie the credentials POST ends up sending doesn't match the
// token that same POST submits, and the login is silently rejected as a
// CSRF failure (no error surfaces — signIn() sees no error field, and the
// page just renders logged out). Verified this does not happen against a
// production build (`next build && next start`) run 5/5 times — it is a
// dev-server-only artifact of Strict Mode's double effect invocation
// racing NextAuth's per-request CSRF cookie reissuance, not an app bug.
// A one-time retry of the whole login is the correct, minimal mitigation
// for local/dev test runs; every real login test in this suite goes
// through this helper so that mitigation lives in exactly one place.
export async function loginViaUi(
  page: Page,
  creds: { email: string; password: string },
  options: {
    path?: string;
    expectedUrl?: string | RegExp;
    labels?: { email: string; password: string; submit: string };
  } = {},
): Promise<void> {
  const path = options.path ?? '/login';
  const expectedUrl = options.expectedUrl ?? '/';
  const labels = options.labels ?? { email: 'Email', password: 'Password', submit: 'Log in' };

  async function hasRealSession(): Promise<boolean> {
    const session = await page.evaluate(() => fetch('/api/auth/session').then((r) => r.json()));
    return Boolean(session?.user);
  }

  async function attempt(): Promise<boolean> {
    await page.goto(path);
    await waitForFormHydrated(page);
    await page.getByLabel(labels.email).fill(creds.email);
    // exact: true — a substring match on "Password" also picks up the
    // password-visibility toggle button (aria-label "Show/Hide password").
    await page.getByLabel(labels.password, { exact: true }).fill(creds.password);
    await page.getByRole('button', { name: labels.submit }).click();
    try {
      // Generous: on a freshly-started `next dev`, this whole chain
      // (session, providers, csrf, callback, destination re-render) can all
      // be first-hit compiles at once.
      await expect(page).toHaveURL(expectedUrl, { timeout: 20_000 });
    } catch {
      return false;
    }
    // toHaveURL alone isn't proof of a real session: the post-login
    // navigation is an unconditional hard redirect (see login/page.tsx), so
    // it still lands on the target URL even when the race above left the
    // session unset (a protected destination would itself then bounce to
    // /login, but "/" would not). Ask the server directly instead of
    // inferring auth state from rendered UI text, which has its own
    // ambiguous "still loading" render with neither state visible.
    try {
      await expect.poll(() => hasRealSession(), { timeout: 10_000 }).toBe(true);
    } catch {
      return false;
    }
    // The session is confirmed server-side at this point; reload so the
    // client (<SessionProvider>, which only refetches periodically/on
    // focus) reflects it immediately for whatever the caller asserts next,
    // rather than racing its own refetch timing.
    await page.reload();
    return true;
  }

  const ok = (await attempt()) || (await attempt());
  expect(ok, 'login failed twice in a row — this is not the known dev-mode CSRF race, investigate').toBe(true);
}

// For asserting a login is *rejected* (wrong password). The same dev-mode
// CSRF race described above can occasionally make the race itself — not
// the wrong password — decide the outcome: signIn() sees no recognizable
// error field and the app hard-navigates away as if it had succeeded. If
// that happens, this retries the whole attempt once instead of failing on
// an artifact of the known race.
export async function loginViaUiExpectingRejection(
  page: Page,
  creds: { email: string; password: string },
  errorText: string,
  labels: { email: string; password: string; submit: string } = { email: 'Email', password: 'Password', submit: 'Log in' },
): Promise<void> {
  async function attempt(): Promise<boolean> {
    await page.goto('/login');
    await waitForFormHydrated(page);
    await page.getByLabel(labels.email).fill(creds.email);
    await page.getByLabel(labels.password, { exact: true }).fill(creds.password);
    await page.getByRole('button', { name: labels.submit }).click();
    try {
      await expect(page.getByText(errorText)).toBeVisible({ timeout: 10_000 });
      return true;
    } catch {
      return false;
    }
  }

  const ok = (await attempt()) || (await attempt());
  expect(ok, 'rejection never appeared twice in a row — this is not the known dev-mode CSRF race, investigate').toBe(
    true,
  );
}

// Registers a brand-new account through the real UI and leaves the page
// signed in as it. For scenarios that need an account guaranteed to have no
// Stripe customer, subscription, invoices or donations — the shared demo
// member (member@example.dev) can't be used for that, since manual Stripe
// test-mode activity on it is expected and must never be reset by tests.
// A new user only gets a Stripe customer once it actually starts a checkout
// (billing.service getOrCreateStripeCustomer), so this account stays clean.
// Same flow as email-verification.spec.ts's registerFreshUser (kept there
// untouched); the account is left unverified, which none of the pages this
// is used for require.
export async function registerCleanUser(page: Page, label: string): Promise<{ email: string; password: string }> {
  const email = `e2e.${label}.${Date.now()}.${Math.random().toString(36).slice(2, 8)}@example.dev`;
  const password = 'PlaywrightPass123!';
  await page.goto('/register');
  await waitForRecaptchaToken(page);
  await page.getByLabel('Name').fill('Clean E2E User');
  await page.getByLabel('Email').fill(email);
  await page.getByLabel('Password', { exact: true }).fill(password);
  await solveMathChallenge(page);
  await ensureMinHumanFillTime(page);
  await page.getByRole('button', { name: 'Create account' }).click();
  await expect(page.getByRole('heading', { name: 'Check your email' })).toBeVisible({ timeout: 20_000 });
  await page.getByRole('link', { name: 'Continue to the app' }).click();
  await expect
    .poll(() => page.evaluate(() => fetch('/api/auth/session').then((r) => r.json())).then((s) => s?.user?.email))
    .toBe(email);
  return { email, password };
}
