import { describe, it, expect } from 'vitest';
import { getPracticeOverview, getHandbookSections } from '@/modules/kuko-way/service';
import { localize, type LocalizedText } from '@/modules/kuko-way/types';
import { getT } from '@/lib/i18n/dictionaries';

// The Practice hub's "About the practice" block: the brochure's introduction
// and five headed sections, the quote and the welcome note — bilingual, with
// the approved wording.
const overview = getPracticeOverview();
const texts: LocalizedText[] = [
  overview.intro,
  ...overview.sections.flatMap((s) => [s.title, ...s.paragraphs]),
  overview.quote,
  overview.welcome.title,
  overview.welcome.text,
];

describe('practice overview content', () => {
  it('has the five brochure sections with the supplied Bulgarian text and paragraph breaks', () => {
    expect(overview.sections.map((s) => s.title.bg)).toEqual([
      'В основата на тази практика',
      'Подкрепени и обгърнати',
      'Когато тялото се чувства в безопасност и свързано',
      'Повече от физическо движение',
      'Пътешествие обратно към дома – към тялото',
    ]);
    expect(overview.sections.map((s) => s.paragraphs.map((p) => p.bg))).toEqual([
      [
        'В основата на тази практика стои идеята да върнем тялото към усещането за безопасност – състояние, което ни е дълбоко познато още от най-ранните моменти на живота, когато сме били напълно подкрепени и обгърнати в защитената среда на майчината утроба.',
      ],
      [
        'Това преживяване на подкрепа и обгръщане от всички страни създава фундаментално усещане за сигурност, доверие и свързаност.',
        'Именно от това състояние на безопасност тялото може постепенно да освободи защитните си модели и да се свърже отново със своята естествена мъдрост.',
      ],
      [
        'Когато тялото се чувства спокойно и свързано, движенията стават по-плавни, дишането – по-свободно, а естествените процеси на кръвообращение, движение на лимфата, хидратация и обмен в организма протичат по-хармонично.',
      ],
      [
        'Фасциалните маневри не са само физическа практика.',
        'Те са покана да се свържем отново със себе си на различни нива – физическо, емоционално и умствено. Чрез присъствие, осъзнато дишане и любопитно изследване се учим да слушаме тялото, да разбираме неговите сигнали и постепенно да изграждаме отношения на уважение и доверие към самите себе си.',
      ],
      [
        'Тази практика е пътешествие обратно към дома – към собственото тяло. Тя ни напомня, че движението може да бъде път към по-дълбока осъзнатост, баланс, устойчивост и истинско благополучие.',
      ],
    ]);
  });

  it('has an English heading and paragraph for every Bulgarian one', () => {
    expect(overview.sections.map((s) => s.title.en)).toEqual([
      'At the Heart of This Practice',
      'Held and Supported',
      'When the Body Feels Safe and Connected',
      'More Than Physical Movement',
      'A Journey Back Home – to the Body',
    ]);
    for (const section of overview.sections) {
      for (const paragraph of section.paragraphs) expect(paragraph.en).toMatch(/^[A-Z]/);
    }
  });

  it('is fully bilingual — no English visitor falls back to Bulgarian', () => {
    for (const text of texts) {
      expect(text.bg.trim()).not.toBe('');
      expect(text.en?.trim()).toBeTruthy();
      expect(text.en).not.toMatch(/[А-Яа-я]/);
      expect(localize(text, 'en').isFallback).toBe(false);
    }
  });

  it('has no doubled full stops, missing spaces after a full stop, or doubled spaces', () => {
    for (const text of texts) {
      for (const value of [text.bg, text.en!]) {
        expect(value).not.toMatch(/\.\./);
        expect(value).not.toMatch(/\.[A-Za-zА-Яа-я]/);
        expect(value).not.toMatch(/ {2}/);
        expect(value).toBe(value.trim());
      }
    }
  });

  it('follows the site style: the practice name is not capitalised mid-sentence', () => {
    expect(overview.intro.en).toMatch(/^Fascial maneuvers /);
    expect(overview.intro.bg).toMatch(/^Фасциалните маневри /);
    for (const text of texts) expect(text.en).not.toMatch(/Fascial Maneuvers/);
  });

  it('section titles are stored in normal case (the page uppercases them with CSS)', () => {
    for (const section of overview.sections) {
      expect(section.title.en).not.toBe(section.title.en!.toUpperCase());
      expect(section.title.bg).not.toBe(section.title.bg.toUpperCase());
    }
  });

  it('does not repeat any handbook paragraph', () => {
    const handbook = getHandbookSections()
      .flatMap((s) => [...(s.paragraphs ?? []), ...(s.subsections ?? []).flatMap((sub) => sub.paragraphs)])
      .flatMap((p) => [p.bg, p.en ?? '']);
    for (const text of texts) {
      expect(handbook).not.toContain(text.bg);
      expect(handbook).not.toContain(text.en);
    }
  });

  it('has a section heading and localized image alt text in both languages', () => {
    for (const locale of ['bg', 'en'] as const) {
      const t = getT(locale);
      expect(t('practices.aboutTitle')).not.toBe('practices.aboutTitle');
      expect(t('practices.welcomeImageAlt').length).toBeGreaterThan(60);
    }
    // The alt text describes the photo; the quote is page text, not repeated.
    expect(getT('bg')('practices.welcomeImageAlt')).not.toContain('Движението');
    expect(getT('en')('practices.welcomeImageAlt')).not.toContain('Movement can be');
  });

  it('keeps the quote and the welcome note with the approved wording', () => {
    expect(overview.quote.bg).toBe(
      'Движението може да бъде път към осъзнатост, баланс, устойчивост и по-дълбоко усещане за благополучие.',
    );
    expect(overview.quote.en).toBe(
      'Movement can be a pathway to awareness, balance, resilience and a deeper sense of well-being.',
    );
    expect(overview.welcome.title).toEqual({ bg: 'Всички нива са добре дошли', en: 'All levels are welcome' });
    expect(overview.welcome.text).toEqual({ bg: 'Няма нужда от опит.', en: 'No experience needed.' });
  });
});
