import { test, expect } from './fixtures/base';
import { switchLanguage } from './fixtures/language-helpers';

test.describe('Home / public navigation', () => {
  test('@smoke home loads with visible primary navigation', async ({ page }) => {
    await page.goto('/');
    await expect(page).toHaveTitle(/KUKO WAY/);
    // Signed-out visitors get a real KUKO WAY philosophy quote as the hero
    // heading (see app/(app)/page.tsx) rather than a personalized greeting.
    await expect(page.getByRole('heading', { name: /power to change your body/i })).toBeVisible();

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
    await expect(page.getByRole('heading', { name: /power to change your body/i })).toBeVisible();

    await switchLanguage(page, 'en', 'bg');
    await expect(page.getByRole('heading', { name: /Силата да променяте тялото/i })).toBeVisible();
    await expect(page.getByRole('navigation', { name: 'Main' }).getByRole('link', { name: 'Практики' })).toBeVisible();

    await switchLanguage(page, 'bg', 'en');
    await expect(page.getByRole('heading', { name: /power to change your body/i })).toBeVisible();
  });

  test('sidebar arrow shows/hides the Practices and Community submenus independently of the active page', async ({ page }) => {
    await page.goto('/');
    const nav = page.getByRole('navigation', { name: 'Main' });

    // Neither section is the active page here, so both start collapsed.
    await expect(nav.getByRole('button', { name: 'Practices: Show' })).toBeVisible();
    await expect(nav.getByRole('link', { name: 'Start Here' })).toBeHidden();

    // Clicking the arrow toggles the submenu without navigating away.
    await nav.getByRole('button', { name: 'Practices: Show' }).click();
    await expect(nav.getByRole('link', { name: 'Start Here' })).toBeVisible();
    await expect(page).toHaveURL('/');

    await nav.getByRole('button', { name: 'Practices: Hide' }).click();
    await expect(nav.getByRole('link', { name: 'Start Here' })).toBeHidden();

    // Community auto-expands while its page is active...
    await nav.getByRole('link', { name: 'Community' }).click();
    await expect(page).toHaveURL('/community');
    await expect(nav.getByRole('link', { name: 'Discussions' })).toBeVisible();

    // ...but the arrow can still collapse it even though the page is active.
    await nav.getByRole('button', { name: 'Community: Hide' }).click();
    await expect(nav.getByRole('link', { name: 'Discussions' })).toBeHidden();
    await expect(page.getByRole('heading', { name: 'Community' })).toBeVisible();
  });

  test('locale persists after navigation and reload', async ({ page }) => {
    await page.goto('/');
    await switchLanguage(page, 'en', 'bg');
    await expect(page.getByRole('heading', { name: /Силата да променяте тялото/i })).toBeVisible();

    await page.getByRole('navigation', { name: 'Main' }).getByRole('link', { name: 'Практики' }).click();
    await expect(page).toHaveURL('/practices');
    await expect(page.getByRole('heading', { name: 'Практики' })).toBeVisible();

    await page.reload();
    await expect(page.getByRole('heading', { name: 'Практики' })).toBeVisible();
  });
});
