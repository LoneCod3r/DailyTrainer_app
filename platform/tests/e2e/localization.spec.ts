// Deliberately imports straight from '@playwright/test' rather than
// ./fixtures/base — every other spec file pins the locale to English for
// readability, but this one exercises the real default (Bulgarian) and the
// switch itself, including logging in fully in Bulgarian.
import { test, expect } from '@playwright/test';
import { DEMO_USER } from './fixtures/data';
import { loginViaUi } from './fixtures/auth-helpers';
import { switchLanguage } from './fixtures/language-helpers';

test('BG (default) -> EN -> BG preserves route and authentication across reloads', async ({ page }) => {
  await page.goto('/');
  await expect(page.getByRole('heading', { name: 'Добре дошъл в твоето пространство' })).toBeVisible();

  // Log in fully in Bulgarian — proves the login flow itself is localized,
  // not just the chrome around it.
  await loginViaUi(page, DEMO_USER, { labels: { email: 'Имейл', password: 'Парола', submit: 'Вход' } });
  await expect(page.getByRole('button', { name: /demo member/i })).toBeVisible();

  // BG -> EN
  await switchLanguage(page, 'bg', 'en');
  await expect(page.getByRole('heading', { name: 'Welcome back, Demo' })).toBeVisible();

  await page.getByRole('navigation', { name: 'Main' }).getByRole('link', { name: 'Practices' }).click();
  await expect(page).toHaveURL('/practices');
  await expect(page.getByRole('heading', { name: 'Practices' })).toBeVisible();

  await page.reload();
  await expect(page).toHaveURL('/practices');
  await expect(page.getByRole('heading', { name: 'Practices' })).toBeVisible();
  await expect(page.getByRole('button', { name: /demo member/i })).toBeVisible(); // still authenticated

  // EN -> BG, same route
  await switchLanguage(page, 'en', 'bg');
  await expect(page.getByRole('heading', { name: 'Практики' })).toBeVisible();

  await page.reload();
  await expect(page).toHaveURL('/practices');
  await expect(page.getByRole('heading', { name: 'Практики' })).toBeVisible();
  await expect(page.getByRole('button', { name: /demo member/i })).toBeVisible(); // still authenticated
});
