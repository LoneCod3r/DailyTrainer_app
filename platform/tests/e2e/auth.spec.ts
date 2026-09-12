import { test, expect } from './fixtures/base';
import { AUTH_STORAGE_STATE, DEMO_USER } from './fixtures/data';
import {
  loginViaUi,
  loginViaUiExpectingRejection,
  waitForRecaptchaToken,
  solveMathChallenge,
  ensureMinHumanFillTime,
} from './fixtures/auth-helpers';

test.describe('Register', () => {
  test('@smoke register page loads, validates, and a new account signs in', async ({ page }) => {
    await page.goto('/register');
    await expect(page.getByRole('heading', { name: 'Create your account' })).toBeVisible();

    // HTML5 required-field validation blocks submission with an empty form.
    await page.getByRole('button', { name: 'Create account' }).click();
    await expect(page).toHaveURL('/register');

    const uniqueEmail = `e2e.register.${Date.now()}@example.dev`;
    const password = 'PlaywrightPass123!';
    // Wait for the CAPTCHA (and the hydration it implies — see
    // email-verification.spec.ts's registerFreshUser) before filling, so a
    // fill during hydration can't get silently reset to empty.
    await waitForRecaptchaToken(page);
    await page.getByLabel('Name').fill('Playwright Test User');
    await page.getByLabel('Email').fill(uniqueEmail);
    await page.getByLabel('Password', { exact: true }).fill(password);
    await solveMathChallenge(page);
    await ensureMinHumanFillTime(page);
    await page.getByRole('button', { name: 'Create account' }).click();

    // Registration no longer auto-navigates straight to "/" — it shows a
    // "check your email" state first (the account is unverified until the
    // link is clicked) with a link to continue into the app right away.
    await expect(page.getByRole('heading', { name: 'Check your email' })).toBeVisible({ timeout: 20_000 });
    await expect(page.getByText(uniqueEmail)).toBeVisible();
    await page.getByRole('link', { name: 'Continue to the app' }).click();
    // Wait for this click's own navigation to settle before checking
    // sign-in state below — otherwise the fallback loginViaUi's page.goto
    // can race an in-flight navigation from the click and get interrupted.
    await page.waitForURL('/', { timeout: 10_000 }).catch(() => {});

    // The account now exists either way; if the post-register auto-signin
    // hit the same known dev-mode race described in fixtures/auth-helpers.ts,
    // fall back to a normal login with the credentials just created.
    const signedIn = await page
      .getByRole('button', { name: /playwright test user/i })
      .isVisible()
      .catch(() => false);
    if (!signedIn) {
      await loginViaUi(page, { email: uniqueEmail, password });
    }
    await expect(page.getByRole('button', { name: /playwright test user/i })).toBeVisible();

    // Unverified but signed in: the persistent verification banner should
    // be visible somewhere on the page.
    await expect(page.getByText('Please verify your email address to unlock all features.')).toBeVisible();
  });
});

test.describe('Login', () => {
  test('@smoke login page loads and rejects invalid credentials', async ({ page }) => {
    await page.goto('/login');
    await expect(page.getByRole('heading', { name: 'Welcome back' })).toBeVisible();

    await loginViaUiExpectingRejection(
      page,
      { email: DEMO_USER.email, password: 'the-wrong-password' },
      'Invalid email or password.',
    );
    await expect(page).toHaveURL('/login');
  });

  test('successful login redirects home with authenticated navigation', async ({ page }) => {
    await loginViaUi(page, DEMO_USER);
    await expect(page.getByRole('button', { name: /demo member/i })).toBeVisible();
  });

  test('respects a callbackUrl after login', async ({ page }) => {
    await loginViaUi(page, DEMO_USER, {
      path: '/login?callbackUrl=/account/settings',
      expectedUrl: '/account/settings',
    });
  });
});

test.describe('Logout', () => {
  test.use({ storageState: AUTH_STORAGE_STATE });

  test('signs out and blocks protected routes again', async ({ page }) => {
    await page.goto('/');
    await page.getByRole('button', { name: /demo member/i }).click();
    await page.getByRole('button', { name: 'Sign out' }).click();

    await expect(page).toHaveURL('/');
    await expect(page.getByRole('link', { name: 'Log in' })).toBeVisible();

    await page.goto('/account');
    await expect(page).toHaveURL(/\/login/);
  });
});
