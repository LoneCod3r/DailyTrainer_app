import bcrypt from 'bcryptjs';
import { test, expect } from './fixtures/base';
import { loginViaUi, loginViaUiExpectingRejection } from './fixtures/auth-helpers';
import { consentCookie } from './fixtures/consent-helpers';
import { prisma } from '@/lib/prisma';

// Change password from Profile & Settings, through the real form, API, login
// and session handling. A disposable, already-verified account is created
// directly in the database (no registration flow, so no CAPTCHA/SMTP
// dependency) and deleted afterwards — never the shared demo user, whose
// password every other spec relies on.
const OLD_PASSWORD = 'e2e-old-password-1';
const NEW_PASSWORD = 'e2e-new-password-2';

test.describe('Change password', () => {
  let email: string;

  test.beforeEach(async () => {
    email = `e2e.changepw.${Date.now()}.${Math.floor(Math.random() * 1e6)}@example.dev`;
    await prisma.user.create({
      data: {
        email,
        name: 'E2E Change Password',
        passwordHash: await bcrypt.hash(OLD_PASSWORD, 10),
        emailVerified: new Date(),
      },
    });
  });

  test.afterEach(async () => {
    await prisma.user.delete({ where: { email } }).catch(() => undefined);
  });

  test('validates input, changes the password, keeps this device signed in and signs out other devices', async ({
    page,
    browser,
    baseURL,
  }) => {
    // A second, independent session for the same account ("another device").
    const otherContext = await browser.newContext();
    await otherContext.addCookies([{ name: 'ptd_locale', value: 'en', url: baseURL! }, consentCookie(baseURL!)]);
    const otherDevice = await otherContext.newPage();

    try {
      await loginViaUi(otherDevice, { email, password: OLD_PASSWORD });
      await loginViaUi(page, { email, password: OLD_PASSWORD });

      await page.goto('/account/settings');
      await expect(page.getByRole('heading', { name: 'Change password' })).toBeVisible();
      const form = page.getByTestId('change-password-form');
      const current = form.getByLabel('Current password', { exact: true });
      const next = form.getByLabel('New password', { exact: true });
      const confirm = form.getByLabel('Confirm new password', { exact: true });
      const submit = form.getByRole('button', { name: 'Change password' });

      // Wrong current password — rejected by the server.
      await current.fill('not-my-password');
      await next.fill(NEW_PASSWORD);
      await confirm.fill(NEW_PASSWORD);
      await submit.click();
      await expect(form.getByText('Your current password is incorrect.')).toBeVisible();

      // Mismatched confirmation.
      await current.fill(OLD_PASSWORD);
      await confirm.fill('something-else-123');
      await submit.click();
      await expect(form.getByText('The new passwords do not match.')).toBeVisible();

      // Too short (registration rule: at least 8 characters).
      await next.fill('short');
      await confirm.fill('short');
      await submit.click();
      await expect(form.getByText('The new password must be at least 8 characters.')).toBeVisible();

      // Same as the current password.
      await next.fill(OLD_PASSWORD);
      await confirm.fill(OLD_PASSWORD);
      await submit.click();
      await expect(form.getByText('The new password must be different from your current password.')).toBeVisible();

      // Valid change.
      await next.fill(NEW_PASSWORD);
      await confirm.fill(NEW_PASSWORD);
      await submit.click();
      await expect(form.getByText('Your password has been changed.')).toBeVisible({ timeout: 20_000 });

      // This device stays signed in (the form re-signs in with the new password).
      await page.goto('/account/settings');
      await expect(page).toHaveURL('/account/settings');
      const session = await page.evaluate(() => fetch('/api/auth/session').then((r) => r.json()));
      expect(session?.user?.email).toBe(email);

      // The other device's session was issued under the old password: revoked.
      await otherDevice.goto('/account');
      await expect(otherDevice).toHaveURL(/\/login\?callbackUrl=\/account$/);
    } finally {
      await otherContext.close();
    }
  });

  test('after a change, the old password no longer logs in and the new one does', async ({ page, browser, baseURL }) => {
    await loginViaUi(page, { email, password: OLD_PASSWORD });
    const res = await page.evaluate(
      ([currentPassword, newPassword]) =>
        fetch('/api/account/password', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ currentPassword, newPassword, confirmPassword: newPassword }),
        }).then((r) => r.status),
      [OLD_PASSWORD, NEW_PASSWORD],
    );
    expect(res).toBe(200);

    const fresh = await browser.newContext();
    await fresh.addCookies([{ name: 'ptd_locale', value: 'en', url: baseURL! }, consentCookie(baseURL!)]);
    const loginPage = await fresh.newPage();
    try {
      await loginViaUiExpectingRejection(loginPage, { email, password: OLD_PASSWORD }, 'Invalid email or password.');
      await loginViaUi(loginPage, { email, password: NEW_PASSWORD });
    } finally {
      await fresh.close();
    }
  });
});
