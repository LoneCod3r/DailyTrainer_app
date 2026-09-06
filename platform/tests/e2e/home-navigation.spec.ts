import { test, expect } from './fixtures/base';

test.describe('Home / public navigation', () => {
  test('@smoke home loads with visible primary navigation', async ({ page }) => {
    await page.goto('/');
    await expect(page).toHaveTitle(/KUKO WAY/);
    await expect(page.getByRole('heading', { name: 'Welcome to your space' })).toBeVisible();

    const nav = page.getByRole('navigation', { name: 'Main' });
    await expect(nav).toBeVisible();
    await expect(nav.getByRole('link', { name: 'Home' })).toBeVisible();
    await expect(nav.getByRole('link', { name: 'Practices' })).toBeVisible();
    await expect(nav.getByRole('link', { name: 'Community' })).toBeVisible();
  });

  test('practices navigation works', async ({ page }) => {
    await page.goto('/');
    await page.getByRole('navigation', { name: 'Main' }).getByRole('link', { name: 'Practices' }).click();
    await expect(page).toHaveURL('/practices');
    await expect(page.getByRole('heading', { name: 'Practices' })).toBeVisible();
  });

  test('community navigation works', async ({ page }) => {
    await page.goto('/');
    await page.getByRole('navigation', { name: 'Main' }).getByRole('link', { name: 'Community' }).click();
    await expect(page).toHaveURL('/community');
    await expect(page.getByRole('heading', { name: 'Community' })).toBeVisible();
  });

  test('theme toggle switches between light and dark', async ({ page }) => {
    await page.goto('/');
    const toggle = page.getByRole('button', { name: 'Switch to dark mode' });
    await expect(toggle).toBeVisible();

    const bgBefore = await page.evaluate(() => getComputedStyle(document.body).backgroundColor);
    await toggle.click();

    const darkToggle = page.getByRole('button', { name: 'Switch to light mode' });
    await expect(darkToggle).toBeVisible();
    await expect(page.locator('html')).toHaveClass(/dark/);

    const bgAfter = await page.evaluate(() => getComputedStyle(document.body).backgroundColor);
    expect(bgAfter).not.toBe(bgBefore);

    await darkToggle.click();
    await expect(page.locator('html')).not.toHaveClass(/dark/);
  });

  test('language switch (EN -> BG -> EN) updates visible navigation text', async ({ page }) => {
    await page.goto('/');
    await expect(page.getByRole('heading', { name: 'Welcome to your space' })).toBeVisible();

    await page.getByRole('button', { name: 'Switch language: BG' }).click();
    await expect(page.getByRole('heading', { name: 'Добре дошъл в твоето пространство' })).toBeVisible();
    await expect(page.getByRole('navigation', { name: 'Main' }).getByRole('link', { name: 'Практики' })).toBeVisible();

    // Now that the page itself is in Bulgarian, the switcher's own
    // aria-label prefix is too ("Смени езика" rather than "Switch language").
    await page.getByRole('button', { name: 'Смени езика: EN' }).click();
    await expect(page.getByRole('heading', { name: 'Welcome to your space' })).toBeVisible();
  });

  test('locale persists after navigation and reload', async ({ page }) => {
    await page.goto('/');
    await page.getByRole('button', { name: 'Switch language: BG' }).click();
    await expect(page.getByRole('heading', { name: 'Добре дошъл в твоето пространство' })).toBeVisible();

    await page.getByRole('navigation', { name: 'Main' }).getByRole('link', { name: 'Практики' }).click();
    await expect(page).toHaveURL('/practices');
    await expect(page.getByRole('heading', { name: 'Практики' })).toBeVisible();

    await page.reload();
    await expect(page.getByRole('heading', { name: 'Практики' })).toBeVisible();
  });
});
