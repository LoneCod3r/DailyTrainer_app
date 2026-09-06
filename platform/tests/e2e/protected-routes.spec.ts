import { test, expect } from './fixtures/base';
import { AUTH_STORAGE_STATE } from './fixtures/data';

// /account/membership is deliberately NOT fully gated — the plans/pricing
// are publicly browsable, only joining a plan requires auth (see
// app/(app)/account/membership/page.tsx and payments.spec.ts). Everything
// else under /account fully redirects when unauthenticated.
const FULLY_PROTECTED_ROUTES: { path: string; heading: string }[] = [
  { path: '/account', heading: 'Account' },
  { path: '/account/settings', heading: 'Profile & Settings' },
  { path: '/account/billing', heading: 'Billing' },
  { path: '/account/donation', heading: 'Donation' },
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
    await expect(page.getByRole('heading', { name: 'Membership', exact: true })).toBeVisible();
  });
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
