// The help assistant's answers: a fixed FAQ about the site, matched to the
// visitor's question by simple keywords. Everything runs in the browser; no
// AI model, API or storage is involved.
//
// Answers describe only what the site really has (routes from app/(app),
// navigation from components/layout/nav.ts). No prices, policies or contact
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
      bg: 'Започни от „Започни тук“ – там са първите стъпки. После опитай една практика и следи напредъка си в „Път“.',
      en: 'Begin with Start Here – it covers the first steps. Then try a practice and follow your progress in Journey.',
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
      bg: '„Знание“ събира главите от наръчника за тялото и фасциите, както и статиите.',
      en: 'Learn brings together the handbook chapters on the body and fascia, plus the articles.',
    },
    links: [{ href: '/learn', label: { bg: 'Отвори „Знание“', en: 'Open Learn' } }],
  },
  {
    id: 'practices',
    question: { bg: 'Къде да намеря практиките?', en: 'Where can I find the practices?' },
    keywords: ['practice', 'practise', 'exercise', 'maneuver', 'library', 'search', 'практик', 'упражнен', 'маневр', 'библиотек', 'търс'],
    answer: {
      bg: 'Практиките са в раздел „Практика“ – с „Започни тук“, „Почувствай се по-добре сега“ и „Библиотека“, където търсиш по име. Всяка се води стъпка по стъпка.',
      en: 'Practices are in the Practice section – Start Here, Feel Better Now and the Library, where you can search by name. Each one guides you step by step.',
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
    id: 'journey',
    question: { bg: 'Къде виждам напредъка си?', en: 'Where can I see my progress?' },
    keywords: ['journey', 'progress', 'statistic', 'favorite', 'favourite', 'note', 'streak', 'път', 'напред', 'статистик', 'любим', 'бележк', 'серия'],
    // "History" only as the visitor's own (practice) history, never a bare
    // 'history' / 'истори', which also caught "the history of KUKO WAY".
    // A compound so "my practice history" wins over the practice keyword.
    whenAll: [PERSONAL_HISTORY],
    answer: {
      bg: '„Път“ показва напредъка ти – дни с практика, минути, програми, любими практики и бележки. Без вход напредъкът се пази на устройството и се добавя към профила, когато влезеш.',
      en: 'Journey shows your progress – days you practised, minutes, programs, favorite practices and notes. Without signing in, it is kept on your device and added to your account when you log in.',
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
      bg: 'В профила са прегледът, закупените програми, настройките и плащанията. Езикът се сменя от превключвателя за език.',
      en: 'Your profile has the overview, purchased programs, settings and billing. The language can be switched from the language switcher.',
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
      bg: 'Аз съм Тед, виртуалният помощник на KUKO WAY, и отговарям с готови отговори. Помагам да се ориентираш в сайта и да намериш практики и програми.',
      en: 'I’m Ted, the KUKO WAY virtual assistant, and I reply with ready-made answers. I help you find your way around the site and find practices and programs.',
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
