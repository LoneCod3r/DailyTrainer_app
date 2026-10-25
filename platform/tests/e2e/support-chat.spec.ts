import AxeBuilder from '@axe-core/playwright';
import type { Page } from '@playwright/test';
import { test, expect } from './fixtures/base';

// The help chat (components/support/SupportChat): a small window that answers
// from the fixed FAQ in the browser. It only renders with
// NEXT_PUBLIC_FEATURE_SUPPORT_CHAT=true, which is off by default, so the spec
// skips unless the server under test was started with the flag on.
test.skip(process.env.NEXT_PUBLIC_FEATURE_SUPPORT_CHAT !== 'true', 'support chat feature flag is off');

const launcher = (page: Page) => page.getByRole('button', { name: /Open the help assistant|Отвори асистента за помощ/ });
const dialog = (page: Page) => page.getByRole('dialog', { name: /^(Ted|Тед)$/ });
const log = (page: Page) => dialog(page).getByRole('log');
const input = (page: Page) => dialog(page).getByRole('textbox');
const sendButton = (page: Page) => dialog(page).getByRole('button', { name: /^(Send|Изпрати)$/ });
// Direct children of the log: the welcome bubble, then user/bot bubbles.
const bubbles = (page: Page) => log(page).locator(':scope > p, :scope > div:not(:empty)');
const lastReply = (page: Page) => log(page).locator(':scope > div:not(:empty)').last();

async function openChat(page: Page) {
  await page.goto('/');
  await launcher(page).click();
  await expect(dialog(page)).toBeVisible();
}

async function ask(page: Page, question: string) {
  await input(page).fill(question);
  await input(page).press('Enter');
}

test.describe('support chat', () => {
  test('opens with a welcome message and closes with × or Escape, returning focus', async ({ page }) => {
    await openChat(page);
    await expect(log(page).locator(':scope > p').first()).toHaveText('Hi! I’m Ted, the Kuko Way virtual assistant. How can I help?');
    await expect(input(page)).toBeFocused();

    // Ted's portrait in the header, served through next/image and loaded.
    const avatar = dialog(page).locator('img[src*="tedd-avatar"]');
    await expect(avatar).toBeVisible();
    // The first request makes next/image optimize the original, so wait.
    await expect.poll(() => avatar.evaluate((img: HTMLImageElement) => img.complete && img.naturalWidth > 0)).toBe(true);

    await page.keyboard.press('Escape');
    await expect(dialog(page)).toBeHidden();
    await expect(launcher(page)).toBeFocused();

    await launcher(page).click();
    await dialog(page).getByRole('button', { name: 'Close the help assistant' }).click();
    await expect(dialog(page)).toBeHidden();
    await expect(launcher(page)).toBeFocused();
  });

  test('sends with Enter and with the button, and ignores empty messages', async ({ page }) => {
    await openChat(page);
    const before = await bubbles(page).count();

    await expect(sendButton(page)).toBeDisabled();
    await input(page).press('Enter');
    await input(page).fill('   ');
    await expect(sendButton(page)).toBeDisabled();
    await input(page).press('Enter');
    await expect(bubbles(page)).toHaveCount(before);

    await ask(page, 'Where are the videos?');
    await expect(bubbles(page)).toHaveCount(before + 2);
    await expect(input(page)).toHaveValue('');
    await expect(lastReply(page)).toContainText('Free Videos');

    await input(page).fill('Who are you?');
    await sendButton(page).click();
    await expect(bubbles(page)).toHaveCount(before + 4);
    await expect(lastReply(page)).toContainText('virtual assistant');
  });

  test('shows visitor messages on the right and replies on the left', async ({ page }) => {
    await openChat(page);
    await ask(page, 'Hi');
    const area = (await log(page).boundingBox())!;
    const user = (await log(page).locator(':scope > p').last().boundingBox())!;
    const bot = (await lastReply(page).boundingBox())!;
    const welcome = (await log(page).locator(':scope > p').first().boundingBox())!;
    // Right-aligned: ends at the log's right padding; left-aligned: starts at its left padding.
    expect(area.x + area.width - (user.x + user.width)).toBeLessThan(24);
    expect(user.x - area.x).toBeGreaterThan(24);
    expect(bot.x - area.x).toBeLessThan(24);
    expect(welcome.x - area.x).toBeLessThan(24);
  });

  test('tells programs and practices apart', async ({ page }) => {
    await openChat(page);
    await ask(page, 'Where can I find programs?');
    await expect(lastReply(page)).toContainText('Programs section');
    await ask(page, 'Where can I find practices?');
    await expect(lastReply(page)).toContainText('Practice section');
  });

  test('is transparent about questions it does not understand', async ({ page }) => {
    await openChat(page);
    await ask(page, 'What is the weather tomorrow?');
    await expect(lastReply(page)).toContainText('not sure I understood');
  });

  test('uses readable, relative internal links', async ({ page, baseURL }) => {
    await openChat(page);
    await ask(page, 'Where can I find practices?');
    const link = lastReply(page).getByRole('link', { name: 'See the practices' });
    await expect(link).toHaveAttribute('href', '/practices');
    const texts = await lastReply(page).getByRole('link').allInnerTexts();
    for (const text of texts) expect(text).not.toMatch(/https?:|localhost|\//);
    await expect(lastReply(page)).not.toContainText('localhost');
    await link.click();
    await expect(page).toHaveURL(`${baseURL}/practices`);
  });

  test('answers in Bulgarian', async ({ page, context, baseURL }) => {
    await context.addCookies([{ name: 'ptd_locale', value: 'bg', url: baseURL! }]);
    await openChat(page);
    await expect(log(page).locator(':scope > p').first()).toHaveText('Здравей! Аз съм Тед, виртуалният асистент на Kuko Way. С какво мога да помогна?');
    await ask(page, 'Къде мога да намеря програми');
    await expect(lastReply(page)).toContainText('„Програми“');
    await expect(lastReply(page).getByRole('link', { name: 'Виж програмите' })).toHaveAttribute('href', '/practices/programs');
    await ask(page, 'Кой си ти?');
    await expect(lastReply(page)).toContainText('виртуалният помощник');
    // Personal questions about the assistant get a real answer, not the fallback.
    await ask(page, 'На колко си години?');
    await expect(lastReply(page)).toContainText('Нямам възраст като човек');
    await expect(lastReply(page)).not.toContainText('Не съм сигурен, че разбрах');
  });

  test('answers personal questions about the assistant honestly', async ({ page }) => {
    await openChat(page);
    await ask(page, 'How old are you?');
    await expect(lastReply(page)).toContainText('don’t have an age');
    await ask(page, 'Are you human?');
    await expect(lastReply(page)).toContainText('not a human');
    await ask(page, 'Do you know everything?');
    await expect(lastReply(page)).toContainText('don’t know everything');
    await ask(page, 'What is the capital of France?');
    await expect(lastReply(page)).toContainText('not sure I understood');
  });

  test('links only “Lone Coder” in the creator answer, as a safe external link', async ({ page, context, baseURL }) => {
    for (const [locale, question, sentence] of [
      ['en', 'Who created you?', 'developed by Lone Coder'],
      ['bg', 'Кой те създаде?', 'разработен лично от Lone Coder'],
    ] as const) {
      await context.addCookies([{ name: 'ptd_locale', value: locale, url: baseURL! }]);
      await openChat(page);
      await ask(page, question);
      const reply = lastReply(page);
      await expect(reply).toContainText(sentence);
      const links = reply.getByRole('link');
      await expect(links).toHaveCount(1);
      const link = links.first();
      await expect(link).toHaveText('Lone Coder');
      await expect(link).toHaveAttribute('href', 'https://lonecoder.nsh.one/');
      await expect(link).toHaveAttribute('target', '_blank');
      await expect(link).toHaveAttribute('rel', 'noopener noreferrer');
      // Keyboard reachable from the conversation.
      await link.focus();
      await expect(link).toBeFocused();
    }
  });

  test('re-displays the whole conversation when the site language changes, and restores it', async ({ page, context, baseURL }) => {
    await context.addCookies([{ name: 'ptd_locale', value: 'bg', url: baseURL! }]);
    // Tall enough that the open chat doesn't overlap the language dropdown
    // (at 720px it does: the chat sits above the top bar's stacking layer).
    await page.setViewportSize({ width: 1280, height: 900 });
    await openChat(page);
    await ask(page, 'Кой си ти');
    await ask(page, 'Къде мога да намеря програми');
    await ask(page, 'Кой те създаде?');
    await ask(page, 'абв гдеж');
    const userBubbles = log(page).locator(':scope > p:not(:first-child)');
    const replies = log(page).locator(':scope > div:not(:empty)');
    const count = await bubbles(page).count();

    const switchTo = async (current: RegExp, option: string) => {
      await page.getByRole('button', { name: current }).click();
      await page.getByRole('option', { name: option }).click();
    };

    // BG → EN: recognised questions and every reply read in English.
    await switchTo(/Език: БГ/, 'EN');
    await expect(log(page)).toContainText('I’m Ted, the Kuko Way virtual assistant');
    await expect(userBubbles.nth(0)).toHaveText('Who are you?');
    await expect(userBubbles.nth(0)).toHaveAttribute('lang', 'en');
    await expect(userBubbles.nth(1)).toHaveText('Where can I find the programs?');
    await expect(userBubbles.nth(2)).toHaveText('Who created you?');
    // Unrecognised text can't be translated: it stays as written, marked as Bulgarian.
    await expect(userBubbles.nth(3)).toHaveText('абв гдеж');
    await expect(userBubbles.nth(3)).toHaveAttribute('lang', 'bg');
    await expect(replies.nth(0)).toContainText('virtual assistant');
    await expect(replies.nth(1)).toContainText('Programs section');
    await expect(replies.nth(3)).toContainText('not sure I understood');
    // The creator link survives the switch unchanged.
    const lone = replies.nth(2).getByRole('link', { name: 'Lone Coder' });
    await expect(lone).toHaveAttribute('href', 'https://lonecoder.nsh.one/');
    await expect(lone).toHaveAttribute('target', '_blank');
    await expect(lone).toHaveAttribute('rel', 'noopener noreferrer');
    // No messages were added or re-sent.
    await expect(bubbles(page)).toHaveCount(count);

    // EN → BG: the visitor's own words come back exactly.
    // In the English UI the Bulgarian option is labelled "BG".
    await switchTo(/Language: EN/, 'BG');
    await expect(log(page)).toContainText('Аз съм Тед, виртуалният асистент на Kuko Way');
    await expect(userBubbles.nth(0)).toHaveText('Кой си ти');
    await expect(userBubbles.nth(1)).toHaveText('Къде мога да намеря програми');
    await expect(userBubbles.nth(2)).toHaveText('Кой те създаде?');
    await expect(userBubbles.nth(3)).toHaveText('абв гдеж');
    await expect(replies.nth(1)).toContainText('„Програми“');
    await expect(replies.nth(2).getByRole('link', { name: 'Lone Coder' })).toHaveCount(1);
    await expect(bubbles(page)).toHaveCount(count);
  });

  // The same catalog prices the Programs page shows (see pricing.spec.ts,
  // which expects them visible on the server under test).
  test('answers program price questions with the catalog prices and a relative Programs link', async ({ page, context, baseURL }) => {
    await openChat(page);
    await ask(page, 'Any prices available?');
    const reply = lastReply(page);
    await expect(reply).toContainText('The Reset Programs are one-time payments');
    for (const price of ['1 Day Reset – €19', '3 Day Reset – €39', '7 Day Reset – €79', '28 Day Reset – €149']) {
      await expect(reply).toContainText(price);
    }
    await expect(reply).not.toContainText('confirmed pricing');
    const link = reply.getByRole('link', { name: 'See the programs' });
    await expect(link).toHaveAttribute('href', '/practices/programs');
    await ask(page, 'How much does the 28-day reset cost?');
    await expect(lastReply(page)).toContainText('28 Day Reset – €149');
    await ask(page, 'Where can I find programs?');
    await expect(lastReply(page)).toContainText('Programs section');

    await context.addCookies([{ name: 'ptd_locale', value: 'bg', url: baseURL! }]);
    await openChat(page);
    await ask(page, 'Колко струват програмите?');
    await expect(lastReply(page)).toContainText('Програмите за рестарт се заплащат еднократно');
    for (const price of [/Еднодневен ресет — 19\s€/, /3-дневен ресет — 39\s€/, /7-дневен ресет — 79\s€/, /28-дневен ресет — 149\s€/]) {
      await expect(lastReply(page)).toContainText(price);
    }
    await expect(lastReply(page)).not.toContainText('Day Reset');
    await expect(lastReply(page)).not.toContainText('потвърдена');
    await expect(lastReply(page).getByRole('link', { name: 'Виж програмите' })).toHaveAttribute('href', '/practices/programs');

    // The link leads to the page that shows the same prices.
    await lastReply(page).getByRole('link', { name: 'Виж програмите' }).click();
    await expect(page).toHaveURL(/\/practices\/programs$/);
    await expect(page.getByTestId('program-tile-28-days').getByTestId('price-tag')).toContainText(/149\s€/);
  });

  test('answers practice-price questions with the honest practice-pricing reply', async ({ page, context, baseURL }) => {
    await context.addCookies([{ name: 'ptd_locale', value: 'bg', url: baseURL! }]);
    await openChat(page);
    await ask(page, 'Къде мога да намеря цени на практиките?');
    const reply = lastReply(page);
    await expect(reply).toContainText('нямам потвърдена информация за цените на практиките');
    await expect(reply).not.toContainText('Практиките са в раздел');
    await expect(reply.getByRole('link', { name: 'Виж практиките' })).toHaveAttribute('href', '/practices');
    await expect(reply.locator('a[href="/practices/library"]')).toHaveCount(0);
    await expect(reply).not.toContainText('€');

    // General practice discovery is unchanged.
    await ask(page, 'Къде мога да намеря практиките?');
    await expect(lastReply(page)).toContainText('Практиките са в раздел');

    await context.addCookies([{ name: 'ptd_locale', value: 'en', url: baseURL! }]);
    await openChat(page);
    await ask(page, 'How much do the practices cost?');
    await expect(lastReply(page)).toContainText('confirmed pricing information for the practices');
    await expect(lastReply(page).getByRole('link', { name: 'See the practices' })).toHaveAttribute('href', '/practices');
  });

  test('has no accessibility violations in the open chat', async ({ page }) => {
    await openChat(page);
    await ask(page, 'Where can I find practices?');
    const results = await new AxeBuilder({ page }).include('[role="dialog"]').analyze();
    expect(results.violations).toEqual([]);
    // Keyboard: from the input, Tab reaches Send once there is text.
    await input(page).fill('help');
    await input(page).focus();
    await page.keyboard.press('Tab');
    await expect(sendButton(page)).toBeFocused();
  });
});

test.describe('support chat on a phone', () => {
  test.use({ viewport: { width: 360, height: 740 } });

  test('fits below the top bar with the input visible', async ({ page }) => {
    await openChat(page);
    for (let i = 0; i < 6; i++) await ask(page, 'Where can I find practices?');
    const box = (await dialog(page).boundingBox())!;
    const header = (await page.locator('header').first().boundingBox())!;
    const field = (await input(page).boundingBox())!;
    expect(box.y).toBeGreaterThanOrEqual(header.y + header.height);
    expect(box.y + box.height).toBeLessThanOrEqual(740);
    expect(field.y + field.height).toBeLessThanOrEqual(box.y + box.height);
    await expect(input(page)).toBeInViewport();
  });

  test('stays above an on-screen keyboard', async ({ page }) => {
    // Playwright can't open a real keyboard; this stands in for the browser's
    // visualViewport shrinking the way it does when one opens.
    await page.addInitScript(() => {
      const fake = Object.assign(new EventTarget(), {
        height: window.innerHeight,
        width: window.innerWidth,
        offsetTop: 0,
        offsetLeft: 0,
        pageTop: 0,
        pageLeft: 0,
        scale: 1,
      });
      Object.defineProperty(window, 'visualViewport', { configurable: true, get: () => fake });
      (window as unknown as { openKeyboard: (h: number) => void }).openKeyboard = (h) => {
        fake.height = window.innerHeight - h;
        fake.dispatchEvent(new Event('resize'));
      };
    });
    await openChat(page);
    await page.evaluate(() => (window as unknown as { openKeyboard: (h: number) => void }).openKeyboard(300));
    const visibleBottom = 740 - 300;
    await expect
      .poll(async () => {
        const field = (await input(page).boundingBox())!;
        return field.y + field.height;
      })
      .toBeLessThanOrEqual(visibleBottom);
    const box = (await dialog(page).boundingBox())!;
    const header = (await page.locator('header').first().boundingBox())!;
    expect(box.y).toBeGreaterThanOrEqual(header.y + header.height);

    await page.evaluate(() => (window as unknown as { openKeyboard: (h: number) => void }).openKeyboard(0));
    await expect.poll(async () => (await dialog(page).boundingBox())!.y + (await dialog(page).boundingBox())!.height).toBeGreaterThan(visibleBottom);
  });
});
