import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import { describe, it, expect, vi, afterEach } from 'vitest';
import { getCatalog } from '@/modules/commerce/catalog';
import { getAllProgramsUnfiltered } from '@/modules/programs/service';
import { handbookSectionHref } from '@/modules/kuko-way/handbook';
import { getHandbookSections, getPracticeBySlug } from '@/modules/kuko-way/service';
import { FAQ } from '@/modules/support/faq';
import { PASSAGES, answerQuestion, searchDocs, toDocAnswer } from '@/modules/support/retrieval';

// Ted's documentation search (modules/support/retrieval.ts): quoted
// passages from the approved, public KUKO WAY content when the FAQ has no
// answer — deterministic, local, no AI or paid service.

const HANDBOOK_HREFS = new Set(getHandbookSections().map((s) => handbookSectionHref(s)));
const doc = (question: string) => answerQuestion(question).doc;

describe('documentation index', () => {
  it('holds only public page content from the approved sources', () => {
    expect(PASSAGES.length).toBeGreaterThan(50);
    for (const p of PASSAGES) {
      expect(p.source, p.id).toMatch(/^content\/(start-here|practices|practice-overview)\.ts › /);
      expect(p.text.bg.trim(), p.id).not.toBe('');
      expect(p.text.en.trim(), p.id).not.toBe('');
    }
  });

  it('links every passage to a page that exists', () => {
    for (const p of PASSAGES) {
      const ok =
        HANDBOOK_HREFS.has(p.href) ||
        p.href === '/practices' ||
        (p.href.startsWith('/practices/') && getPracticeBySlug(p.href.slice('/practices/'.length)) !== undefined);
      expect(ok, `${p.id} → ${p.href}`).toBe(true);
    }
  });

  it('never quotes prices, contact details, refunds, internal notes or drafts', () => {
    const all = PASSAGES.map((p) => {
      const a = toDocAnswer(p);
      return `${a.text.bg}\n${a.text.en}`;
    }).join('\n');
    expect(all).not.toMatch(/€|\$|\b(eur|bgn)\b|лв\./i);
    expect(all).not.toMatch(/[\w.+-]+@[\w-]+\.\w+|https?:\/\//);
    expect(all).not.toMatch(/refund|възстановяване на сума|founded in|основан през/i);
    expect(all).not.toMatch(/TODO|CLIENT_CONFIRMATION|PLACEHOLDER|NOT APPROVED|ПРЕДСТОИ ПОТВЪРЖДЕНИЕ|TO BE CONFIRMED/);
  });
});

describe('documentation answers', () => {
  it.each([
    // Learn chapters, by exact title (these beat the general Learn answer)
    ['Какво е фасция?', '/learn/kakvo-e-fastsiya'],
    ['какво е фасцията', '/learn/kakvo-e-fastsiya'],
    ['What is fascia?', '/learn/kakvo-e-fastsiya'],
    ['Tell me about fascia', '/learn/kakvo-e-fastsiya'],
    ['Какво е фасциална маневра?', '/learn/kakvo-e-fastsialna-manevra'],
    ['What is a fascial maneuver?', '/learn/kakvo-e-fastsialna-manevra'],
    ['Зони на тялото', '/learn/zoni-na-tyaloto'],
    ['What are the body zones?', '/learn/zoni-na-tyaloto'],
    // Start Here chapters and their sub-sections
    ['Какво е контра-ротация?', '/practices/start-here/osnovi-na-fastsiyata'],
    ['What is counter-rotation?', '/practices/start-here/osnovi-na-fastsiyata'],
    ['Как се диша по време на практиката?', '/practices/start-here/osnovi-na-fastsiyata'],
    ['How should I breathe?', '/practices/start-here/osnovi-na-fastsiyata'],
    ['What are your beliefs?', '/practices/start-here/nashite-ubezhdeniya'],
    ['Какви са вашите убеждения?', '/practices/start-here/nashite-ubezhdeniya'],
    ['Who is Garry Lineham?', '/practices/start-here/kakvo-e-kuko-way'],
    // Safety, with everyday phrasings
    ['What if I feel dizzy?', '/practices/start-here/saveti-za-nachalo'],
    ['I feel lightheaded', '/practices/start-here/saveti-za-nachalo'],
    ['Какво да правя, ако ми се завие свят?', '/practices/start-here/saveti-za-nachalo'],
    ['Can I do the maneuvers seated?', '/practices/start-here/kakvo-da-ochakvate'],
    ['Мога ли да правя маневрите седнал?', '/practices/start-here/kakvo-da-ochakvate'],
    // Practices, by name in either language
    ['How do I do the Palate Swipe?', '/practices/plazgane-po-nebtseto'],
    ['Плъзгане по небцето', '/practices/plazgane-po-nebtseto'],
    ['Antigravity', '/practices/antigravitatsiya'],
    ['Антигравитация', '/practices/antigravitatsiya'],
  ])('%s → %s', (question, href) => {
    const answer = doc(question);
    expect(answer, question).not.toBeNull();
    expect(answer!.link.href).toBe(href);
  });

  it('quotes the source word for word, introduced by its title, in both languages', () => {
    for (const question of ['Какво е фасция?', 'What is counter-rotation?', 'How do I do the Palate Swipe?', 'What if I feel dizzy?']) {
      const hit = searchDocs(question)!;
      const answer = toDocAnswer(hit.passage);
      for (const [locale, lead] of [
        ['bg', `От „${hit.passage.title.bg}“: `],
        ['en', `From “${hit.passage.title.en}”: `],
      ] as const) {
        expect(answer.text[locale].startsWith(lead), question).toBe(true);
        const quote = answer.text[locale].slice(lead.length);
        expect(quote.length).toBeGreaterThan(20);
        expect(hit.passage.text[locale].startsWith(quote), `${question} (${locale})`).toBe(true);
        expect(quote.length).toBeLessThanOrEqual(520);
      }
      expect(answer.link.label.bg).toBe(`Прочети „${hit.passage.title.bg}“`);
      expect(answer.link.label.en).toBe(`Read “${hit.passage.title.en}”`);
      expect(answer.source).toBe(hit.passage.source);
    }
  });

  it.each(['What is the weather tomorrow?', 'Разкажи ми историята си', 'history', 'абв гдеж', 'Tell me a joke', ''])(
    'keeps the usual fallback when nothing matches reliably: %s',
    (question) => {
      expect(answerQuestion(question)).toEqual({ entry: null, doc: null });
    },
  );

  it.each(['Can it cure back pain?', 'Does it heal injuries?', 'Лекува ли болки в гърба?', 'Can fascial maneuvers treat a disease?'])(
    'answers health-claim questions with the medical disclaimer, never a quoted benefit: %s',
    (question) => {
      const answer = answerQuestion(question);
      expect(answer.doc).toBeNull();
      expect(answer.entry?.id).toBe('medical');
    },
  );
});

describe('the FAQ stays first', () => {
  // A representative question for each of the 20 topics, through the same
  // path the chat uses (answerQuestion), in both languages.
  it.each([
    ['Какво е KUKO WAY?', 'about'],
    ['Tell me about Kuko Way', 'about'],
    ['Кажи ми за историята на Kuko Way', 'story'],
    ['What is the history of KUKO WAY?', 'story'],
    ['Как да започна?', 'start'],
    ['За кого е предназначен KUKO WAY?', 'audience'],
    ['What are the practices?', 'practices'],
    ['Какво представляват практиките?', 'practices'],
    ['Каква е разликата между практика и програма?', 'difference'],
    ['Which program should I choose?', 'chooseProgram'],
    ['Колко време отнема една практика?', 'duration'],
    ['Can I browse the practices before choosing?', 'browse'],
    ['Как да намеря конкретна практика?', 'findPractice'],
    ['Колко струват програмите?', 'pricing'],
    ['How much do the programs cost?', 'pricing'],
    ['Is any content free?', 'free'],
    ['Как да разбера цената, преди да платя?', 'priceBeforePaying'],
    ['Where can I get help with a payment?', 'paymentHelp'],
    ['Как да видя напредъка си?', 'journey'],
    ['Where can I find my practice history?', 'journey'],
    ['How can I update my profile?', 'account'],
    ['Какво е „Знание“?', 'learn'],
    ['What is in the Learn section?', 'learn'],
    ['Practices are a substitute for medical care?', 'medical'],
    ['Къде да намеря правилата и помощта?', 'policies'],
    ['Where can I find practices?', 'practices'],
    ['Where are the articles on fascia?', 'learn'],
  ])('%s → FAQ %s', (question, id) => {
    const answer = answerQuestion(question);
    expect(answer.doc).toBeNull();
    expect(answer.entry?.id).toBe(id);
  });

  it('keeps brand history away from Journey and personal history with it', () => {
    for (const q of ['Кажи ми за историята на Kuko Way', 'Каква е историята на KUKO WAY?', 'Who founded KUKO WAY?']) {
      expect(answerQuestion(q).entry?.id, q).toBe('story');
    }
    for (const q of ['Къде е историята ми?', 'Къде виждам напредъка си?', 'Where is my practice history?', 'Покажи историята на практиките ми']) {
      expect(answerQuestion(q).entry?.id, q).toBe('journey');
    }
  });

  it('leaves prices to the catalog-driven FAQ answer', () => {
    const pricing = FAQ.find((e) => e.id === 'pricing')!;
    for (const q of ['Колко струват програмите?', 'Има ли цени?', 'How much does the 28-day reset cost?']) {
      const answer = answerQuestion(q);
      expect(answer.entry, q).toBe(pricing);
      expect(answer.doc, q).toBeNull();
    }
  });

  it('keeps the documentation out of the page bundle', () => {
    // faq.ts stays light (no content imports); SupportChat imports the
    // search only as a type and loads it with a dynamic import.
    const faqSource = readFileSync(join(__dirname, '..', 'modules', 'support', 'faq.ts'), 'utf8');
    expect(faqSource).not.toMatch(/from '@\/modules\/kuko-way\/(content|service)/);
    const chat = readFileSync(join(__dirname, '..', 'components', 'support', 'SupportChat.tsx'), 'utf8');
    expect(chat).toContain("import type { DocAnswer } from '@/modules/support/retrieval';");
    expect(chat).toContain("import('@/modules/support/retrieval')");
    expect(chat).not.toMatch(/^import \{[^}]*\} from '@\/modules\/support\/retrieval';/m);
  });
});

// Programs point to the Programs page and prices stay with the FAQ's
// catalog-driven answer; neither is ever quoted from the documentation.
describe('programs and prices', () => {
  afterEach(() => {
    vi.doUnmock('@/lib/features');
    vi.resetModules();
  });

  it('indexes no program content, catalog entry or price', () => {
    const programTexts = getCatalog().flatMap((p) => [p.title.bg, p.title.en ?? '', p.tagline.bg, p.tagline.en ?? '']);
    const programTitles = getAllProgramsUnfiltered().flatMap((p) => [p.title.bg, p.title.en ?? '']);
    const indexed = PASSAGES.map((p) => `${p.title.bg}\n${p.title.en}\n${p.text.bg}\n${p.text.en}`).join('\n');
    for (const text of [...programTexts, ...programTitles].filter((t) => t.trim().length > 3)) {
      expect(indexed, text).not.toContain(text);
    }
    expect(PASSAGES.every((p) => !/programs|commerce|catalog/.test(p.source) && !p.href.startsWith('/practices/programs'))).toBe(true);
  });

  it.each([
    'Where can I find the programs?',
    'Къде да намеря програмите?',
    'Tell me about the programs',
    'What does the 7-day reset include?',
    'Какво включва 28-дневната програма?',
    'Какво включва 28-дневният рестарт?',
    'Еднодневен ресет',
    '7-дневен ресет',
    'Tell me about the 28 day reset',
  ])('points program questions to the Programs page: %s', (question) => {
    const answer = answerQuestion(question);
    expect(answer.doc).toBeNull();
    expect(answer.entry?.links.map((l) => l.href)).toContain('/practices/programs');
  });

  it.each(['How much do the programs cost?', 'Колко струват програмите?', 'Is there a discount?', 'Има ли абонамент?', 'Is there a membership?'])(
    'answers price, discount and subscription questions with the catalog-driven pricing answer: %s',
    (question) => {
      const answer = answerQuestion(question);
      expect(answer.doc).toBeNull();
      expect(answer.entry?.id).toBe('pricing');
    },
  );

  it('follows the feature flags for prices, through the chat’s answer path', async () => {
    const load = async (flags: { pricingPreview: boolean; programsPreview: boolean; programCheckout: boolean }) => {
      vi.resetModules();
      vi.doMock('@/lib/features', async (importOriginal) => {
        const actual = await importOriginal<typeof import('@/lib/features')>();
        return { features: { ...actual.features, ...flags } };
      });
      const { answerQuestion: ask } = await import('@/modules/support/retrieval');
      return ask('How much do the programs cost?').entry!.answer!;
    };
    const shown = await load({ pricingPreview: true, programsPreview: true, programCheckout: false });
    expect(shown.en).toContain('28 Day Reset – €149');
    expect(shown.en).toContain('Purchasing isn’t open yet');

    const checkout = await load({ pricingPreview: true, programsPreview: true, programCheckout: true });
    expect(checkout.en).not.toContain('Purchasing isn’t open yet');
    expect(checkout.en).not.toMatch(/you can (buy|purchase)|available to buy/i);

    const hidden = await load({ pricingPreview: false, programsPreview: true, programCheckout: false });
    expect(hidden.en).toMatch(/^The Reset Program prices aren’t published on the site yet/);
    expect(hidden.bg + hidden.en).not.toMatch(/€/);
  });

  it('never recommends a program for a personal need', () => {
    const answer = answerQuestion('Which reset is best for my back?');
    expect(answer.doc).toBeNull();
    expect(answer.entry?.id).toBe('chooseProgram');
    // Lists every program's role from the catalog instead of picking one.
    for (const product of getCatalog().filter((p) => p.kind === 'PROGRAM')) {
      expect(answer.entry!.answer!.en).toContain(product.title.en!);
    }
  });
});

// "Reset" alone is not a program: the handbook's first three maneuvers form
// a 15-minute reset for tension. Only "program" or a day count makes a reset
// question about the Reset Programs.
describe('reset: tension reset vs Reset Programs', () => {
  it.each([
    'Какво е 15-минутният reset за напрежение?',
    'Какво е 15-минутният рестарт за напрежение?',
    'Кои маневри съставят рестарта за напрежение?',
    'What is the 15-minute tension reset?',
    'What is the reset for tension?',
    'Tell me about the 15 minute reset',
    'Which practices form the tension reset?',
  ])('quotes the handbook for the tension reset, never Programs: %s', (question) => {
    const answer = answerQuestion(question);
    expect(answer.entry).toBeNull();
    expect(answer.doc?.link.href).toBe('/learn/razvitie-na-obuchenieto');
    expect(answer.doc?.text.en).toContain('15-minute reset for tension');
    expect(answer.doc?.text.bg).toContain('15-минутен рестарт за напрежение');
  });

  it.each(['Какво е reset?', 'Какво е ресет?', 'Какво е рестарт?', 'What is reset?', 'What does the reset include?'])(
    'makes no confident guess for a bare reset: %s',
    (question) => {
      expect(answerQuestion(question)).toEqual({ entry: null, doc: null });
    },
  );

  it.each([
    ['Къде са програмите?', 'programs'],
    ['Where can I find the programs?', 'programs'],
    ['Колко струват програмите?', 'pricing'],
    ['How much do the programs cost?', 'pricing'],
    ['Колко струва 28-дневният рестарт?', 'pricing'],
    ['Which reset is best for my back?', 'chooseProgram'],
    ['Каква е разликата между практика и програма?', 'difference'],
  ])('keeps program and price questions with the FAQ: %s → %s', (question, id) => {
    const answer = answerQuestion(question);
    expect(answer.doc).toBeNull();
    expect(answer.entry?.id).toBe(id);
  });

  it('keeps brand history and personal history apart', () => {
    expect(answerQuestion('Кажи ми за историята на Kuko Way').entry?.id).toBe('story');
    expect(answerQuestion('Къде е историята ми?').entry?.id).toBe('journey');
  });
});
