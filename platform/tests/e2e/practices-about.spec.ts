import { test, expect } from './fixtures/base';

// The Practice hub's "About the practice" section: the brochure introduction
// and its five headed sections, beside the "welcome" photo with its quote and
// welcome note — between the entry tiles and Reset Programs, in both languages.
const expected = {
  bg: {
    heading: 'За практиката',
    intro: 'Фасциалните маневри са нежна практика за движение',
    sections: [
      'В основата на тази практика',
      'Подкрепени и обгърнати',
      'Когато тялото се чувства в безопасност и свързано',
      'Повече от физическо движение',
      'Пътешествие обратно към дома – към тялото',
    ],
    lastParagraph: 'Тя ни напомня, че движението може да бъде път към по-дълбока осъзнатост, баланс, устойчивост и истинско благополучие.',
    quote: '„Движението може да бъде път към осъзнатост, баланс, устойчивост и по-дълбоко усещане за благополучие.“',
    welcomeTitle: 'Всички нива са добре дошли',
    welcomeText: 'Няма нужда от опит.',
    alt: 'Група практикуващи',
    otherLanguage: /[A-Za-z]{3,}/,
  },
  en: {
    heading: 'About the Practice',
    intro: 'Fascial maneuvers are a gentle movement practice',
    sections: [
      'At the Heart of This Practice',
      'Held and Supported',
      'When the Body Feels Safe and Connected',
      'More Than Physical Movement',
      'A Journey Back Home – to the Body',
    ],
    lastParagraph: 'It reminds us that movement can be a path to deeper awareness, balance, resilience and true well-being.',
    quote: '“Movement can be a pathway to awareness, balance, resilience and a deeper sense of well-being.”',
    welcomeTitle: 'All levels are welcome',
    welcomeText: 'No experience needed.',
    alt: 'A group practising',
    otherLanguage: /[А-Яа-я]/,
  },
} as const;

for (const locale of ['bg', 'en'] as const) {
  test(`Practice hub shows "About the practice" (${locale})`, async ({ page, context, baseURL }) => {
    await context.addCookies([{ name: 'ptd_locale', value: locale, url: baseURL! }]);
    const want = expected[locale];
    await page.goto('/practices');

    const about = page.getByTestId('practices-about');
    await expect(about.getByRole('heading', { level: 2, name: want.heading })).toBeVisible();
    await expect(about).toContainText(want.intro);

    // The five brochure sections, in order, with their paragraph breaks
    // (1 + 2 + 1 + 2 + 1 paragraphs); the short summary and pillars are gone.
    const sections = about.getByTestId('practices-about-section');
    await expect(sections).toHaveCount(5);
    await expect(sections.getByRole('heading', { level: 3 })).toHaveText([...want.sections]);
    await expect(sections.locator('p')).toHaveCount(7);
    await expect(sections.last()).toContainText(want.lastParagraph);
    await expect(about.getByRole('list')).toHaveCount(0);
    await expect(about.getByTestId('practices-about-details')).toHaveCount(0);
    // Titles stored in normal case, shown in capitals; everything centred.
    await expect(sections.getByRole('heading', { level: 3 }).first()).toHaveCSS('text-transform', 'uppercase');
    for (const el of [
      about.getByRole('heading', { level: 2 }),
      about.getByText(want.intro),
      sections.first().getByRole('heading', { level: 3 }),
      sections.first().locator('p').first(),
      about.getByTestId('practices-about-quote').locator('p'),
      about.getByTestId('practices-about-welcome'),
    ]) {
      await expect(el).toHaveCSS('text-align', 'center');
    }
    const [introBox, firstSectionBox] = await Promise.all([
      about.getByText(want.intro).boundingBox(),
      sections.first().boundingBox(),
    ]);
    expect(introBox!.y + introBox!.height).toBeLessThanOrEqual(firstSectionBox!.y);

    // One text-free photo for both languages, described (not quoted) by its alt.
    const image = about.getByRole('img');
    await expect(image).toHaveAttribute('alt', new RegExp(want.alt));
    const src = decodeURIComponent((await image.getAttribute('src')) ?? '');
    expect(src).toContain('/images/practices/welcome.webp');
    await expect.poll(() => image.evaluate((img: HTMLImageElement) => img.complete && img.naturalWidth > 0)).toBe(true);

    // The quote is page text above the photo; the welcome note sits below it.
    const quote = about.getByTestId('practices-about-quote');
    const welcome = about.getByTestId('practices-about-welcome');
    await expect(quote).toHaveText(want.quote);
    await expect(welcome.getByRole('heading', { level: 3 })).toHaveText(want.welcomeTitle);
    await expect(welcome).toContainText(want.welcomeText);
    const [quoteBox, imageBox, welcomeBox] = await Promise.all([quote.boundingBox(), image.boundingBox(), welcome.boundingBox()]);
    expect(quoteBox!.y + quoteBox!.height).toBeLessThanOrEqual(imageBox!.y);
    expect(imageBox!.y + imageBox!.height).toBeLessThanOrEqual(welcomeBox!.y);

    // Only this language's text (the brand name in the eyebrow aside).
    expect((await about.innerText()).replace(/KUKO WAY/g, '')).not.toMatch(want.otherLanguage);

    // Still a single page title, and the section sits between the entry tiles
    // and Reset Programs.
    await expect(page.locator('h1')).toHaveCount(1);
    const order = await page.getByRole('main').evaluate((main) => {
      const startHere = main.querySelector('a[href="/practices/start-here"]');
      const aboutEl = main.querySelector('[data-testid="practices-about"]');
      const programs = main.querySelector('a[href^="/practices/programs/"]');
      const follows = (a: Element | null, b: Element | null) =>
        Boolean(a && b && a.compareDocumentPosition(b) & Node.DOCUMENT_POSITION_FOLLOWING);
      return follows(startHere, aboutEl) && follows(aboutEl, programs);
    });
    expect(order).toBe(true);
  });
}

test('Practice hub "About the practice" fits a phone screen without horizontal scroll', async ({ page }) => {
  await page.setViewportSize({ width: 375, height: 800 });
  await page.goto('/practices');
  await expect(page.getByTestId('practices-about')).toBeVisible();
  const overflow = await page.evaluate(() => document.documentElement.scrollWidth > document.documentElement.clientWidth);
  expect(overflow).toBe(false);
});
