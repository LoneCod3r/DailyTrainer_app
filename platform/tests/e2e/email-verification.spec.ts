import { test, expect } from './fixtures/base';
import { waitForRecaptchaToken, solveMathChallenge, ensureMinHumanFillTime } from './fixtures/auth-helpers';
import { waitForToken } from './fixtures/mail-helpers';

// Registers a fresh, unverified account through the real UI (CAPTCHA
// included) and returns its credentials. Each test gets its own account so
// verification-token state (used/unused) never leaks between tests.
async function registerFreshUser(page: import('@playwright/test').Page) {
  const email = `e2e.verify.${Date.now()}.${Math.random().toString(36).slice(2, 8)}@example.dev`;
  const password = 'PlaywrightPass123!';
  await page.goto('/register');
  // Wait for the CAPTCHA widget (and therefore React hydration — the submit
  // button only becomes enabled once hydrated JS has run) *before* filling
  // fields: filling first can race Next.js hydration and get silently
  // reset to empty (a known `next dev`-only SSR hydration gotcha, not
  // browser-specific — see fixtures/auth-helpers.ts for the sibling CSRF
  // race this suite already works around the same way).
  await waitForRecaptchaToken(page);
  await page.getByLabel('Name').fill('Verify Flow User');
  await page.getByLabel('Email').fill(email);
  await page.getByLabel('Password').fill(password);
  await solveMathChallenge(page);
  await ensureMinHumanFillTime(page);
  await page.getByRole('button', { name: 'Create account' }).click();
  await expect(page.getByRole('heading', { name: 'Check your email' })).toBeVisible({ timeout: 20_000 });
  return { email, password };
}

test.describe('Email verification', () => {
  test('@smoke a fresh account can verify via the emailed link', async ({ page }) => {
    const { email } = await registerFreshUser(page);
    const token = await waitForToken(email);

    await page.goto(`/verify-email?token=${encodeURIComponent(token)}`);
    await expect(page.getByRole('heading', { name: 'Email verified' })).toBeVisible();

    // The persistent "please verify" banner should be gone once verified.
    await page.getByRole('link', { name: 'Continue to the app' }).click();
    await expect(page.getByText('Please verify your email address to unlock all features.')).toHaveCount(0);
  });

  test('a reused verification link is rejected the second time', async ({ page }) => {
    const { email } = await registerFreshUser(page);
    const token = await waitForToken(email);

    await page.goto(`/verify-email?token=${encodeURIComponent(token)}`);
    await expect(page.getByRole('heading', { name: 'Email verified' })).toBeVisible();

    await page.goto(`/verify-email?token=${encodeURIComponent(token)}`);
    await expect(page.getByRole('heading', { name: 'Invalid link' })).toBeVisible();
  });

  test('an invalid/garbage verification token shows the invalid state', async ({ page }) => {
    await page.goto('/verify-email?token=not-a-real-token-at-all');
    await expect(page.getByRole('heading', { name: 'Invalid link' })).toBeVisible();
    // The invalid state offers a way to request a fresh link.
    await expect(page.getByRole('button', { name: 'Resend verification email' })).toBeVisible();
  });

  test('resending verification issues a new, independently-valid link', async ({ page }) => {
    const { email } = await registerFreshUser(page);
    const firstToken = await waitForToken(email);

    const res = await page.request.post('/api/auth/verify-email/resend', { data: { email } });
    expect(res.ok()).toBe(true);

    const secondToken = await waitForToken(email);
    expect(secondToken).not.toBe(firstToken);

    // The earlier token was invalidated by the resend (see
    // modules/auth/auth.service.ts issueVerificationEmail).
    const oldRes = await page.request.post('/api/auth/verify-email', { data: { token: firstToken } });
    expect(oldRes.status()).toBe(400);

    const newRes = await page.request.post('/api/auth/verify-email', { data: { token: secondToken } });
    expect(newRes.ok()).toBe(true);
  });
});

test.describe('Unverified accounts are restricted server-side', () => {
  test('an unverified, signed-in user cannot create a discussion via a direct API request', async ({ page }) => {
    const { email } = await registerFreshUser(page);
    await page.getByRole('link', { name: 'Continue to the app' }).click();

    // Confirm we really do have a session before asserting the API refuses it.
    const session = await page.evaluate(() => fetch('/api/auth/session').then((r) => r.json()));
    expect(session?.user?.email).toBe(email);

    const res = await page.request.post('/api/discussions', {
      data: { title: 'Bypass attempt title', body: 'Trying to post while unverified.', category: 'GENERAL' },
    });
    expect(res.status()).toBe(403);
    const body = await res.json();
    expect(body.error.code).toBe('EMAIL_NOT_VERIFIED');

    // Same for updating the profile — another member action gated on
    // verification (see app/api/profiles/me/route.ts).
    const profileRes = await page.request.patch('/api/profiles/me', { data: { bio: 'Trying to sneak this in.' } });
    expect(profileRes.status()).toBe(403);
  });
});
