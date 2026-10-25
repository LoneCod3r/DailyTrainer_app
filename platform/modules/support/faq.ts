// The help assistant's answers: a fixed FAQ about the site, matched to the
// visitor's question by simple keywords. Everything runs in the browser; no
// AI model, API or storage is involved.
//
// Answers describe only what the site really has (routes from app/(app),
// navigation from components/layout/nav.ts). Facts about KUKO WAY itself
// come from the approved handbook (modules/kuko-way/content/start-here.ts)
// and the practice overview, never from elsewhere. No prices, policies or contact
// details are written here: the program prices are read from the catalog
// under the same feature flags as the Programs page (see programPricing),
// and the contact address comes from the admin settings at runtime.
import { features } from '@/lib/features';
import { formatCurrency } from '@/lib/format-currency';
import type { Locale } from '@/lib/i18n/locale';
import { getCatalog } from '@/modules/commerce/catalog';
import { localize } from '@/modules/kuko-way/types';

type Text = Record<Locale, string>;

// href is always a site-relative path; label is the readable link text.
export type FaqLink = { href: string; label: Text };

// An external link inside the answer sentence itself: `text` appears word
// for word in the answer in both languages, and only that text is linked.
export type FaqInlineLink = { text: string; href: string };

export type FaqEntry = {
  id: string;
  // Lowercase word beginnings (BG and EN). Stems rather than whole words,
  // so "практики", "практиката" and "practicing" all match. A trailing space
  // makes a keyword a whole word: 'hi ' matches "hi" but not "history".
  keywords: string[];
  // null: the answer is the contact address configured in the admin
  // settings, which only the page knows (see SupportChat).
  answer: Text | null;
  links: FaqLink[];
  inline?: FaqInlineLink;
  // Add the configured contact address after the answer, when there is one.
  offerContact?: true;
  // A compound intent: the entry wins outright when the question hits every
  // group (e.g. a price word and a practice word), whatever the plain
  // keyword counts say. Checked before keyword scoring (see matchFaq).
  whenAll?: string[][];
  // The question this entry answers, in each language. When the site
  // language changes, a visitor's message that matched this entry is shown
  // as this question in the new language (their own words come back when
  // they switch back).
  question: Text;
};

// Words about price, cost and paying (BG and EN). Shared by the general
// pricing answer and by compound intents such as practice prices. Plain
// "how much" is left to the general pricing answer only: in "How much time
// does a practice take?" it isn't about money.
const PRICE_WORDS = [
  'price',
  'cost',
  'how much is',
  'how much are',
  'fee ',
  'fees',
  'pay ',
  'paid',
  'payment',
  'buy ',
  'purchase ',
  'цена',
  'цени',
  'цената',
  'струва',
  'такса',
  'платен',
  'платена',
  'платени',
  'платено',
  'платя',
  'плати ',
  'плащ',
  'купя',
  'купувам',
  'купи ',
  'покупк',
];

// The visitor's own history of practice (BG and EN), for Journey. Whole
// phrases with "my" / "ми" / "моята" or "practice", so a question about
// some other history ("историята на Kuko Way") doesn't match. Not
// "историята си": in "Разкажи ми историята си" it means the assistant's.
const PERSONAL_HISTORY = [
  'my history',
  'practice history',
  'моята истори',
  'историята ми ',
  'история на практик',
  'историята на практик',
];

// Word groups for compound intents (see whenAll). Whole phrases or narrow
// stems only: each group is one half of a question, never enough alone.
const PRACTICE_WORDS = ['practice', 'practise', 'практик'];
const PROGRAM_WORDS = ['program', 'програм', 'reset', 'ресет', 'рестарт'];
const HELP_WORDS = ['help', 'problem', 'issue', 'question', 'wrong', 'support', 'помощ', 'проблем', 'въпрос', 'грешн', 'съдейств'];
// KUKO WAY's own story (content/start-here.ts, "What Is KUKO WAY?"), always
// together with the brand, so "my history" stays with Journey and a bare
// "история" / "history" matches nothing. Not 'създа' (also "създам профил").
const BRAND_WORDS = ['kuko', 'куко'];
const BRAND_HISTORY_WORDS = ['history', 'story', 'founded', 'founder', 'created', 'origin', 'истори', 'създаде', 'създаден', 'създал', 'създател', 'основан', 'основател', 'произход', 'възник'];

// Bulgarian program names for the assistant's answer, by catalog slug. The
// catalog titles (shown on the site) stay the English product names; a
// program missing here falls back to its catalog title.
const PROGRAM_NAMES_BG: Record<string, string> = {
  'reset-1-day': 'Еднодневен ресет',
  'reset-3-days': '3-дневен ресет',
  'reset-7-days': '7-дневен ресет',
  'reset-28-days': '28-дневен ресет',
};

function programName(slug: string, title: string, locale: Locale): string {
  return (locale === 'bg' && PROGRAM_NAMES_BG[slug]) || title;
}

// The Reset Program prices, exactly as the Programs page shows them: from
// the catalog (modules/commerce/catalog.ts, the single source of displayed
// prices), formatted like PriceTag. The page shows them only while
// `pricingPreview` is on and the program tiles are visible, which, with no
// program published yet, takes `programsPreview` (modules/programs/service).
// Otherwise the site shows no program price anywhere (the program overview
// gates its price on `pricingPreview` too), so the answer says so plainly,
// names no amounts and points to the page. A test guards the "no program
// published yet" assumption. While checkout is off, it repeats the page's
// note that purchasing isn't open yet.
function programPricing(): Text {
  const showPrices = features.pricingPreview && features.programsPreview;
  if (!showPrices) {
    return {
      bg: 'Цените на програмите за рестарт все още не са публикувани в сайта, затова не мога да ги посоча. Програмите се заплащат еднократно – не са абонамент. Актуалната информация е на страницата „Програми“.',
      en: 'The Reset Program prices aren’t published on the site yet, so I can’t list them. The programs are one-time payments, not subscriptions. The Programs page has the current information.',
    };
  }
  const list = (locale: Locale, and: string) => {
    const items = getCatalog()
      .filter((product) => product.kind === 'PROGRAM')
      .map(
        (product) =>
          `${programName(product.slug, localize(product.title, locale).value, locale)} ${locale === 'bg' ? '—' : '–'} ${formatCurrency(product.prices[0].amount, product.prices[0].currency, locale, { trimZeroCents: true })}`,
      );
    return `${items.slice(0, -1).join(', ')} ${and} ${items[items.length - 1]}`;
  };
  const closed = !features.programCheckout;
  return {
    bg: `Програмите за рестарт се заплащат еднократно: ${list('bg', 'и')}.${closed ? ' Покупките все още не са отворени – цените са показани за преглед.' : ''} Виж ги на страницата „Програми“.`,
    en: `The Reset Programs are one-time payments: ${list('en', 'and')}.${closed ? ' Purchasing isn’t open yet – the prices are shown for preview.' : ''} See them on the Programs page.`,
  };
}

// Where a program's price appears before paying: the Programs page and the
// program's own page, under the same flags as programPricing (the overview
// gates its price on `pricingPreview` too). It names no amounts and never
// says purchasing is open: in production a purchase button can still read
// "Coming soon" (checkout also needs a Stripe test key, server-side only).
function priceBeforePaying(): Text {
  if (!(features.pricingPreview && features.programsPreview)) {
    return {
      bg: 'Цените на програмите все още не са публикувани в сайта. Когато бъдат, ще ги виждаш на страницата „Програми“ и на страницата на всяка програма – преди каквато и да е стъпка за плащане.',
      en: 'Program prices aren’t published on the site yet. Once they are, you’ll see them on the Programs page and on each program’s own page – before any payment step.',
    };
  }
  const closed = !features.programCheckout;
  return {
    bg: `Цената на всяка програма е показана на страницата „Програми“ и на страницата на самата програма – преди каквато и да е стъпка за плащане. Плащането е еднократно, програмите не са абонамент.${closed ? ' Покупките все още не са отворени – цените са показани за преглед.' : ''}`,
    en: `Every program shows its price on the Programs page and on its own page – before any payment step. The payment is one-time; the programs are not subscriptions.${closed ? ' Purchasing isn’t open yet – the prices are shown for preview.' : ''}`,
  };
}

// Which Reset Program fits: each one's role in the client's own words (the
// catalog tagline), plus the handbook's advice to move on gradually from
// Start Here to longer programs (content/start-here.ts, "Development of
// Fascial Maneuver Training"). No personal recommendation is made.
function chooseProgram(): Text {
  const list = (locale: Locale, and: string) => {
    const items = getCatalog()
      .filter((product) => product.kind === 'PROGRAM')
      .map((product) => {
        const tagline = localize(product.tagline, locale).value;
        return `${programName(product.slug, localize(product.title, locale).value, locale)} – ${tagline.charAt(0).toLowerCase()}${tagline.slice(1)}`;
      });
    return `${items.slice(0, -1).join(', ')} ${and} ${items[items.length - 1]}`;
  };
  return {
    bg: `Всяка програма за рестарт има своя роля: ${list('bg', 'и')}. Според наръчника е добре да започнеш с „Започни тук“ и постепенно да преминеш към по-дълги и структурирани програми. Програмите още се подготвят – страницата „Програми“ показва кои са налични.`,
    en: `Each Reset Program has its own role: ${list('en', 'and')}. The handbook suggests beginning with Start Here and gradually moving on to longer, more structured programs. The programs are still being prepared – the Programs page shows which are available.`,
  };
}

export const FAQ: FaqEntry[] = [
  {
    id: 'practicePricing',
    question: { bg: 'Колко струват практиките?', en: 'How much do the practices cost?' },
    keywords: [],
    whenAll: [PRICE_WORDS, ['practice', 'practise', 'практик']],
    answer: {
      bg: 'В момента нямам потвърдена информация за цените на практиките. Можеш да разгледаш практиките в сайта. Ако търсиш цена на конкретна практика, провери официалната информация за нея или се свържи с екипа на KUKO WAY.',
      en: 'I don’t currently have confirmed pricing information for the practices. You can browse the practices on the website. For the price of a specific practice, check its official information or contact the KUKO WAY team.',
    },
    links: [{ href: '/practices', label: { bg: 'Виж практиките', en: 'See the practices' } }],
    offerContact: true,
  },
  {
    id: 'start',
    question: { bg: 'Откъде да започна?', en: 'Where should I start?' },
    keywords: ['start', 'begin', 'new here', 'first', 'започ', 'начин', 'нов съм', 'нова съм', 'първ'],
    answer: {
      bg: 'Започни от „Започни тук“ – наръчника за начинаещи. Първо се запознай с KUKO WAY и неговите убеждения, после с основите на практиката, съветите за начало и какво да очакваш. Накрая те очаква първата практика – „Сканиране на тялото #1“, а напредъка си следиш в „Път“.',
      en: 'Begin with Start Here – the beginner’s guide. First get to know KUKO WAY and its beliefs, then the foundations of the practice, the tips for getting started and what to expect. It ends with your first practice, Body Scan #1, and you can follow your progress in Journey.',
    },
    links: [
      { href: '/practices/start-here', label: { bg: 'Отвори „Започни тук“', en: 'Open Start Here' } },
      { href: '/journey', label: { bg: 'Виж „Път“', en: 'See Journey' } },
    ],
  },
  {
    id: 'learn',
    question: { bg: 'Какво има в „Знание“?', en: 'What is in Learn?' },
    keywords: ['learn', 'article', 'handbook', 'fascia', 'chapter', 'read', 'знание', 'статия', 'статии', 'наръчник', 'фасци', 'глав', 'чета', 'прочет'],
    answer: {
      bg: '„Знание“ е справочната част за тялото и фасцията: главите от наръчника – развитието на обучението по фасциални маневри, какво е фасция, какво е фасциална маневра, зоните на тялото и основите на тялото – както и статиите. Можеш да го четеш по всяко време, независимо дали практикуваш.',
      en: 'Learn is the reference part about the body and fascia: the handbook chapters – the development of fascial maneuver training, what fascia is, what a fascial maneuver is, the body zones and the foundations of the body – plus the articles. You can read it at any time, whether or not you practise.',
    },
    links: [{ href: '/learn', label: { bg: 'Отвори „Знание“', en: 'Open Learn' } }],
  },
  {
    id: 'practices',
    question: { bg: 'Къде да намеря практиките?', en: 'Where can I find the practices?' },
    keywords: ['practice', 'practise', 'exercise', 'maneuver', 'library', 'search', 'практик', 'упражнен', 'маневр', 'библиотек', 'търс'],
    answer: {
      bg: 'Практиките са водени фасциални маневри: всяка съчетава намерение, движение и дишане, за да намали усещането за напрежение и ограничение в движението, и се води стъпка по стъпка. Практиките са в раздел „Практика“ – с „Започни тук“, „Почувствай се по-добре сега“ и „Библиотека“, където търсиш по име.',
      en: 'Practices are guided fascial maneuvers: each combines intention, movement and breathing to reduce the sensation of tension and restriction in movement, and guides you step by step. Practices are in the Practice section – Start Here, Feel Better Now and the Library, where you can search by name.',
    },
    links: [
      { href: '/practices', label: { bg: 'Виж практиките', en: 'See the practices' } },
      { href: '/practices/library', label: { bg: 'Отвори библиотеката', en: 'Open the Library' } },
    ],
  },
  {
    id: 'videos',
    question: { bg: 'Има ли видеа?', en: 'Are there any videos?' },
    keywords: ['video', 'youtube', 'watch', 'видео', 'видеа', 'гледа', 'ютюб'],
    // Any question naming videos is about Free Videos, even "free videos"
    // (which the compound "free" intent would otherwise take).
    whenAll: [['video', 'youtube', 'видео', 'видеа', 'ютюб']],
    answer: {
      bg: 'В „Безплатни видеа“ има практики и обяснения от YouTube канала на KUKO WAY.',
      en: 'Free Videos has practices and explanations from the KUKO WAY YouTube channel.',
    },
    links: [{ href: '/practices/free-videos', label: { bg: 'Виж видеата', en: 'See the videos' } }],
  },
  {
    id: 'pricing',
    question: { bg: 'Колко струват програмите?', en: 'How much do the programs cost?' },
    keywords: [...PRICE_WORDS, 'how much'],
    answer: programPricing(),
    links: [{ href: '/practices/programs', label: { bg: 'Виж програмите', en: 'See the programs' } }],
    offerContact: true,
  },
  {
    // "You have full access to the practice for free" (account.hub), a free
    // account keeps progress (journey.accountInviteDesc); programs are the
    // paid, one-time products (commerce/catalog.ts). A compound so "Are the
    // programs free?" gets this rather than the Programs answer.
    id: 'free',
    question: { bg: 'Има ли безплатно съдържание?', en: 'Is any content free?' },
    keywords: [],
    whenAll: [['free', 'безплат', 'no cost', 'without paying', 'без пари', 'без да плащам']],
    answer: {
      bg: 'Да. Практиките в „Започни тук“, „Почувствай се по-добре сега“ и „Библиотека“, както и „Знание“ и „Безплатни видеа“, са безплатни. С безплатен профил практиката, бележките и програмите ти се пазят и те следват на всяко устройство. Платени са програмите за рестарт – с еднократно плащане.',
      en: 'Yes. The practices in Start Here, Feel Better Now and the Library, as well as Learn and Free Videos, are free. With a free account your practice, notes and programs are kept and follow you to any device. The Reset Programs are the paid part, with a one-time payment.',
    },
    links: [
      { href: '/practices', label: { bg: 'Виж практиките', en: 'See the practices' } },
      { href: '/register', label: { bg: 'Създай безплатен профил', en: 'Create a free account' } },
    ],
  },
  {
    id: 'priceBeforePaying',
    question: { bg: 'Как да разбера цената, преди да платя?', en: 'How can I check the price before paying?' },
    keywords: [],
    whenAll: [['price', 'cost', 'how much', 'цена', 'цени', 'цената', 'струва'], ['before', 'преди']],
    answer: priceBeforePaying(),
    links: [{ href: '/practices/programs', label: { bg: 'Виж програмите', en: 'See the programs' } }],
  },
  {
    // Purchases are listed on /account (ProgramPurchases); payment method and
    // invoices on /account/billing. No refund policy is documented, so none
    // is mentioned; the contact address is added when one is configured.
    id: 'paymentHelp',
    question: { bg: 'Къде да потърся помощ за плащане?', en: 'Where can I get help with a payment?' },
    keywords: [],
    whenAll: [['payment', 'paid', 'pay ', 'charge', 'invoice', 'refund', 'billing', 'плащан', 'платих', 'платено', 'таксув', 'фактур', 'възстанов'], HELP_WORDS],
    answer: {
      bg: 'Закупените програми се виждат в профила ти, а начинът на плащане и фактурите – в „Профил“ → „Плащания“. За въпрос относно конкретно плащане се обърни към екипа на KUKO WAY – адресът за контакт се показва тук, когато е публикуван.',
      en: 'Purchased programs are listed in your profile, and your payment method and invoices are under Profile → Billing. For a question about a specific payment, contact the KUKO WAY team – the contact address is shown here once it’s published.',
    },
    links: [
      { href: '/account', label: { bg: 'Отвори профила', en: 'Open your profile' } },
      { href: '/account/billing', label: { bg: 'Плащания', en: 'Billing' } },
    ],
    offerContact: true,
  },
  {
    id: 'programs',
    question: { bg: 'Къде да намеря програмите?', en: 'Where can I find the programs?' },
    keywords: ['program', 'day reset', 'reset program', 'програм', 'ресет ', 'рестарт '],
    answer: {
      bg: 'Програмите за рестарт имат собствен раздел „Програми“ – отделно от практиките. Те са водени програми от един, три, седем или двадесет и осем дни и още се подготвят – страницата показва дали някоя вече е налична.',
      en: 'The Reset Programs have their own Programs section, separate from the practices. They are guided programs of one, three, seven or twenty-eight days and are still being prepared – the page shows whether any is available yet.',
    },
    links: [{ href: '/practices/programs', label: { bg: 'Виж програмите', en: 'See the programs' } }],
  },
  {
    // Programs: Program → Phase → Day, days unlocking in order
    // (docs/v1-implementation-notes.md, P5/P6); practices are free.
    id: 'difference',
    question: { bg: 'Каква е разликата между практика и програма?', en: 'What is the difference between a practice and a program?' },
    keywords: [],
    whenAll: [['difference', 'differ', 'versus', 'vs ', 'compare', 'разлик', 'различ', 'сравн'], PRACTICE_WORDS, PROGRAM_WORDS],
    answer: {
      bg: 'Практиката е една водена сесия с фасциални маневри, която можеш да направиш по всяко време, и е безплатна. Програмата за рестарт е водена поредица от един, три, седем или двадесет и осем дни, в която дните се отключват един след друг, и се заплаща еднократно. Програмите още се подготвят – страницата „Програми“ показва кои са налични.',
      en: 'A practice is a single guided session of fascial maneuvers that you can do at any time, and it’s free. A Reset Program is a guided series of one, three, seven or twenty-eight days in which the days unlock one after another, with a one-time payment. The programs are still being prepared – the Programs page shows which are available.',
    },
    links: [
      { href: '/practices', label: { bg: 'Виж практиките', en: 'See the practices' } },
      { href: '/practices/programs', label: { bg: 'Виж програмите', en: 'See the programs' } },
    ],
  },
  {
    id: 'chooseProgram',
    question: { bg: 'Коя програма да избера?', en: 'Which program should I choose?' },
    keywords: [],
    whenAll: [['which', 'what program', 'choose', 'pick', 'select', 'recommend', 'коя ', 'каква програма', 'избера', 'избор', 'препоръч'], PROGRAM_WORDS],
    answer: chooseProgram(),
    links: [
      { href: '/practices/start-here', label: { bg: 'Отвори „Започни тук“', en: 'Open Start Here' } },
      { href: '/practices/programs', label: { bg: 'Виж програмите', en: 'See the programs' } },
    ],
  },
  {
    // The practices have no duration field: "the source never specifies one"
    // (content/practices.ts). The only figure is the handbook's ~15-minute
    // reset (content/start-here.ts, "Development of Fascial Maneuver
    // Training"); the timer and the minutes in Journey are in the app.
    id: 'duration',
    question: { bg: 'Колко време отнема една практика?', en: 'How long does a practice take?' },
    keywords: [],
    whenAll: [['how long', 'how much time', 'how many minutes', 'duration', 'колко време', 'колко продължава', 'колко минути', 'продължителност'], [...PRACTICE_WORDS, 'maneuver', 'маневр', 'session', 'сесия']],
    answer: {
      bg: 'Практиките нямат фиксирана продължителност – следваш стъпките в собственото си темпо, а движенията се правят бавно. За ориентир: първите три маневри от наръчника – „Плъзгане по небцето“, „Пълно усукване“ и „Антигравитация“ – съставят приблизително 15-минутен рестарт за напрежение. По време на практиката има таймер, а минутите се отчитат в „Път“.',
      en: 'Practices have no fixed length – you follow the steps at your own pace, moving slowly. As a guide: the handbook’s first three maneuvers – Palate Swipe, Totally Twisted and Antigravity – form an approximately 15-minute reset for tension. A timer runs during the practice, and your minutes are counted in Journey.',
    },
    links: [
      { href: '/learn/razvitie-na-obuchenieto', label: { bg: 'Прочети „Развитие на обучението“', en: 'Read “Development of the Training”' } },
      { href: '/practices/library', label: { bg: 'Отвори библиотеката', en: 'Open the Library' } },
    ],
  },
  {
    // Each practice page shows its intro, benefits, steps and safety note
    // (modules/kuko-way/search.ts); signed-out visitors can practise
    // (docs/v1-implementation-notes.md).
    id: 'browse',
    question: { bg: 'Мога ли да разглеждам практиките, преди да избера?', en: 'Can I browse the practices before choosing?' },
    keywords: ['browse', 'look around', 'before choosing', 'before i choose', 'разглежд', 'разгледам', 'преди да избера', 'преди да започна'],
    answer: {
      bg: 'Да. Всяка практика има собствена страница с описание и стъпките, а където е нужно – и бележка за безопасност, така че можеш да я прочетеш, преди да започнеш. Разгледай „Библиотека“ или „Почувствай се по-добре сега“. За да практикуваш, не ти трябва профил.',
      en: 'Yes. Every practice has its own page with a description and the steps, plus a safety note where needed, so you can read it before you start. Browse the Library or Feel Better Now. You don’t need an account to practise.',
    },
    links: [
      { href: '/practices/library', label: { bg: 'Отвори библиотеката', en: 'Open the Library' } },
      { href: '/practices/feel-better-now', label: { bg: 'Почувствай се по-добре сега', en: 'Feel Better Now' } },
    ],
  },
  {
    // The Library search covers the title and the page text (intro,
    // benefits, steps, safety note) in both languages (search.ts).
    id: 'findPractice',
    question: { bg: 'Как да намеря конкретна практика?', en: 'How do I find a specific practice?' },
    keywords: [],
    whenAll: [['find', 'search', 'look for', 'locate', 'намер', 'търс'], ['specific', 'particular', 'certain', 'by name', 'конкретн', 'определен', 'по име']],
    answer: {
      bg: 'Отвори „Библиотека“ и потърси по име – търсенето разпознава заглавията на български и английски, както и текста от страницата на практиката. Ако не си сигурен коя ти трябва, „Почувствай се по-добре сега“ ти помага бързо да избереш и да започнеш.',
      en: 'Open the Library and search by name – the search recognises titles in Bulgarian and English, as well as the text on the practice’s page. If you’re not sure which one you need, Feel Better Now helps you choose quickly and start.',
    },
    links: [
      { href: '/practices/library', label: { bg: 'Отвори библиотеката', en: 'Open the Library' } },
      { href: '/practices/feel-better-now', label: { bg: 'Почувствай се по-добре сега', en: 'Feel Better Now' } },
    ],
  },
  {
    id: 'journey',
    question: { bg: 'Къде виждам напредъка си?', en: 'Where can I see my progress?' },
    keywords: ['journey', 'progress', 'statistic', 'favorite', 'favourite', 'note', 'streak', 'път', 'напред', 'статистик', 'любим', 'бележк', 'серия'],
    // "History" only as the visitor's own (practice) history, never a bare
    // 'history' / 'истори', which also caught "the history of KUKO WAY".
    // A compound so "my practice history" wins over the practice keyword.
    whenAll: [PERSONAL_HISTORY],
    answer: {
      bg: '„Път“ показва напредъка ти – завършени практики, минути, дни с практика, скорошните ти практики, програми, любими практики и бележки. Без вход напредъкът се пази на устройството и се добавя към профила, когато влезеш.',
      en: 'Journey shows your progress – practices completed, minutes, days you practised, your recent practice, programs, favorite practices and notes. Without signing in, it is kept on your device and added to your account when you log in.',
    },
    links: [{ href: '/journey', label: { bg: 'Виж „Път“', en: 'See Journey' } }],
  },
  {
    id: 'register',
    question: { bg: 'Как да се регистрирам?', en: 'How do I create an account?' },
    keywords: ['register', 'sign up', 'signup', 'create an account', 'create account', 'create a profile', 'create my', 'join', 'verif', 'регистр', 'създам профил', 'нов профил', 'потвър'],
    answer: {
      bg: 'Регистрирай се, след което потвърди имейла си чрез линка, който ще получиш.',
      en: 'Sign up, then confirm your email address through the link we send you.',
    },
    links: [{ href: '/register', label: { bg: 'Създай профил', en: 'Create an account' } }],
  },
  {
    id: 'login',
    question: { bg: 'Как да вляза?', en: 'How do I log in?' },
    keywords: ['log in', 'login', 'sign in', 'signin', 'password', 'forgot', 'locked', 'вход', 'вляза', 'влизам', 'парол', 'забрав', 'заключ'],
    answer: {
      bg: 'Влез от страницата за вход. Ако си забравил паролата, поискай линк за нулиране. Паролата се сменя от настройките на профила.',
      en: 'Log in on the login page. If you forgot your password, request a reset link. You can change it in your profile settings.',
    },
    links: [
      { href: '/login', label: { bg: 'Към входа', en: 'Go to log in' } },
      { href: '/forgot-password', label: { bg: 'Нулирай паролата', en: 'Reset your password' } },
    ],
  },
  {
    id: 'account',
    question: { bg: 'Къде са настройките на профила?', en: 'Where are my account settings?' },
    keywords: ['account', 'profile', 'setting', 'billing', 'invoice', 'language', 'профил', 'акаунт', 'настройк', 'фактур', 'език'],
    answer: {
      bg: 'В „Профил и настройки“ можеш да смениш снимката на профила (с линк към изображение), краткото описание, кой вижда профила ти и паролата си. Там са и езикът и темата. Името и имейлът се показват, но не се редактират от тази страница. В профила са още закупените програми и плащанията.',
      en: 'In Profile & Settings you can change your profile photo (with a link to an image), your short bio, who can see your profile and your password. Language and theme are there too. Your name and email are shown but can’t be edited on that page. Your profile also lists purchased programs and billing.',
    },
    links: [
      { href: '/account', label: { bg: 'Отвори профила', en: 'Open your profile' } },
      { href: '/account/settings', label: { bg: 'Настройки', en: 'Settings' } },
    ],
  },
  {
    id: 'contact',
    question: { bg: 'Как да се свържа с екипа?', en: 'How can I contact the team?' },
    keywords: ['contact', 'email', 'e mail', 'support', 'team', 'phone', 'контакт', 'свърж', 'имейл', 'поща', 'екип', 'телефон'],
    answer: null,
    links: [],
  },
  {
    id: 'terms',
    question: { bg: 'Къде са общите условия?', en: 'Where are the terms and conditions?' },
    keywords: ['terms', 'condition', 'rules', 'условия', 'правила'],
    answer: {
      bg: 'Правилата за ползване на сайта са в Общите условия.',
      en: 'The rules for using the site are in the Terms and Conditions.',
    },
    links: [{ href: '/terms', label: { bg: 'Прочети Общите условия', en: 'Read the Terms' } }],
  },
  {
    id: 'privacy',
    question: { bg: 'Как се пазят личните ми данни?', en: 'How is my personal data handled?' },
    keywords: ['privacy', 'personal data', 'gdpr', 'data', 'поверител', 'лични данни', 'данни'],
    answer: {
      bg: 'Как се обработват личните данни, е описано в Политиката за поверителност.',
      en: 'How personal data is handled is described in the Privacy Policy.',
    },
    links: [{ href: '/privacy', label: { bg: 'Прочети политиката за поверителност', en: 'Read the Privacy Policy' } }],
  },
  {
    id: 'cookies',
    question: { bg: 'Какво са бисквитките?', en: 'What about cookies?' },
    keywords: ['cookie', 'tracking', 'бисквит', 'кукита'],
    answer: {
      bg: 'Политиката за бисквитките е на отделна страница, а настройките за бисквитки са в долната част на сайта.',
      en: 'The Cookie Policy has its own page, and cookie settings are in the site footer.',
    },
    links: [{ href: '/cookies', label: { bg: 'Прочети политиката за бисквитките', en: 'Read the Cookie Policy' } }],
  },
  {
    // All three policies together with where to get help; the contact
    // address is added when one is configured in the admin settings.
    id: 'policies',
    question: { bg: 'Къде да намеря правилата и помощта?', en: 'Where can I find the policies or get help?' },
    keywords: [],
    whenAll: [['polic', 'rules', 'terms', 'legal', 'правила', 'политик', 'условия'], HELP_WORDS],
    answer: {
      bg: 'Общите условия, Политиката за поверителност и Политиката за бисквитките са в долната част на сайта, където са и настройките за бисквитки. За ориентиране в сайта питай мен; за всичко останало се обърни към екипа на KUKO WAY – адресът за контакт се показва тук, когато е публикуван.',
      en: 'The Terms and Conditions, the Privacy Policy and the Cookie Policy are in the site footer, along with the cookie settings. Ask me for help finding your way around the site; for anything else, contact the KUKO WAY team – the contact address is shown here once it’s published.',
    },
    links: [
      { href: '/terms', label: { bg: 'Общи условия', en: 'Terms and Conditions' } },
      { href: '/privacy', label: { bg: 'Политика за поверителност', en: 'Privacy Policy' } },
      { href: '/cookies', label: { bg: 'Политика за бисквитките', en: 'Cookie Policy' } },
    ],
    offerContact: true,
  },
  // KUKO WAY itself, from the approved handbook (content/start-here.ts:
  // "What Is KUKO WAY?", accessibility adaptations) and the practice overview
  // (content/practice-overview.ts). After the site topics, so a question
  // that merely names the brand still gets its specific topic on a tie.
  {
    id: 'audience',
    question: { bg: 'За кого е предназначен KUKO WAY?', en: 'Who is KUKO WAY for?' },
    keywords: ['who is kuko way for', 'who is it for', 'who is this for', 'who can practise', 'who can practice', 'suitable', 'for beginners', 'за кого', 'предназначен', 'подходящ', 'за начинаещи', 'за мен ли'],
    answer: {
      bg: 'KUKO WAY е за хора, които искат да разбират по-добре тялото си и да поемат по-активна роля в грижата за себе си – особено когато продължителното седене, стресът и малкото движение и възстановяване натоварват тялото. „Започни тук“ е наръчник за начинаещи и води стъпка по стъпка, а маневрите могат да се изпълняват и седнали. Практиките са образователни и не заместват медицинска помощ.',
      en: 'KUKO WAY is for people who want to understand their bodies better and take a more active role in self-care – especially when long sitting, stress and too little movement and recovery put the body under strain. Start Here is a beginner’s guide that leads you step by step, and the maneuvers can also be done seated. The practices are educational and don’t replace medical care.',
    },
    links: [{ href: '/practices/start-here', label: { bg: 'Отвори „Започни тук“', en: 'Open Start Here' } }],
  },
  {
    id: 'about',
    question: { bg: 'Какво е KUKO WAY?', en: 'What is KUKO WAY?' },
    keywords: [
      'what is kuko',
      'what s kuko',
      'about kuko',
      'tell me about kuko',
      'explain kuko',
      'какво е kuko',
      'какво е куко',
      'какво представлява kuko',
      'какво представлява куко',
      'за kuko',
      'за куко',
      'kuko',
      'куко',
    ],
    answer: {
      bg: 'KUKO WAY е подход и общност, посветени на това хората да разбират по-добре собственото си тяло и да поемат по-активна роля в грижата за себе си. В основата са фасциалните маневри – нежна практика, която съчетава осъзнато движение, дишане и телесна осъзнатост. Идеята е, че съвременният начин на живот – продължително седене, стрес, малко движение и възстановяване – често поставя тялото под постоянно натоварване. В сайта ще намериш водени практики, програми за рестарт, „Знание“ и „Път“ за напредъка си.',
      en: 'KUKO WAY is an approach and community dedicated to helping people understand their own bodies better and take a more active role in self-care. At its heart are fascial maneuvers – a gentle practice that combines mindful movement, breath and body awareness. The idea is that modern life – long sitting, stress, too little movement and recovery – often puts the body under constant strain. On the site you’ll find guided practices, Reset Programs, Learn and Journey for your progress.',
    },
    links: [
      { href: '/practices/start-here/kakvo-e-kuko-way', label: { bg: 'Прочети „Какво е KUKO WAY?“', en: 'Read “What Is KUKO WAY?”' } },
      { href: '/practices/start-here/nashite-ubezhdeniya', label: { bg: 'Нашите убеждения', en: 'Our Beliefs' } },
    ],
  },
  {
    // The story as the handbook tells it (start-here.ts, "What Is KUKO
    // WAY?"). It names the people behind fascial maneuvers; it says nothing
    // about who founded KUKO WAY itself or when, so neither is claimed.
    id: 'story',
    question: { bg: 'Разкажи ми за историята на KUKO WAY', en: 'Tell me about the history of KUKO WAY' },
    keywords: [],
    whenAll: [BRAND_HISTORY_WORDS, BRAND_WORDS],
    answer: {
      bg: 'Практиката на KUKO WAY стъпва върху опита на Garry Lineham. Той работи в клиника с широк екип от специалисти, но вижда, че краткото облекчение не трае, ако човек продължава със същите навици, затова затваря клиниката и търси по-достъпен начин хората да се учат да разбират телата си. По-късно в Канада, заедно с Cynthia Leavoy и Jason van Blerk, развива фасциалните маневри като цялостна практика за движение. KUKO WAY използва техния принцип – тялото да се изследва с отворено съзнание, чрез лична практика, наблюдение и адаптиране – като основа за собствената си практика.',
      en: 'KUKO WAY’s practice builds on the experience of Garry Lineham. He worked in a clinic with a broad team of specialists but saw that short-term relief didn’t last if people kept the same habits, so he closed the clinic and looked for a more accessible way to teach people to understand their own bodies. Later, in Canada, together with Cynthia Leavoy and Jason van Blerk, he developed fascial maneuvers as a comprehensive movement practice. KUKO WAY uses their principle – exploring the body with an open mind, through personal practice, observation and adaptation – as the foundation for its own practice.',
    },
    links: [{ href: '/practices/start-here/kakvo-e-kuko-way', label: { bg: 'Прочети „Какво е KUKO WAY?“', en: 'Read “What Is KUKO WAY?”' } }],
  },
  {
    // disclaimer.text and the safety notes in Start Here ("Tips for Getting
    // Started", "What to Expect").
    id: 'medical',
    question: { bg: 'Практиките заместител ли са на медицинска помощ?', en: 'Are the practices a substitute for medical care?' },
    keywords: ['medical', 'medicine', 'doctor', 'physician', 'treatment', 'substitute', 'replace', 'therapy', 'diagnos', 'injur', 'медицин', 'лекар', 'лечение', 'лекува', 'замест', 'диагноз', 'терапи', 'травм', 'контузи'],
    answer: {
      bg: 'Не. Съдържанието на KUKO WAY е образователно и не замества медицинска диагноза, лечение или консултация с квалифициран медицински специалист. Ако по време на практика почувстваш замайване, спри и седни или легни безопасно. При остро прищипване, разкъсваща болка, изтръпване или нова силна болка спри маневрата, а ако симптомът не отшумява или е тревожен, потърси медицинска оценка.',
      en: 'No. KUKO WAY’s content is educational and does not replace medical diagnosis, treatment or consultation with a qualified healthcare professional. If you feel dizzy during a practice, stop and sit or lie down safely. If you feel a sharp pinch, tearing pain, numbness or new severe pain, stop the maneuver, and seek medical evaluation if the symptom doesn’t subside or is concerning.',
    },
    links: [{ href: '/practices/start-here/kakvo-da-ochakvate', label: { bg: 'Прочети „Какво да очаквате“', en: 'Read “What to Expect”' } }],
  },
  {
    id: 'navigation',
    question: { bg: 'Къде са разделите на сайта?', en: 'Where are the sections of the site?' },
    keywords: ['navigat', 'menu', 'where', 'section', 'page', 'home', 'community', 'навигац', 'меню', 'къде', 'раздел', 'страниц', 'начало', 'общност'],
    answer: {
      bg: 'Горе са „Практика“, „Програми“, „Знание“ и „Път“, а логото води към началото. На телефон ползвай долната лента. „Общност“ е в менюто и в долната част на сайта.',
      en: 'The top bar has Practice, Programs, Learn and Journey, and the logo leads Home. On a phone, use the bottom bar. Community is in the menu and the footer.',
    },
    links: [
      { href: '/', label: { bg: 'Към началото', en: 'Go to Home' } },
      { href: '/community', label: { bg: 'Виж общността', en: 'See the Community' } },
    ],
  },
  // About the assistant itself: one entry per intent, matched by whole
  // phrases ("на колко си", "are you human") rather than single words, so
  // ordinary questions that merely contain "мога", "знам" or "човек" are not
  // caught. After the site topics, so "Can you help me find programs?" still
  // gets Programs; before greetings, so "Hi, who are you?" gets Identity.
  // None of these invent personal facts: no age, creator or abilities beyond
  // fixed answers about the site. The only given fact is the assistant's
  // name, Тед / Ted (one "d"), as in the chat title and welcome.
  {
    id: 'age',
    question: { bg: 'На колко си години?', en: 'How old are you?' },
    keywords: [
      'how old are you',
      'what is your age',
      'what s your age',
      'your age ',
      'when were you born',
      'на колко си ',
      'на колко години си',
      'колко години имаш',
      'колко си голям',
      'колко си стар',
      'кога си роден',
    ],
    answer: {
      bg: 'Нямам възраст като човек – аз съм виртуалният помощник на KUKO WAY. Мога да ти помогна да се ориентираш в сайта и да откриеш практики и програми.',
      en: 'I don’t have an age like a person – I’m the KUKO WAY virtual assistant. I can help you find your way around the site and discover practices and programs.',
    },
    links: [],
  },
  {
    id: 'name',
    question: { bg: 'Как се казваш?', en: 'What is your name?' },
    keywords: [
      'what is your name',
      'what s your name',
      'your name ',
      'what are you called',
      'как се казваш',
      'как ти е името',
      'какво ти е името',
      'как да те наричам',
      'твоето име',
    ],
    answer: {
      bg: 'Казвам се Тед – виртуалният асистент на Kuko Way. С какво мога да помогна?',
      en: 'My name is Ted – I’m the Kuko Way virtual assistant. How can I help?',
    },
    links: [],
  },
  {
    id: 'creator',
    question: { bg: 'Кой те създаде?', en: 'Who created you?' },
    keywords: [
      'who created you',
      'who made you',
      'who built you',
      'who developed you',
      'who programmed you',
      'кой те създаде',
      'кой те е създал',
      'кой те направи',
      'кой те е направил',
      'кой те програмира',
      'кой те е програмирал',
    ],
    answer: {
      bg: 'Аз съм виртуалният помощник на KUKO WAY, разработен лично от Lone Coder. Имам готови отговори и помагам на посетителите да се ориентират в сайта и да откриват практики и програми.',
      en: 'I’m the KUKO WAY virtual assistant, developed by Lone Coder. I use predefined answers to help visitors navigate the website and find practices and programs.',
    },
    links: [],
    inline: { text: 'Lone Coder', href: 'https://lonecoder.nsh.one/' },
  },
  {
    id: 'identity',
    question: { bg: 'Кой си ти?', en: 'Who are you?' },
    keywords: ['who are you ', 'what are you ', 'кой си ', 'какво си ти', 'какво представляваш'],
    answer: {
      bg: 'Аз съм Тед, виртуалният помощник на KUKO WAY. Помагам да се ориентираш в сайта и да намериш практики и програми.',
      en: 'I’m Ted, the KUKO WAY virtual assistant. I help you find your way around the site and find practices and programs.',
    },
    links: [
      { href: '/practices', label: { bg: 'Виж практиките', en: 'See the practices' } },
      { href: '/practices/programs', label: { bg: 'Виж програмите', en: 'See the programs' } },
    ],
  },
  {
    id: 'human',
    question: { bg: 'Човек ли си?', en: 'Are you human?' },
    keywords: [
      'are you human',
      'are you a human',
      'are you a person',
      'are you a real',
      'are you real ',
      'are you a bot',
      'are you a robot',
      'are you a machine',
      'човек ли си',
      'истински човек ли',
      'жив човек ли',
      'истински ли си',
      'бот ли си',
      'робот ли си',
      'машина ли си',
    ],
    answer: {
      bg: 'Не, не съм човек – аз съм виртуален помощник с готови отговори за сайта на KUKO WAY.',
      en: 'No, I’m not a human – I’m a virtual assistant with ready-made answers for the KUKO WAY website.',
    },
    links: [],
  },
  {
    id: 'abilities',
    question: { bg: 'Знаеш ли всичко?', en: 'Do you know everything?' },
    keywords: [
      'can you think',
      'do you know everything',
      'do you have feelings',
      'are you an ai',
      'are you ai ',
      'are you artificial',
      'are you smart',
      'можеш ли да мислиш',
      'умееш ли да мислиш',
      'знаеш ли всичко',
      'всичко ли знаеш',
      'имаш ли чувства',
      'изкуствен интелект ли',
      'умен ли си',
    ],
    answer: {
      bg: 'Не мисля като човек и не знам всичко – работя с готови отговори за сайта на KUKO WAY. Мога да те насоча към практики, програми, „Знание“ и профила ти.',
      en: 'I don’t think like a person and I don’t know everything – I work with ready-made answers about the KUKO WAY site. I can point you to practices, programs, Learn and your account.',
    },
    links: [],
  },
  {
    id: 'help',
    question: { bg: 'Как можеш да ми помогнеш?', en: 'How can you help me?' },
    keywords: [
      'how can you help',
      'what can you do',
      'can you help me',
      'what do you do',
      'можеш да ми помогн',
      'можеш да помогн',
      'с какво можеш',
      'какво можеш да',
      'помогни ми',
    ],
    answer: {
      bg: 'Мога да те насоча към практики, програми, „Знание“, профила ти или правилата на сайта. Просто ме попитай – например „Къде са програмите?“',
      en: 'I can point you to practices, programs, Learn, your account or the site’s rules. Just ask – for example, “Where are the programs?”',
    },
    links: [
      { href: '/practices', label: { bg: 'Виж практиките', en: 'See the practices' } },
      { href: '/practices/programs', label: { bg: 'Виж програмите', en: 'See the programs' } },
    ],
  },
  // Small talk. Last, so a greeting in front of a real question ("Hi, where
  // are the videos?") still gets the topic's answer.
  {
    id: 'howAreYou',
    question: { bg: 'Как си?', en: 'How are you?' },
    keywords: ['how are you', 'how r u ', 'how is it going', 'как си ', 'как сте ', 'как я караш', 'как е ', 'какво правиш'],
    answer: {
      bg: 'Добре съм, благодаря! С какво да помогна – практики, програми или нещо в сайта?',
      en: 'I’m well, thanks! How can I help – practices, programs or something on the site?',
    },
    links: [],
  },
  {
    id: 'greeting',
    question: { bg: 'Здравей!', en: 'Hello!' },
    keywords: ['hi ', 'hello', 'hey ', 'good morning', 'good afternoon', 'good evening', 'здрасти', 'здравей', 'здрасий', 'привет', 'добър ден', 'добро утро', 'добър вечер', 'хей '],
    answer: {
      bg: 'Здравей! С какво да помогна? Питай ме за практики, програми, „Знание“ или профила си.',
      en: 'Hello! How can I help? Ask me about practices, programs, Learn or your account.',
    },
    links: [],
  },
  {
    id: 'thanks',
    question: { bg: 'Благодаря!', en: 'Thank you!' },
    keywords: ['thank', 'thx ', 'благодар', 'мерси'],
    answer: {
      bg: 'Моля! Питай, ако имаш още въпроси.',
      en: 'You’re welcome! Ask if you have any other questions.',
    },
    links: [],
  },
];

// The general section answers that a documentation passage may replace
// when the question names a handbook chapter or practice by its exact title
// (see answerQuestion in retrieval.ts). Every other entry always wins.
export const DOC_OVERRIDABLE_IDS = new Set(['learn', 'practices']);

// Lowercase words separated by single spaces, padded with a space at each
// end: punctuation (?, !, …, quotes, full-width forms), extra whitespace
// and capitals don't affect matching.
function normalize(text: string): string {
  return ` ${text
    .normalize('NFKC')
    .toLowerCase()
    .replace(/[^\p{L}\p{N}]+/gu, ' ')
    .trim()} `;
}

// The entry with the most keywords starting a word of the question, or null
// when none do. Ties go to the earlier entry, so specific topics come before
// the general navigation one and small talk.
export function matchFaq(question: string): FaqEntry | null {
  const text = normalize(question);
  const hits = (k: string) => text.includes(` ${k}`);
  const compound = FAQ.find((entry) => entry.whenAll?.every((group) => group.some(hits)));
  if (compound) return compound;
  let best: FaqEntry | null = null;
  let bestScore = 0;
  for (const entry of FAQ) {
    const score = entry.keywords.filter(hits).length;
    if (score > bestScore) {
      best = entry;
      bestScore = score;
    }
  }
  return best;
}
