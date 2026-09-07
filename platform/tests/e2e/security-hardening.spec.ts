import { test, expect } from './fixtures/base';
import { waitForRecaptchaToken, solveMathChallenge, ensureMinHumanFillTime } from './fixtures/auth-helpers';

// Fetches a real challenge and solves it, for tests that need a *valid* one
// so they isolate the specific thing they're actually testing (e.g. a
// missing CAPTCHA token) rather than incidentally failing on the math
// challenge too.
async function getSolvedMathChallenge(page: import('@playwright/test').Page) {
  const res = await page.request.post('/api/auth/math-challenge');
  const { challengeId, question } = await res.json();
  const [a, b] = question.split(' + ').map(Number);
  return { mathChallengeId: challengeId, mathAnswer: a + b };
}

test.describe('Registration bot defenses (server-enforced)', () => {
  test('registering without a CAPTCHA token is rejected by the API, not just the UI', async ({ page }) => {
    // The register page itself disables submission until a token is
    // present (app/(auth)/register/page.tsx) — this proves the server
    // enforces it independently of that client-side affordance, per
    // requirement: "must be validated server-side, not only on the client".
    const math = await getSolvedMathChallenge(page);
    const res = await page.request.post('/api/auth/register', {
      data: {
        name: 'No Captcha User',
        email: `e2e.nocaptcha.${Date.now()}@example.dev`,
        password: 'PlaywrightPass123!',
        ...math,
      },
    });
    expect(res.status()).toBe(400);
  });

  test('a filled honeypot field silently rejects the submission', async ({ page }) => {
    const res = await page.request.post('/api/auth/register', {
      data: {
        name: 'Honeypot Bot',
        email: `e2e.honeypot.${Date.now()}@example.dev`,
        password: 'PlaywrightPass123!',
        captchaToken: 'irrelevant-because-honeypot-checked-first',
        mathChallengeId: 'irrelevant-because-honeypot-checked-first',
        mathAnswer: 0,
        website: 'https://spam.example.com',
      },
    });
    expect(res.status()).toBe(400);
  });

  test('registering without answering the math challenge is rejected by the API, not just the UI', async ({ page }) => {
    const res = await page.request.post('/api/auth/register', {
      data: {
        name: 'No Math Answer User',
        email: `e2e.nomath.${Date.now()}@example.dev`,
        password: 'PlaywrightPass123!',
        captchaToken: 'irrelevant-because-schema-validation-runs-first',
      },
    });
    expect(res.status()).toBe(400);
  });

  test('an incorrect math challenge answer is rejected, and the challenge cannot then be reused with the right one', async ({
    page,
  }) => {
    const challengeRes = await page.request.post('/api/auth/math-challenge');
    const { challengeId, question } = await challengeRes.json();
    const [a, b] = question.split(' + ').map(Number);
    const correctAnswer = a + b;

    const wrongRes = await page.request.post('/api/auth/register', {
      data: {
        name: 'Wrong Answer User',
        email: `e2e.mathwrong.${Date.now()}@example.dev`,
        password: 'PlaywrightPass123!',
        captchaToken: 'e2e-test-recaptcha-token',
        mathChallengeId: challengeId,
        mathAnswer: correctAnswer + 1,
      },
    });
    expect(wrongRes.status()).toBe(400);

    // A fresh registration with the CORRECT answer to the SAME challenge id
    // should succeed the first time...
    const rightRes = await page.request.post('/api/auth/register', {
      data: {
        name: 'Right Answer User',
        email: `e2e.mathright.${Date.now()}@example.dev`,
        password: 'PlaywrightPass123!',
        captchaToken: 'e2e-test-recaptcha-token',
        mathChallengeId: challengeId,
        mathAnswer: correctAnswer,
      },
    });
    expect(rightRes.status()).toBe(201);

    // ...but the same (now-consumed) challenge id can't be used again, even
    // with a different email and the right answer.
    const reuseRes = await page.request.post('/api/auth/register', {
      data: {
        name: 'Reuse Attempt User',
        email: `e2e.mathreuse.${Date.now()}@example.dev`,
        password: 'PlaywrightPass123!',
        captchaToken: 'e2e-test-recaptcha-token',
        mathChallengeId: challengeId,
        mathAnswer: correctAnswer,
      },
    });
    expect(reuseRes.status()).toBe(400);
  });
});

test.describe('Login brute-force protection', () => {
  test('an account locks out after repeated failed password attempts', async ({ page }) => {
    // A dedicated throwaway account, not the shared demo user other specs
    // depend on via storageState — locking DEMO_USER here would break
    // every other test that logs in through the UI later in the run.
    const email = `e2e.lockout.${Date.now()}@example.dev`;
    const password = 'PlaywrightPass123!';

    await page.goto('/register');
    // See email-verification.spec.ts's registerFreshUser for why fills
    // happen after the CAPTCHA (hydration) wait, not before.
    await waitForRecaptchaToken(page);
    await page.getByLabel('Name').fill('Lockout Test User');
    await page.getByLabel('Email').fill(email);
    await page.getByLabel('Password').fill(password);
    await solveMathChallenge(page);
    await ensureMinHumanFillTime(page);
    await page.getByRole('button', { name: 'Create account' }).click();
    await expect(page.getByRole('heading', { name: 'Check your email' })).toBeVisible({ timeout: 20_000 });

    for (let i = 0; i < 5; i++) {
      await page.goto('/login');
      await page.getByLabel('Email').fill(email);
      await page.getByLabel('Password').fill('the-wrong-password');
      await page.getByRole('button', { name: 'Log in' }).click();
      await expect(page.getByText('Invalid email or password.')).toBeVisible();
    }

    // Even the *correct* password is now refused — the account is locked,
    // not just this one bad password.
    await page.goto('/login');
    await page.getByLabel('Email').fill(email);
    await page.getByLabel('Password').fill(password);
    await page.getByRole('button', { name: 'Log in' }).click();
    await expect(page.getByText(/temporarily locked/i)).toBeVisible();
  });
});

test.describe('Verification resend rate limiting', () => {
  test('repeated resend requests for the same address are eventually rate limited', async ({ page }) => {
    const email = `e2e.resendlimit.${Date.now()}@example.dev`;

    const results: number[] = [];
    for (let i = 0; i < 4; i++) {
      const res = await page.request.post('/api/auth/verify-email/resend', { data: { email } });
      results.push(res.status());
    }

    // The endpoint allows 3 resends per hour per address (see
    // modules/auth/auth.service.ts resendVerificationEmail) — the 4th
    // should be rejected. It always returns 200 regardless of whether the
    // address exists, so a non-200 here can only be the rate limit.
    expect(results.slice(0, 3).every((status) => status === 200)).toBe(true);
    expect(results[3]).toBe(429);
  });
});
