import path from 'path';
import { test as setup, expect } from '@playwright/test';
import { DEMO_USER, AUTH_STORAGE_STATE } from './data';
import { loginViaUi } from './auth-helpers';

// Logs in once, as the seeded `member@example.dev` demo account (see
// prisma/seed.ts — a documented, dev-only account, not a real credential),
// and reuses the resulting session via storageState across every spec that
// needs an authenticated identity. This is the standard Playwright
// auth-setup pattern, and avoids re-running the login UI flow (and NextAuth
// JWT issuance) once per test. See auth-helpers.ts for why the login itself
// retries once (a known, diagnosed `next dev`-only race, not an app bug).
const authFile = path.join(__dirname, '../.auth/member.json');

setup('authenticate as demo member', async ({ page, context }) => {
  // This is the first test to run, so it's the one that pays the cost of
  // `next dev` compiling every auth-related route on its first hit —
  // give it more room than the suite's default.
  setup.setTimeout(90_000);
  await context.addCookies([{ name: 'ptd_locale', value: 'en', url: 'http://localhost:3000' }]);

  await loginViaUi(page, DEMO_USER);
  await expect(page.getByRole('button', { name: /demo member/i })).toBeVisible();

  await page.context().storageState({ path: authFile });
});

export { AUTH_STORAGE_STATE };
