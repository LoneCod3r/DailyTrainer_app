import type { Page } from '@playwright/test';
import { expect } from '@playwright/test';

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
    await page.getByLabel(labels.email).fill(creds.email);
    await page.getByLabel(labels.password).fill(creds.password);
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
    await page.getByLabel(labels.email).fill(creds.email);
    await page.getByLabel(labels.password).fill(creds.password);
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
