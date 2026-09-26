import { test, expect } from './fixtures/base';
import { loginViaUi } from './fixtures/auth-helpers';
import { DEMO_USER } from './fixtures/data';

// Regression for an open redirect: app/(auth)/login/page.tsx used to hand
// ?callbackUrl= straight to window.location.href. Internal paths must keep
// working; anything else must fall back to the normal role-based landing page
// ("/" for a regular member). The full validation matrix lives in
// tests/safe-redirect.test.ts — these prove the page actually uses it.
function loginPath(callbackUrl: string) {
  return `/login?callbackUrl=${encodeURIComponent(callbackUrl)}`;
}

test.describe('Login callbackUrl only redirects to internal paths', () => {
  test('a valid internal callbackUrl is honoured', async ({ page }) => {
    await loginViaUi(page, DEMO_USER, { path: loginPath('/practices'), expectedUrl: '/practices' });
  });

  for (const [label, callbackUrl] of [
    ['an external URL', 'https://evil.example/phish'],
    ['a protocol-relative URL', '//evil.example'],
    ['a backslash bypass', '/\\evil.example'],
  ]) {
    test(`@smoke ${label} falls back to the default destination`, async ({ page, baseURL }) => {
      await loginViaUi(page, DEMO_USER, { path: loginPath(callbackUrl), expectedUrl: '/' });
      expect(new URL(page.url()).origin).toBe(new URL(baseURL!).origin);
    });
  }

  test('a javascript: callbackUrl is not executed and falls back to the default destination', async ({ page }) => {
    let dialogOpened = false;
    page.on('dialog', async (dialog) => {
      dialogOpened = true;
      await dialog.dismiss();
    });
    await loginViaUi(page, DEMO_USER, { path: loginPath('javascript:alert(document.domain)'), expectedUrl: '/' });
    expect(dialogOpened).toBe(false);
  });
});
