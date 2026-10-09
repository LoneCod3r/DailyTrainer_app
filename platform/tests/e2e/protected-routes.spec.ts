import { test, expect } from './fixtures/base';
import { AUTH_STORAGE_STATE } from './fixtures/data';

// Membership sales are closed in V1 (lib/features.ts) unless explicitly
// re-enabled. The old "browse plans / Join" behaviour is asserted only when
// they are open; the closed V1 behaviour is covered in membership-legacy.spec.ts.
const MEMBERSHIP_SALES_OPEN = process.env.NEXT_PUBLIC_FEATURE_MEMBERSHIP_SALES === 'true';

// /account/membership is deliberately NOT fully gated — the plans/pricing
// are publicly browsable, only joining a plan requires auth (see
// app/(app)/account/membership/page.tsx and payments.spec.ts). Everything
// else under /account fully redirects when unauthenticated.
const FULLY_PROTECTED_ROUTES: { path: string; heading: string }[] = [
  { path: '/account', heading: 'Account' },
  { path: '/account/settings', heading: 'Profile & Settings' },
  { path: '/account/billing', heading: 'Billing' },
  { path: '/account/donation', heading: 'Support KUKO WAY' },
];

test.describe('Protected routes — unauthenticated', () => {
  for (const { path } of FULLY_PROTECTED_ROUTES) {
    test(`@smoke ${path} redirects to login instead of showing protected data`, async ({ page }) => {
      await page.goto(path);
      await expect(page).toHaveURL(new RegExp(`/login\\?callbackUrl=${path}$`));
      await expect(page.getByRole('heading', { name: 'Welcome back' })).toBeVisible();
    });
  }

  test('/account/membership renders publicly (only joining a plan requires login)', async ({ page }) => {
    await page.goto('/account/membership');
    await expect(page).toHaveURL('/account/membership');
    // The page's own generic "Membership" header was intentionally removed
    // (see app/(app)/account/membership/page.tsx) — "Available plans" is
    // the stable heading that proves the real, public page rendered rather
    // than a redirect or protected/blocked state. With sales closed (V1) the
    // page renders its calm "not offered" notice instead.
    await expect(
      page.getByRole('heading', {
        name: MEMBERSHIP_SALES_OPEN ? 'Available plans' : 'Membership isn’t offered at the moment',
        exact: true,
      }),
    ).toBeVisible();
  });
});

test.describe('Admin users page — unauthenticated', () => {
  test('/admin/users redirects to login without a server-side TypeError', async ({ page, request }) => {
    const res = await request.get('/admin/users', { maxRedirects: 0 });
    expect(res.status()).toBe(307);
    expect(res.headers()['location']).toMatch(/^\/login\?callbackUrl=/);
    // Previously the page read session!.user.id with a null session.
    expect(await res.text()).not.toContain('Cannot read properties of null');

    await page.goto('/admin/users');
    await expect(page).toHaveURL(/\/login\?callbackUrl=/);
  });
});

test.describe('Admin pages — unauthenticated', () => {
  for (const path of ['/admin', '/admin/membership', '/admin/settings']) {
    test(`${path} redirects to login before rendering admin data`, async ({ request }) => {
      const res = await request.get(path, { maxRedirects: 0 });
      expect(res.status()).toBe(307);
      expect(res.headers()['location']).toMatch(/^\/login\?callbackUrl=/);
    });
  }
});

test.describe('Protected routes — authenticated', () => {
  test.use({ storageState: AUTH_STORAGE_STATE });

  for (const { path, heading } of FULLY_PROTECTED_ROUTES) {
    test(`${path} loads normally for a signed-in user`, async ({ page }) => {
      await page.goto(path);
      await expect(page).toHaveURL(path);
      await expect(page.getByRole('heading', { name: heading, exact: true })).toBeVisible();
    });
  }
});
