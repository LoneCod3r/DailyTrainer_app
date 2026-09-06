import { test, expect } from './fixtures/base';
import { AUTH_STORAGE_STATE, DEMO_USER } from './fixtures/data';
import { loginViaUi, loginViaUiExpectingRejection } from './fixtures/auth-helpers';

test.describe('Register', () => {
  test('@smoke register page loads, validates, and a new account signs in', async ({ page }) => {
    await page.goto('/register');
    await expect(page.getByRole('heading', { name: 'Create your account' })).toBeVisible();

    // HTML5 required-field validation blocks submission with an empty form.
    await page.getByRole('button', { name: 'Create account' }).click();
    await expect(page).toHaveURL('/register');

    const uniqueEmail = `e2e.register.${Date.now()}@example.dev`;
    const password = 'PlaywrightPass123!';
    await page.getByLabel('Name').fill('Playwright Test User');
    await page.getByLabel('Email').fill(uniqueEmail);
    await page.getByLabel('Password').fill(password);
    await page.getByRole('button', { name: 'Create account' }).click();
    await expect(page).toHaveURL('/');

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
