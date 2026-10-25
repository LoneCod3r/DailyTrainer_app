import { existsSync } from 'node:fs';
import { join } from 'node:path';
import { describe, it, expect, vi, afterEach } from 'vitest';
import bg from '@/lib/i18n/dictionaries/bg';
import en from '@/lib/i18n/dictionaries/en';
import { formatCurrency } from '@/lib/format-currency';
import { getCatalog } from '@/modules/commerce/catalog';
import { localize } from '@/modules/kuko-way/types';
import { FAQ, matchFaq, type FaqEntry } from '@/modules/support/faq';

// The help assistant: fixed FAQ answers matched by keywords, all local.
// These check the matching, and that every answer points at a real page.

const APP_DIR = join(__dirname, '..', 'app');

// Static routes only; the FAQ never links to a dynamic one.
function routeExists(href: string): boolean {
  const segments = href === '/' ? [] : href.slice(1).split('/');
  return ['(app)', '(auth)'].some((group) => existsSync(join(APP_DIR, group, ...segments, 'page.tsx')));
}

function lookup(dict: object, key: string): unknown {
  return key.split('.').reduce<unknown>((node, part) => (node as Record<string, unknown> | undefined)?.[part], dict);
}

describe('matchFaq', () => {
  it.each([
    ['Where can I find practices?', 'practices'],
    ['Къде да намеря практиките?', 'practices'],
    ['What is in the Learn section?', 'learn'],
    ['Къде са статиите за фасциите?', 'learn'],
    ['Are there any videos?', 'videos'],
    ['Има ли безплатни видеа?', 'videos'],
    ['How much does a program cost?', 'pricing'],
    ['Колко струва програмата?', 'pricing'],
    ['I forgot my password', 'login'],
    ['Забравих си паролата', 'login'],
    ['How do I create an account?', 'register'],
    ['Как да се регистрирам?', 'register'],
    ['Where can I see my progress?', 'journey'],
    ['How do I contact you?', 'contact'],
    ['Как да се свържа с вас?', 'contact'],
    ['Where are the terms and conditions?', 'terms'],
    ['Where is the privacy policy?', 'privacy'],
    ['Политика за бисквитките', 'cookies'],
    ['I am new here, where do I start?', 'start'],
    ['How does the menu work?', 'navigation'],
  ])('%s → %s', (question, id) => {
    expect(matchFaq(question)?.id).toBe(id);
  });

  it.each([
    ['Здрасти', 'greeting'],
    ['Здравей!', 'greeting'],
    ['Здравейте', 'greeting'],
    ['Добър ден', 'greeting'],
    ['Hi', 'greeting'],
    ['hi!', 'greeting'],
    ['Hello', 'greeting'],
    ['Hey there', 'greeting'],
    ['Как си?', 'howAreYou'],
    ['Здравей, как си?', 'howAreYou'],
    ['Как сте?', 'howAreYou'],
    ['How are you?', 'howAreYou'],
    ['Hi, how are you?', 'howAreYou'],
    ['Thank you!', 'thanks'],
    ['Благодаря', 'thanks'],
    ['Мерси', 'thanks'],
  ])('small talk: %s → %s', (message, id) => {
    expect(matchFaq(message)?.id).toBe(id);
  });

  it.each([
    ['Hi, where are the videos?', 'videos'],
    ['Здравей, как да намеря практика?', 'practices'],
    ['Hello, I forgot my password', 'login'],
    ['Как си сменя паролата?', 'login'],
  ])('a greeting in front of a real question still answers the question: %s → %s', (question, id) => {
    expect(matchFaq(question)?.id).toBe(id);
  });

  it.each([
    ['Кой си ти?', 'identity'],
    ['Кой си?', 'identity'],
    ['Какво си ти?', 'identity'],
    ['Здравей, кой си ти?', 'identity'],
    ['Who are you?', 'identity'],
    ['What are you?', 'identity'],
    ['Hi, who are you?', 'identity'],
  ])('identity: %s → %s', (question, id) => {
    expect(matchFaq(question)?.id).toBe(id);
  });

  // Questions about the assistant itself, BG and EN, with wording variants.
  it.each([
    ['На колко си години?', 'age'],
    ['На колко си?', 'age'],
    ['Колко години имаш?', 'age'],
    ['Ти на колко години си?', 'age'],
    ['How old are you?', 'age'],
    ["What's your age?", 'age'],
    ['Как се казваш?', 'name'],
    ['Как ти е името?', 'name'],
    ['Какво ти е името?', 'name'],
    ['What is your name?', 'name'],
    ["What's your name?", 'name'],
    ['What are you called?', 'name'],
    ['Човек ли си?', 'human'],
    ['Ти човек ли си?', 'human'],
    ['Бот ли си?', 'human'],
    ['Are you human?', 'human'],
    ['Are you a real person?', 'human'],
    ['Are you a bot?', 'human'],
    ['Кой те създаде?', 'creator'],
    ['Кой те е направил?', 'creator'],
    ['Who created you?', 'creator'],
    ['Who made you?', 'creator'],
    ['Можеш ли да мислиш?', 'abilities'],
    ['Знаеш ли всичко?', 'abilities'],
    ['Всичко ли знаеш?', 'abilities'],
    ['Изкуствен интелект ли си?', 'abilities'],
    ['Can you think?', 'abilities'],
    ['Do you know everything?', 'abilities'],
    ['Are you an AI?', 'abilities'],
    ['Как можеш да ми помогнеш?', 'help'],
    ['С какво можеш да помогнеш?', 'help'],
    ['Какво можеш да правиш?', 'help'],
    ['How can you help me?', 'help'],
    ['What can you do?', 'help'],
    ['Can you help me?', 'help'],
  ])('about the assistant: %s → %s', (question, id) => {
    expect(matchFaq(question)?.id).toBe(id);
  });

  // The reported personal questions, with and without punctuation, spacing
  // and capitalisation variants.
  it.each([
    ['identity', ['Кой си ти?', 'Кой си ти', '  кой си ти?!  ', 'КОЙ СИ ТИ…', 'Who are you?', 'who are you', 'Who are you??', 'WHO ARE YOU？']],
    ['age', ['На колко си години?', 'На колко си години', 'на колко си години?!', 'How old are you?', 'how old are you', 'How old are you…']],
    ['creator', ['Кой те създаде?', 'Кой те създаде', 'кой те създаде!', 'Who created you?', 'who created you', '“Who created you?”']],
    ['human', ['Човек ли си?', 'Човек ли си', 'човек ли си?!', 'Are you human?', 'are you human', 'Are you human...']],
  ])('%s matches regardless of punctuation', (id, questions) => {
    for (const q of questions as string[]) expect(matchFaq(q)?.id, q).toBe(id);
  });

  it.each([
    ['Any prices available?', 'pricing'],
    ['How much does the 28-day reset cost?', 'pricing'],
    ['How cost 28 day reset?', 'pricing'],
    ['What are the fees?', 'pricing'],
    ['Can I buy a program?', 'pricing'],
    ['Има ли цени?', 'pricing'],
    ['Какви са цените на програмите?', 'pricing'],
    ['What are the program prices?', 'pricing'],
    ['Are there any prices?', 'pricing'],
    ['Колко струва 28-дневният рестарт?', 'pricing'],
    ['Колко струват програмите?', 'pricing'],
    ['Платени ли са програмите?', 'pricing'],
  ])('pricing: %s → %s', (question, id) => {
    expect(matchFaq(question)?.id).toBe(id);
  });

  it.each([
    ['Okay. Where I can find programs?', 'programs'],
    ['Where can I find programs?', 'programs'],
    ['Tell me about the 28 day reset', 'programs'],
    ['Къде мога да намеря програми', 'programs'],
    ['Безплатни ли са програмите?', 'programs'],
  ])('program discovery stays with Programs: %s → %s', (question, id) => {
    expect(matchFaq(question)?.id).toBe(id);
  });

  it.each([
    'Къде мога да намеря цени на практиките?',
    'Къде мога да намеря цени на практиките',
    '  КЪДЕ МОГА ДА НАМЕРЯ ЦЕНИ НА ПРАКТИКИТЕ?!  ',
    'Колко струват практиките?',
    'Колко струва тази практика?',
    'Има ли цени за практиките?',
    'Платени ли са практиките?',
    'Where can I find practice prices?',
    'Where can I find practice prices',
    'How much do the practices cost?',
    'How much does this practice cost?',
    'Are practice prices available?',
    'how much is a practice???',
    'What is the price of the practice…',
  ])('practice prices: %s → practicePricing', (question) => {
    expect(matchFaq(question)?.id).toBe('practicePricing');
  });

  it('keeps practice prices apart from neighbouring intents', () => {
    expect(matchFaq('Къде мога да намеря практиките?')?.id).toBe('practices');
    expect(matchFaq('Where can I find practices?')?.id).toBe('practices');
    expect(matchFaq('Къде са програмите?')?.id).toBe('programs');
    expect(matchFaq('Where are the programs?')?.id).toBe('programs');
    expect(matchFaq('Колко струва 28-дневният рестарт?')?.id).toBe('pricing');
    expect(matchFaq('How much does the 28-day reset cost?')?.id).toBe('pricing');
    expect(matchFaq('Any prices available?')?.id).toBe('pricing');
    expect(matchFaq('How do I reset my password?')?.id).toBe('login');
    // Not about money: time, or the word "платформа".
    expect(matchFaq('How much time does a practice take?')?.id).not.toBe('practicePricing');
    expect(matchFaq('Колко време отнема практиката?')?.id).not.toBe('practicePricing');
    expect(matchFaq('Платформа за практики ли е това?')?.id).not.toBe('practicePricing');
  });

  it('answers practice prices honestly, without amounts or claims about where prices are', () => {
    const entry = FAQ.find((e) => e.id === 'practicePricing')!;
    expect(entry.answer!.bg).toContain('нямам потвърдена информация за цените на практиките');
    expect(entry.answer!.en).toContain('don’t currently have confirmed pricing information for the practices');
    for (const text of [entry.answer!.bg, entry.answer!.en]) expect(text).not.toMatch(/\d|€|лв|eur/i);
    // Links to the practices only; nothing suggests the Library lists prices.
    expect(entry.links.map((l) => l.href)).toEqual(['/practices']);
    expect(entry.offerContact).toBe(true);
    // The compound groups use lowercase words like the keywords do.
    for (const group of entry.whenAll!) for (const w of group) expect(w).toBe(w.toLowerCase());
    // It is not the Programs or general pricing answer.
    expect(entry.answer!.en).not.toBe(FAQ.find((e) => e.id === 'programs')!.answer!.en);
    expect(entry.answer!.en).not.toBe(FAQ.find((e) => e.id === 'pricing')!.answer!.en);
  });

  it('does not let generic words hijack unrelated questions', () => {
    // "reset" is about the password here, not a Reset Program.
    expect(matchFaq('How do I reset my password?')?.id).toBe('login');
    expect(matchFaq('Как да рестартирам паролата?')?.id).toBe('login');
    // "Feel Better Now" is a practice, not a fee.
    expect(matchFaq('Where is Feel Better Now?')?.id).not.toBe('pricing');
    // "Колко е часът?" is not a price question.
    expect(matchFaq('Колко е часът?')).toBeNull();
    // Unknown questions still fall back.
    expect(matchFaq('What is the capital of France?')).toBeNull();
  });

  it('no longer sends the age question to the fallback', () => {
    expect(matchFaq('На колко си години?')).not.toBeNull();
    expect(matchFaq('How old are you?')).not.toBeNull();
  });

  it('keeps assistant phrases narrow', () => {
    // A specific topic still wins over a phrase about the assistant…
    expect(matchFaq('Как можеш да ми помогнеш с програмите?')?.id).toBe('programs');
    expect(matchFaq('Can you help me find practices?')?.id).toBe('practices');
    expect(matchFaq('Знаеш ли всичко за програмите?')?.id).toBe('programs');
    // …"what are your…" is not "what are you"…
    expect(matchFaq('What are your programs?')?.id).toBe('programs');
    // …and lone everyday words are not enough to match.
    for (const q of ['Мога ли да практикувам вечер?', 'Знам ли кога е срещата?', 'Един човек ми каза за вас', 'Помогнете', 'I think so', 'Is this real?']) {
      expect(['age', 'name', 'identity', 'human', 'creator', 'abilities', 'help']).not.toContain(matchFaq(q)?.id);
    }
    // "created" in another sense is not account creation, and vice versa.
    expect(matchFaq('Who created you?')?.id).not.toBe('register');
    expect(matchFaq('How do I create my account?')?.id).toBe('register');
  });

  it('credits Lone Coder in the creator answer, linked in both languages', () => {
    const creator = FAQ.find((e) => e.id === 'creator')!;
    expect(creator.inline).toEqual({ text: 'Lone Coder', href: 'https://lonecoder.nsh.one/' });
    // The linked text sits in the sentence itself, so only it becomes a link.
    expect(creator.answer!.bg).toContain('разработен лично от Lone Coder');
    expect(creator.answer!.en).toContain('developed by Lone Coder');
    // The URL lives on the link, never in the visible answer text.
    expect(creator.answer!.bg).not.toContain('http');
    expect(creator.answer!.en).not.toContain('http');
    // No other answer carries an inline link.
    expect(FAQ.filter((e) => e.inline).map((e) => e.id)).toEqual(['creator']);
  });

  it('answers questions about the assistant without inventing personal facts', () => {
    const ids = ['age', 'name', 'identity', 'human', 'creator', 'abilities', 'help'];
    for (const id of ids) {
      const entry = FAQ.find((e) => e.id === id)!;
      for (const text of [entry.answer!.bg, entry.answer!.en]) {
        // No ages, dates, years, people or companies, and no claims to be human or all-knowing.
        expect(text, id).not.toMatch(/\d/);
        expect(text, id).not.toMatch(/\b(I am|I'm) (a human|human|alive|conscious)\b|(?<!не )знам всичко|аз съм човек/i);
        expect(text, id).toMatch(/KUKO WAY|практик|practice|програм|program/i);
      }
    }
    expect(FAQ.find((e) => e.id === 'human')!.answer!.en).toMatch(/not a human/);
    expect(FAQ.find((e) => e.id === 'human')!.answer!.bg).toMatch(/не съм човек/);
  });

  it.each([
    ['Къде мога да намеря програми', 'programs'],
    ['Къде мога да намеря програми?', 'programs'],
    ['Where can I find programs?', 'programs'],
    ['Where can I find the programs', 'programs'],
  ])('programs, not practices: %s → %s', (question, id) => {
    expect(matchFaq(question)?.id).toBe(id);
  });

  it.each([
    ['Къде мога да намеря практики?', 'practices'],
    ['Where can I find practices?', 'practices'],
    ['How do I find a practice?', 'practices'],
    ['Как да намеря практика?', 'practices'],
    ['Търся упражнение', 'practices'],
    ['library', 'practices'],
  ])('practice questions still match: %s → %s', (question, id) => {
    expect(matchFaq(question)?.id).toBe(id);
  });

  it('treats short greetings as whole words only', () => {
    // "history" starts with "hi" but is not a greeting.
    expect(matchFaq('history')?.id).not.toBe('greeting');
    expect(matchFaq('Hilton hotel')).toBeNull();
  });

  // Regression: the bare stem 'истори' / 'history' used to send any history
  // question to Journey. KUKO WAY's own story has no FAQ answer, so these
  // get the honest "not sure I understood" fallback (SupportChat, no match).
  it.each([
    'Кажи ми за историята на Kuko Way',
    'кажи ми за историята на kuko way',
    'КАЖИ МИ ЗА ИСТОРИЯТА НА KUKO WAY!!!',
    'Кажи ми за историята на KUKO WAY?',
    'Каква е историята на KUKO WAY?',
    'Разкажи ми историята на Kuko Way.',
    'История на Kuko Way',
    'Разкажи ми историята си',
    'Tell me about the history of Kuko Way',
    'What is the history of KUKO WAY?',
    'history',
  ])('history of KUKO WAY is not Journey: %s', (question) => {
    expect(matchFaq(question)?.id).not.toBe('journey');
    expect(matchFaq(question)).toBeNull();
  });

  it.each([
    'Къде виждам напредъка си?',
    'Къде е историята ми?',
    'Къде виждам моята история?',
    'Покажи историята на практиките ми',
    'Къде е историята на практиките?',
    'Where can I see my progress?',
    'Where can I see my history?',
    'Where is my practice history?',
    'Show my streak',
  ])('the visitor’s own progress or history is Journey: %s', (question) => {
    expect(matchFaq(question)?.id).toBe('journey');
  });

  it('returns null for a question it does not recognize', () => {
    expect(matchFaq('What is the weather tomorrow?')).toBeNull();
    expect(matchFaq('')).toBeNull();
  });

  it('matches keywords only at the start of a word', () => {
    // "today" must not hit the "day" keyword of Programs.
    expect(matchFaq('What happened today?')).toBeNull();
  });

  it('is case- and punctuation-insensitive', () => {
    expect(matchFaq('PRIVACY!!!')?.id).toBe('privacy');
  });
});

describe('FAQ content', () => {
  it('has unique ids', () => {
    const ids = FAQ.map((e) => e.id);
    expect(new Set(ids).size).toBe(ids.length);
  });

  it('answers every entry in both languages (or defers to the contact address)', () => {
    for (const entry of FAQ) {
      if (entry.answer === null) {
        expect(entry.id).toBe('contact');
        continue;
      }
      expect(entry.answer.bg.trim()).not.toBe('');
      expect(entry.answer.en.trim()).not.toBe('');
    }
  });

  it('uses lowercase keywords, so they can match the normalized question', () => {
    for (const entry of FAQ) {
      for (const keyword of entry.keywords) expect(keyword).toBe(keyword.toLowerCase());
    }
  });

  it('links only to pages that exist, with readable labels in both languages', () => {
    for (const entry of FAQ) {
      for (const link of entry.links) {
        expect(routeExists(link.href), link.href).toBe(true);
        for (const label of [link.label.bg, link.label.en]) {
          expect(label.trim(), link.href).not.toBe('');
          // A label reads like words, never like an address.
          expect(label, link.href).not.toMatch(/https?:|www\.|localhost|\.(com|bg|dev)|^\//i);
        }
      }
    }
  });

  it('has the chat window strings in both languages', () => {
    for (const key of ['welcome', 'title', 'conversationLabel', 'noMatch', 'placeholder', 'inputLabel', 'send', 'close', 'openLabel']) {
      expect(typeof lookup(bg, `supportChat.${key}`), key).toBe('string');
      expect(typeof lookup(en, `supportChat.${key}`), key).toBe('string');
    }
  });

  it('names the assistant Тед / Ted (one "d") and shows his portrait', () => {
    expect(lookup(bg, 'supportChat.title')).toBe('Тед');
    expect(lookup(en, 'supportChat.title')).toBe('Ted');
    expect(lookup(bg, 'supportChat.welcome')).toBe('Здравей! Аз съм Тед, виртуалният асистент на Kuko Way. С какво мога да помогна?');
    expect(lookup(en, 'supportChat.welcome')).toBe('Hi! I’m Ted, the Kuko Way virtual assistant. How can I help?');
    for (const id of ['name', 'identity']) {
      const answer = FAQ.find((e) => e.id === id)!.answer!;
      expect(answer.bg, id).toContain('Тед');
      expect(answer.en, id).toContain('Ted');
    }
    // Every visible chat text: the name is never spelled with two d's.
    const visible = [
      JSON.stringify(lookup(bg, 'supportChat')),
      JSON.stringify(lookup(en, 'supportChat')),
      ...FAQ.flatMap((e) => (e.answer ? [e.answer.bg, e.answer.en] : [])),
    ].join('\n');
    expect(visible).not.toMatch(/Тедд|Tedd/i);
    // The portrait SupportChat imports (components/support/SupportChat.tsx).
    expect(existsSync(join(__dirname, '..', 'tedd-avatar.jpeg'))).toBe(true);
  });

  it('answers the topics the welcome message invites', () => {
    // The welcome invites questions about practices and programs.
    expect(matchFaq('практики')?.id).toBe('practices');
    expect(matchFaq('програми')?.id).toBe('programs');
    expect(matchFaq('practices')?.id).toBe('practices');
    expect(matchFaq('programs')?.id).toBe('programs');
  });

  it('gives every entry a question in both languages that matches the entry again', () => {
    // These questions stand in for a visitor's message after a language
    // switch, so each must lead back to the same answer.
    for (const entry of FAQ) {
      for (const lang of ['bg', 'en'] as const) {
        const question = entry.question[lang];
        expect(question.trim(), `${entry.id} ${lang}`).not.toBe('');
        expect(matchFaq(question)?.id, `${entry.id} ${lang}: ${question}`).toBe(entry.id);
      }
    }
  });

  it('has one creator answer, crediting Lone Coder, and no stale variant', () => {
    const all = FAQ.flatMap((e) => (e.answer ? [e.answer.bg, e.answer.en] : [])).join('\n');
    expect(all).not.toContain('Аз съм част от сайта');
    expect(all).not.toContain('I’m part of the KUKO WAY website');
    expect(FAQ.filter((e) => e.answer && /Lone Coder/.test(e.answer.bg + e.answer.en)).map((e) => e.id)).toEqual(['creator']);
    expect(new Set(FAQ.map((e) => e.id)).size).toBe(FAQ.length);
  });

  it('gives the Reset Program prices from the catalog, with the contact address and a relative Programs link', () => {
    const pricing = FAQ.find((e) => e.id === 'pricing')!;
    // Unit tests run outside production, where the Programs page shows the
    // catalog prices (pricingPreview and programsPreview on, checkout off).
    expect(pricing.answer!.en).toBe(
      'The Reset Programs are one-time payments: 1 Day Reset – €19, 3 Day Reset – €39, 7 Day Reset – €79 and 28 Day Reset – €149. Purchasing isn’t open yet – the prices are shown for preview. See them on the Programs page.',
    );
    for (const [name, amount] of [
      ['Еднодневен ресет', '19'],
      ['3-дневен ресет', '39'],
      ['7-дневен ресет', '79'],
      ['28-дневен ресет', '149'],
    ]) {
      expect(pricing.answer!.bg).toMatch(new RegExp(`${name} — ${amount}\\s€`));
    }
    // The Bulgarian answer uses Bulgarian names, never the English ones.
    expect(pricing.answer!.bg).not.toMatch(/Day Reset/);
    expect(pricing.answer!.bg).toContain('Програмите за рестарт се заплащат еднократно');
    expect(pricing.answer!.bg).toContain('Покупките все още не са отворени');
    expect(pricing.answer!.bg).toContain('страницата „Програми“');
    for (const text of [pricing.answer!.bg, pricing.answer!.en]) {
      expect(text).not.toMatch(/confirmed|потвърдена/i);
      // Programs only: no subscription periods, Community or Trainer prices.
      expect(text).not.toMatch(/month|year|месец|година|190|1[ ,.]?490/);
    }
    expect(pricing.offerContact).toBe(true);
    expect(pricing.links).toEqual([{ href: '/practices/programs', label: { bg: 'Виж програмите', en: 'See the programs' } }]);
  });

  it('keeps the pricing answer in step with the catalog, with Bulgarian names in Bulgarian only', () => {
    const pricing = FAQ.find((e) => e.id === 'pricing')!;
    const bgNames: Record<string, string> = {
      'reset-1-day': 'Еднодневен ресет',
      'reset-3-days': '3-дневен ресет',
      'reset-7-days': '7-дневен ресет',
      'reset-28-days': '28-дневен ресет',
    };
    const programs = getCatalog().filter((p) => p.kind === 'PROGRAM');
    expect(programs.map((p) => p.slug).sort()).toEqual(Object.keys(bgNames).sort());
    for (const product of programs) {
      // The catalog keeps its canonical English product names.
      expect(product.title.bg).toMatch(/^\d+ Day Reset$/);
      for (const locale of ['bg', 'en'] as const) {
        const price = formatCurrency(product.prices[0].amount, product.prices[0].currency, locale, { trimZeroCents: true });
        const name = locale === 'bg' ? bgNames[product.slug] : localize(product.title, locale).value;
        expect(pricing.answer![locale]).toContain(`${name} ${locale === 'bg' ? '—' : '–'} ${price}`);
      }
    }
  });

  it('contains no email addresses, URLs to other sites, or prices outside the pricing answer', () => {
    const texts = (entries: FaqEntry[]) => entries.flatMap((e) => (e.answer ? [e.answer.bg, e.answer.en] : [])).join('\n');
    const answers = texts(FAQ);
    expect(answers).not.toMatch(/[\w.+-]+@[\w-]+\.\w+/);
    expect(answers).not.toMatch(/https?:\/\//);
    expect(texts(FAQ.filter((e) => e.id !== 'pricing'))).not.toMatch(/[€$\d]|\b(eur|bgn)\b|лв/i);
    expect(FAQ.every((e) => e.links.every((l) => l.href.startsWith('/')))).toBe(true);
  });

  it('keeps internal links relative, with no localhost or other local origin', () => {
    const everything = JSON.stringify(FAQ);
    expect(everything).not.toMatch(/localhost|127\.0\.0\.1|0\.0\.0\.0|:\d{2,5}\//i);
    for (const entry of FAQ) {
      for (const link of entry.links) {
        // Root-relative path: "/x", never protocol-relative "//host" or a full URL.
        expect(link.href, link.href).toMatch(/^\/(?!\/)[a-z0-9/-]*$/);
      }
    }
  });

  it('describes programs as their own section, not as practices', () => {
    const programs = FAQ.find((e) => e.id === 'programs')!;
    expect(programs.links[0].href).toBe('/practices/programs');
    expect(programs.answer!.bg).toContain('„Програми“');
    expect(programs.answer!.en).toContain('Programs section');
  });
});

// The pricing answer follows the same flags as the Programs page. Each case
// reloads the FAQ with the flags it needs.
describe('pricing answer under the feature flags', () => {
  afterEach(() => {
    vi.doUnmock('@/lib/features');
    vi.resetModules();
  });

  async function pricingWith(flags: { pricingPreview: boolean; programsPreview: boolean; programCheckout: boolean }) {
    vi.resetModules();
    vi.doMock('@/lib/features', async (importOriginal) => {
      const actual = await importOriginal<typeof import('@/lib/features')>();
      return { features: { ...actual.features, ...flags } };
    });
    const { FAQ: faq } = await import('@/modules/support/faq');
    return faq.find((e) => e.id === 'pricing')!;
  }

  // The questions from the Preview bug report, in both languages, all reach
  // this one answer, whichever flags are on.
  const QUESTIONS = ['Какви са цените на програмите?', 'Има ли цени?', 'What are the program prices?', 'Are there any prices?'];

  it('lists the catalog prices as one-time payments while the Programs page shows them', async () => {
    const pricing = await pricingWith({ pricingPreview: true, programsPreview: true, programCheckout: false });
    const { matchFaq: match } = await import('@/modules/support/faq');
    for (const q of QUESTIONS) expect(match(q)?.answer, q).toEqual(pricing.answer);
    expect(pricing.answer!.bg).toMatch(
      /^Програмите за рестарт се заплащат еднократно: Еднодневен ресет — 19\s€, 3-дневен ресет — 39\s€, 7-дневен ресет — 79\s€ и 28-дневен ресет — 149\s€\./,
    );
    expect(pricing.answer!.en).toMatch(
      /^The Reset Programs are one-time payments: 1 Day Reset – €19, 3 Day Reset – €39, 7 Day Reset – €79 and 28 Day Reset – €149\./,
    );
    expect(pricing.links[0].href).toBe('/practices/programs');
  });

  it('says plainly that prices are not published while the Programs page hides them', async () => {
    for (const flags of [
      { pricingPreview: false, programsPreview: true, programCheckout: false },
      { pricingPreview: true, programsPreview: false, programCheckout: false },
      { pricingPreview: false, programsPreview: false, programCheckout: false },
    ]) {
      const pricing = await pricingWith(flags);
      const { matchFaq: match } = await import('@/modules/support/faq');
      for (const q of QUESTIONS) expect(match(q)?.answer, `${q} ${JSON.stringify(flags)}`).toEqual(pricing.answer);
      expect(pricing.answer!.bg).toBe(
        'Цените на програмите за рестарт все още не са публикувани в сайта, затова не мога да ги посоча. Програмите се заплащат еднократно – не са абонамент. Актуалната информация е на страницата „Програми“.',
      );
      expect(pricing.answer!.en).toBe(
        'The Reset Program prices aren’t published on the site yet, so I can’t list them. The programs are one-time payments, not subscriptions. The Programs page has the current information.',
      );
      // Never claims prices or a purchase are available.
      for (const text of [pricing.answer!.bg, pricing.answer!.en]) expect(text).not.toMatch(/[€$\d]|confirmed|потвърдена|preview|преглед/i);
      expect(pricing.links[0].href).toBe('/practices/programs');
    }
  });

  it('relies on no program being published yet', async () => {
    // With `programsPreview` off, the page shows only published programs.
    // While none is published, it shows no program price at all, which the
    // flag-off answer above states. Publishing a program makes that untrue:
    // update programPricing (modules/support/faq.ts) before changing this.
    const { getAllProgramsUnfiltered } = await import('@/modules/programs/service');
    expect(getAllProgramsUnfiltered().filter((p) => p.published).map((p) => p.slug)).toEqual([]);
  });

  it('drops the "purchasing isn’t open yet" note once checkout is on', async () => {
    const pricing = await pricingWith({ pricingPreview: true, programsPreview: true, programCheckout: true });
    expect(pricing.answer!.en).toContain('28 Day Reset – €149');
    expect(pricing.answer!.en).not.toContain('Purchasing isn’t open yet');
    expect(pricing.answer!.bg).not.toContain('Покупките все още не са отворени');
    expect(pricing.answer!.bg).toMatch(/28-дневен ресет — 149\s€/);
  });
});
