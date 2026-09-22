import { test, expect } from './fixtures/base';
import { registerCleanUser } from './fixtures/auth-helpers';
import { prisma } from '@/lib/prisma';

// Proves the session-revocation contract in lib/auth.ts end-to-end, through
// the real browser session — not just the unit-level jwt-callback coverage
// in tests/auth-callbacks.test.ts. A user who is signed in normally, then
// suspended by an admin/moderator while their browser session is still
// live, must lose access on their very next request: the jwt callback
// re-reads status from the DB on every session check (no `user` argument
// means a follow-up request reusing an already-issued JWT — see lib/auth.ts)
// and throws SESSION_REVOKED for a non-ACTIVE account, which the session
// route turns into "no session". No sign-out, no waiting for expiry: the
// existing JWT cookie is presented again unchanged, so this is a direct test
// of the DB-status check, not of cookie/token deletion.
test.describe('Session revocation for a suspended account', () => {
  test('a signed-in user is locked out immediately after their status changes to SUSPENDED', async ({ page }) => {
    // A dedicated, disposable account via the same real-UI registration flow
    // other specs use (registerCleanUser) — never the shared demo user,
    // which every other spec's storageState/login depends on. Registration
    // leaves the account ACTIVE and signed in (ptd_locale/session cookies
    // already set on `page`), so this is a normal authenticated session.
    const { email } = await registerCleanUser(page, 'suspend');

    try {
      // Sanity check: the freshly authenticated user really can reach a
      // protected route (same assertion shape as protected-routes.spec.ts).
      await page.goto('/account');
      await expect(page).toHaveURL('/account');
      await expect(page.getByRole('heading', { name: 'Account', exact: true })).toBeVisible();

      // Change account status directly in the database — simulating an
      // admin/moderator suspending the account (app/api/moderation/users/
      // [id]/status/route.ts) without going through that API, since this
      // spec is only exercising the revocation side of the contract. The
      // browser's session cookie is never touched.
      await prisma.user.update({ where: { email }, data: { status: 'SUSPENDED' } });

      // Same browser context, same (now stale) JWT cookie — no sign-out, no
      // re-login, no arbitrary wait. The jwt callback re-checks status on
      // this very request, so the redirect is deterministic rather than
      // timing-dependent.
      await page.goto('/account');
      await expect(page).toHaveURL(/\/login\?callbackUrl=\/account$/);
      await expect(page.getByRole('heading', { name: 'Welcome back' })).toBeVisible();

      // Observable sign the session itself was revoked (SESSION_REVOKED →
      // session route returns no user), not just that this one page
      // redirects — mirrors the hasRealSession() check loginViaUi uses to
      // confirm a real session server-side.
      const session = await page.evaluate(() => fetch('/api/auth/session').then((r) => r.json()));
      expect(session?.user).toBeUndefined();

      // A second protected route confirms this isn't specific to /account.
      await page.goto('/account/settings');
      await expect(page).toHaveURL(/\/login\?callbackUrl=\/account\/settings$/);
    } finally {
      // This spec is the only one that mutates a user row directly via
      // Prisma, so it's also the only one responsible for cleaning it up —
      // other specs' disposable e2e.* accounts are never suspended, so a
      // stale row among them carries no risk the way a SUSPENDED one would.
      await prisma.user.delete({ where: { email } }).catch(() => undefined);
    }
  });
});
