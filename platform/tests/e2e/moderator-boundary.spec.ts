import { test, expect } from './fixtures/base';
import { MODERATOR_USER, ADMIN_USER } from './fixtures/data';
import { loginViaUi } from './fixtures/auth-helpers';

// Final Moderator permission audit (server-side enforcement, not just hidden
// UI): a Moderator = normal community capabilities + moderation tools, and
// must never reach Admin or financial/admin-only surfaces — even by typing
// the URL or calling the API directly. See lib/permissions.ts / lib/auth-guards.ts.
test.describe('Moderator permission boundary', () => {
  test.beforeEach(async ({ page }) => {
    // Moderator login redirects to /moderation, not / (see app/(auth)/login/page.tsx).
    await loginViaUi(page, MODERATOR_USER, { expectedUrl: '/moderation' });
  });

  test('@smoke Moderator is redirected away from /admin (server-side, app/admin/layout.tsx)', async ({ page }) => {
    await page.goto('/admin');
    await expect(page).toHaveURL('/');
  });

  for (const path of ['/admin/users', '/admin/settings', '/admin/membership']) {
    test(`Moderator is redirected away from ${path}`, async ({ page }) => {
      await page.goto(path);
      await expect(page).toHaveURL('/');
    });
  }

  test('Moderator API calls to Admin-only endpoints are rejected 403, not just hidden in the UI', async ({ page }) => {
    const statsRes = await page.request.get('/api/admin/stats');
    expect(statsRes.status()).toBe(403);

    const usersRes = await page.request.get('/api/users');
    expect(usersRes.status()).toBe(403);

    const settingsRes = await page.request.patch('/api/settings', { data: { appName: 'Hacked' } });
    expect(settingsRes.status()).toBe(403);

    const plansRes = await page.request.post('/api/admin/membership-plans', {
      data: { name: 'x', amount: 100, currency: 'usd', interval: 'month' },
    });
    expect(plansRes.status()).toBe(403);
  });

  test('@smoke Moderator can reach the Moderation area', async ({ page }) => {
    await page.goto('/moderation');
    await expect(page).toHaveURL('/moderation');
    await expect(page.getByRole('heading', { name: /good (morning|afternoon|evening), Demo Moderator/i })).toBeVisible();

    for (const path of ['/moderation/reports', '/moderation/discussions', '/moderation/users', '/moderation/history']) {
      await page.goto(path);
      await expect(page).toHaveURL(path);
    }
  });

  test('Moderator can reach their own Account/Profile hub (non-financial self-service)', async ({ page }) => {
    await page.goto('/account');
    await expect(page).toHaveURL('/account');
    await page.goto('/account/settings');
    await expect(page).toHaveURL('/account/settings');
  });

  // Moderator is project/community staff, not a customer (see
  // lib/permissions.ts's isModeratorOnly) — never gets the normal-customer
  // Billing/Membership/Donation self-service surface, even by typing the URL
  // directly. Each of these pages redirects to /account server-side
  // (app/(app)/account/{billing,membership,donation}/page.tsx).
  for (const path of ['/account/billing', '/account/membership', '/account/donation']) {
    test(`Moderator is redirected away from ${path} (financial self-service)`, async ({ page }) => {
      await page.goto(path);
      await expect(page).toHaveURL('/account');
    });
  }

  test('Moderator financial-API calls are rejected 403, not just hidden in the UI', async ({ page }) => {
    const subscribeRes = await page.request.post('/api/membership/subscribe', {
      data: { membershipPlanId: 'does-not-matter' },
    });
    expect(subscribeRes.status()).toBe(403);

    const portalRes = await page.request.post('/api/membership/portal');
    expect(portalRes.status()).toBe(403);

    const donationRes = await page.request.post('/api/donations/checkout', {
      data: { amount: 500, currency: 'usd' },
    });
    expect(donationRes.status()).toBe(403);
  });

  test('Moderator does not see Admin or financial links in the profile menu, only Moderation and their profile', async ({
    page,
  }) => {
    await page.goto('/');
    await page.getByRole('button', { name: /demo moderator/i }).click();
    await expect(page.getByRole('link', { name: /moderation/i })).toBeVisible();
    await expect(page.getByRole('link', { name: 'Profile & Settings' })).toBeVisible();
    await expect(page.getByRole('link', { name: /^admin$/i })).toHaveCount(0);
    await expect(page.getByRole('link', { name: /membership/i })).toHaveCount(0);
    await expect(page.getByRole('link', { name: /billing/i })).toHaveCount(0);
    await expect(page.getByRole('link', { name: /donation/i })).toHaveCount(0);
    await expect(page.getByRole('link', { name: 'Support', exact: true })).toHaveCount(0);
  });

  test('Moderator account hub does not render Membership/Billing/Donation cards', async ({ page }) => {
    await page.goto('/account');
    await expect(page.getByRole('link', { name: /profile.*settings/i })).toBeVisible();
    await expect(page.getByRole('heading', { name: 'Membership', exact: true })).toHaveCount(0);
    await expect(page.getByRole('heading', { name: 'Billing', exact: true })).toHaveCount(0);
    await expect(page.getByRole('heading', { name: 'Donation', exact: true })).toHaveCount(0);
  });
});

// Regression coverage: the Moderator financial restriction above must never
// leak onto Admin — Admin keeps full, unrestricted financial/admin access
// (lib/auth-guards.ts's forbidModeratorFinancialAccess is an exact-role
// check on 'MODERATOR' only).
test.describe('Admin financial/admin access (regression)', () => {
  test.beforeEach(async ({ page }) => {
    await loginViaUi(page, ADMIN_USER, { expectedUrl: '/admin' });
  });

  test('Admin can reach /admin, /admin/membership and /admin/settings', async ({ page }) => {
    await expect(page).toHaveURL('/admin');
    await page.goto('/admin/membership');
    await expect(page).toHaveURL('/admin/membership');
    await page.goto('/admin/settings');
    await expect(page).toHaveURL('/admin/settings');
  });

  test('Admin can load /admin/users and the users table renders', async ({ page }) => {
    await page.goto('/admin/users');
    await expect(page).toHaveURL('/admin/users');
    await expect(page.getByRole('heading', { name: 'Users', exact: true })).toBeVisible();
    await expect(page.getByRole('columnheader', { name: 'Email' })).toBeVisible();
    await expect(page.getByRole('row').nth(1)).toBeVisible(); // header + at least one member row
  });

  test('Admin API calls to Admin-only endpoints succeed (200), not 403', async ({ page }) => {
    const statsRes = await page.request.get('/api/admin/stats');
    expect(statsRes.status()).toBe(200);

    const plansRes = await page.request.get('/api/admin/membership-plans');
    expect(plansRes.status()).toBe(200);
  });

  test('Admin financial self-service API calls are not blocked by the Moderator guard', async ({ page }) => {
    // These still fail (no seeded plan / Stripe unconfigured in this dev
    // env), but never with 403 — proving forbidModeratorFinancialAccess
    // does not apply to Admin. The Moderator equivalent test above asserts
    // 403 specifically, which is the behavior under test here.
    const subscribeRes = await page.request.post('/api/membership/subscribe', {
      data: { membershipPlanId: 'does-not-matter' },
    });
    expect(subscribeRes.status()).not.toBe(403);

    const portalRes = await page.request.post('/api/membership/portal');
    expect(portalRes.status()).not.toBe(403);

    const donationRes = await page.request.post('/api/donations/checkout', {
      data: { amount: 500, currency: 'usd' },
    });
    expect(donationRes.status()).not.toBe(403);
  });
});
