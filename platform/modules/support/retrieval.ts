// Ted's documentation search: when the fixed FAQ (faq.ts) has no answer, the
// question is looked up in the approved KUKO WAY content the site already
// publishes, and the best matching passage is quoted word for word with a
// link to its page. Deterministic keyword ranking in the browser: no AI
// model, API, external index or paid service, and nothing is sent anywhere.
//
// Searchable sources — public page content only, read straight from the
// content modules (no second copy to keep in sync):
//   • the beginner's handbook, content/start-here.ts (Start Here and Learn
//     chapters, at their canonical URL from handbook.ts);
//   • the practices, content/practices.ts (title, intro, benefits, safety
//     note — what each practice page shows; not the step lists);
//   • the practice overview, content/practice-overview.ts (Practice hub).
// Internal docs, legal texts, prices, settings and the Reset Programs (their
// catalog entries and unpublished placeholder content, modules/programs)
// are never indexed: programs point to the Programs page and prices stay
// with the FAQ, which reads them from the catalog under the flags.
//
// Loaded lazily by SupportChat (dynamic import), so this content is only
// downloaded when the chat is opened.
import type { Locale } from '@/lib/i18n/locale';
import { handbookSectionHref } from '@/modules/kuko-way/handbook';
import { practiceOverview } from '@/modules/kuko-way/content/practice-overview';
import { getAllPractices, getHandbookSections } from '@/modules/kuko-way/service';
import { localize, type HandbookParagraph, type LocalizedText } from '@/modules/kuko-way/types';
import { DOC_OVERRIDABLE_IDS, FAQ, matchFaq, type FaqEntry } from './faq';

type Text = Record<Locale, string>;

// One quotable passage: a paragraph (or a run of list items) with the title
// it sits under and the page it comes from.
export type Passage = {
  id: string;
  // Where the text comes from in the code, for tests and maintenance.
  source: string;
  title: Text;
  text: Text;
  href: string;
};

// What Ted shows: a passage, introduced with its title, and a link to it.
export type DocAnswer = {
  passageId: string;
  source: string;
  text: Text;
  link: { href: string; label: Text };
};

const both = (value: LocalizedText): Text => ({ bg: localize(value, 'bg').value, en: localize(value, 'en').value });

// ---------------------------------------------------------------------------
// Index

function handbookPassages(): Passage[] {
  const out: Passage[] = [];
  for (const section of getHandbookSections()) {
    const href = handbookSectionHref(section);
    const groups: { title: LocalizedText; paragraphs: typeof section.paragraphs }[] = [
      { title: section.title, paragraphs: section.paragraphs },
      ...(section.subsections ?? []).map((sub) => ({ title: sub.title, paragraphs: sub.paragraphs })),
    ];
    groups.forEach((group, g) => {
      // Consecutive list items read as one passage ("Our Beliefs").
      const runs: HandbookParagraph[][] = [];
      for (const p of group.paragraphs ?? []) {
        const last = runs[runs.length - 1];
        if (p.list && last?.[0].list) last.push(p);
        else runs.push([p]);
      }
      runs.forEach((run, r) => {
        out.push({
          id: `handbook:${section.id}:${g}:${r}`,
          source: `content/start-here.ts › ${section.id}${g > 0 ? ` › ${localize(group.title, 'en').value}` : ''}`,
          title: both(group.title),
          text: { bg: run.map((p) => localize(p, 'bg').value).join(' '), en: run.map((p) => localize(p, 'en').value).join(' ') },
          href,
        });
      });
    });
  }
  return out;
}

function practicePassages(): Passage[] {
  const out: Passage[] = [];
  for (const practice of getAllPractices()) {
    const parts: LocalizedText[] = [...(practice.intro ?? [])];
    if (practice.benefits?.length) {
      parts.push({
        bg: practice.benefits.map((b) => localize(b, 'bg').value).join(' '),
        en: practice.benefits.map((b) => localize(b, 'en').value).join(' '),
      });
    }
    if (practice.safetyNote) parts.push(practice.safetyNote);
    parts.forEach((part, i) => {
      out.push({
        id: `practice:${practice.slug}:${i}`,
        source: `content/practices.ts › ${practice.id}`,
        title: both(practice.title),
        text: both(part),
        href: `/practices/${practice.slug}`,
      });
    });
  }
  return out;
}

function overviewPassages(): Passage[] {
  const out: Passage[] = [];
  practiceOverview.sections.forEach((section) => {
    section.paragraphs.forEach((p, i) => {
      out.push({
        id: `overview:${section.id}:${i}`,
        source: `content/practice-overview.ts › ${section.id}`,
        title: both(section.title),
        text: both(p),
        href: '/practices',
      });
    });
  });
  return out;
}

export const PASSAGES: Passage[] = [...handbookPassages(), ...practicePassages(), ...overviewPassages()];

// ---------------------------------------------------------------------------
// Terms

// Question words, filler and the brand name (it is in every passage), in
// both languages. Removed before stemming, so they never count as a match.
const STOPWORDS = new Set(
  (
    'what whats is are was were be been the a an of to in on at for and or but how do does did can could would should will ' +
    'i me my mine you your it its this that these those there here about tell explain please with from by into as ' +
    'which who whom where when why any some all more most much many very just also than then so if not no yes ' +
    'find show see want need know get give use using like one our ours kuko way ' +
    'какво какъв каква какви е и на за в във с със от по да се ли как къде кой коя кое кои кога защо ' +
    'това тази този тези там тук ми ти си ме те го я ни ви са съм сме сте бъде бъдат е бил била било ' +
    'мога можеш може можем искам искаш трябва има няма който която което които че но или а при през до ' +
    'след преди без под над между нещо много повече малко един една едно някой някоя кажи разкажи обясни ' +
    'моля покажи виж намеря намериш намерите търся търсиш представлява представляват означава значи ' +
    'правя правиш прави правят направя време наш наша наше наши нашите нашата нашият ' +
    'ваш ваша ваше ваши вашите вашата вашият куко уей'
  ).split(' '),
);

// Everyday phrasings for words the handbook spells differently, applied to
// the question before its terms are taken (BG and EN). Matched between
// spaces on the normalized text: `\b` doesn't see Cyrillic word edges.
const SYNONYMS: [RegExp, string][] = [
  [/ (?:завие|вие|завива) свят | световъртеж\S* /gu, ' замайване '],
  [/ light ?headed | dizziness /gu, ' dizzy '],
  [/ sitting | on a chair | in a chair /gu, ' seated '],
  [/ на стол /gu, ' седнали '],
];

// "Practice" is in nearly every passage and names a FAQ topic of its own, so
// it never makes a title match exact ("What are the practices?" stays FAQ).
const GENERIC = new Set(['prac', 'прак']);

// Lowercase words, punctuation and case removed (like faq.ts), then a short
// prefix per word, so inflections meet: "фасция"/"фасцията"/"фасциална",
// "тяло"/"тялото", "maneuver"/"maneuvers", "breath"/"breathing".
const STEM = 4;

export function terms(text: string): string[] {
  let normalized = ` ${text.normalize('NFKC').toLowerCase().replace(/[^\p{L}\p{N}]+/gu, ' ')} `;
  for (const [pattern, replacement] of SYNONYMS) normalized = normalized.replace(pattern, replacement);
  return normalized
    .split(' ')
    .filter((w) => w.length >= 3 && !STOPWORDS.has(w))
    .map((w) => w.slice(0, STEM));
}

const termSet = (text: Text) => new Set([...terms(text.bg), ...terms(text.en)]);

// Title terms per language too: an exact-title match is judged against the
// title in one language, not both merged.
type Indexed = { passage: Passage; titleTerms: Set<string>; titleByLocale: Set<string>[]; textTerms: Set<string> };

const INDEX: Indexed[] = PASSAGES.map((passage) => ({
  passage,
  titleTerms: termSet(passage.title),
  titleByLocale: [new Set(terms(passage.title.bg)), new Set(terms(passage.title.en))],
  textTerms: termSet(passage.text),
}));

// Rarer terms weigh more (inverse document frequency over the passages).
const IDF = new Map<string, number>();
{
  const df = new Map<string, number>();
  for (const doc of INDEX) for (const t of new Set([...doc.titleTerms, ...doc.textTerms])) df.set(t, (df.get(t) ?? 0) + 1);
  for (const [t, n] of df) IDF.set(t, Math.log(1 + INDEX.length / n));
}

// ---------------------------------------------------------------------------
// Search

// strong: the question names this passage's title exactly. full: every
// specific (non-generic) question term, at least two, is in the passage.
export type Hit = { passage: Passage; score: number; strong: boolean; full: boolean };

// A title match is "strong" when the question asks about exactly that title:
// every specific question term is in the title (in one language), and the
// title has at most one term more ("What is a fascial maneuver?" → "What Is
// a Fascial Maneuver?"). A one-word question needs the title to be that word
// ("fascia" → "What Is Fascia?", "breathe" → "Breathing").
function isStrong(query: Set<string>, title: Set<string>): boolean {
  if (query.size === 0 || title.size === 0) return false;
  for (const t of query) if (!title.has(t)) return false;
  return query.size === 1 ? title.size === 1 : title.size - query.size <= 1;
}

// The best passage for a question, or null when nothing matches reliably:
// a strong title match, or at least two question terms in one passage
// covering most of the question. Anything weaker gets Ted's usual fallback.
export function searchDocs(question: string): Hit | null {
  const query = new Set(terms(question));
  const specific = new Set([...query].filter((t) => !GENERIC.has(t)));
  if (query.size === 0) return null;
  let best: Hit | null = null;
  for (const doc of INDEX) {
    let score = 0;
    let matched = 0;
    let matchedSpecific = 0;
    for (const t of query) {
      const inTitle = doc.titleTerms.has(t);
      if (!inTitle && !doc.textTerms.has(t)) continue;
      matched += 1;
      if (!GENERIC.has(t)) matchedSpecific += 1;
      score += (IDF.get(t) ?? 0) * (inTitle ? 3 : 1);
    }
    if (matched === 0) continue;
    const strong = doc.titleByLocale.some((title) => isStrong(specific, title));
    const full = specific.size >= 2 && matchedSpecific === specific.size;
    const reliable = strong || (matched >= 2 && matched / query.size >= 0.6);
    if (!reliable) continue;
    // Strong title matches first; among them, the closest title.
    const closest = Math.min(...doc.titleByLocale.map((title) => title.size));
    const rank = score + (strong ? 100 - closest : 0);
    if (!best || rank > best.score) best = { passage: doc.passage, score: rank, strong, full };
  }
  return best;
}

// Whole sentences from the start of the passage, up to about 420 characters,
// so the quote stays short and is still the source's own words.
function excerpt(text: string): string {
  const sentences = text.match(/[^.!?…]+[.!?…]+[»“”"’)]*\s*|[^.!?…]+$/g) ?? [text];
  let out = '';
  for (const s of sentences) {
    if (out && (out + s).length > 420) break;
    out += s;
  }
  return out.trim();
}

export function toDocAnswer(passage: Passage): DocAnswer {
  return {
    passageId: passage.id,
    source: passage.source,
    text: {
      bg: `От „${passage.title.bg}“: ${excerpt(passage.text.bg)}`,
      en: `From “${passage.title.en}”: ${excerpt(passage.text.en)}`,
    },
    link: { href: passage.href, label: { bg: `Прочети „${passage.title.bg}“`, en: `Read “${passage.title.en}”` } },
  };
}

// ---------------------------------------------------------------------------
// Ted's answer

// Questions asking whether the practice cures or treats something get the
// FAQ's medical answer (the site's disclaimer), never a quoted benefit.
const HEALTH_CLAIM = ['cure', 'cures', 'cured', 'heal ', 'heals', 'healing', 'treat ', 'treats', 'disease', 'illness', 'лекува', 'излекув', 'болест', 'заболяван'];

// Programs and money are never answered from the documentation: programs
// point to the Programs page (FAQ "programs"), and price, discount or
// subscription questions get the FAQ's catalog-driven pricing answer, with
// its current flag behaviour. The FAQ already catches most of these; this
// covers wordings it doesn't know ("What does the 7-day reset include?").
const MONEY_TERMS = ['discount', 'subscription', 'subscribe', 'membership', 'checkout', 'check out', 'coupon', 'promo', 'отстъпк', 'абонамент', 'членств', 'промо', 'купон'];

const normalized = (question: string) => ` ${question.normalize('NFKC').toLowerCase().replace(/[^\p{L}\p{N}]+/gu, ' ').trim()} `;
const hasAny = (question: string, words: string[]) => {
  const text = normalized(question);
  return words.some((k) => text.includes(` ${k}`));
};

// "Reset" alone is not a program: the handbook's first three maneuvers form
// a "15-minute reset for tension" ("рестарт за напрежение"). A question is
// about the Reset Programs only when it says "program", or names a reset
// together with a day count ("7-day reset", „28-дневният рестарт“,
// "day reset"). A bare "What is reset?" is neither: the documentation search
// then answers if it can, else the usual fallback — never a guess.
const DAY_COUNT = / (?:\d+|one|three|seven|twenty eight|един|три|седем|двадесет и осем) (?:day|days|днев\S*|дни|ден) | еднодн\S* | day reset | reset program /u;
const RESET_WORDS = ['reset', 'ресет', 'рестарт'];
// A reset named with practice context is the handbook's tension reset.
const PRACTICE_CONTEXT = ['tension', 'напрежени', 'minute', 'минут', 'practice', 'practise', 'практик', 'maneuver', 'маневр'];

function isProgramQuestion(question: string): boolean {
  if (hasAny(question, ['program', 'програм'])) return true;
  return hasAny(question, RESET_WORDS) && DAY_COUNT.test(normalized(question));
}

// The FAQ's program intents (Programs, "which program", practice vs
// program) also count a bare reset word. Their match stands only for a
// program question; a bare reset (Programs) or a reset with practice
// context (any of them) is set aside for the documentation or the fallback.
function setsAsideProgramMatch(entry: FaqEntry, question: string): boolean {
  if (isProgramQuestion(question)) return false;
  if (entry.id === 'programs') return true;
  return ['chooseProgram', 'difference'].includes(entry.id) && hasAny(question, RESET_WORDS) && hasAny(question, PRACTICE_CONTEXT);
}

const isHealthClaim = (question: string) => hasAny(question, HEALTH_CLAIM);

export type TedAnswer = { entry: FaqEntry | null; doc: DocAnswer | null };

// The FAQ first: every FAQ topic, dynamic price and the history/Journey
// distinction stay as they are. Program and money questions never reach the
// documentation (see isProgramQuestion). Documentation only when the FAQ has nothing,
// or when it would give one of the general section answers (Learn,
// Practices) and a passage answers the question more exactly — by its exact
// title, or with every specific term of the question. No reliable match:
// entry and doc both null — the usual fallback.
export function answerQuestion(question: string): TedAnswer {
  const faq = (id: string) => FAQ.find((e) => e.id === id)!;
  let entry = matchFaq(question);
  // The FAQ's program keywords include a bare „ресет“ / „рестарт“ / "reset";
  // without program context that match is set aside (see above).
  if (entry && setsAsideProgramMatch(entry, question)) entry = null;
  if (entry && !DOC_OVERRIDABLE_IDS.has(entry.id)) return { entry, doc: null };
  if (hasAny(question, MONEY_TERMS)) return { entry: faq('pricing'), doc: null };
  if (isProgramQuestion(question)) return { entry: entry ?? faq('programs'), doc: null };
  if (isHealthClaim(question)) return { entry: faq('medical'), doc: null };
  const hit = searchDocs(question);
  if (hit && (entry === null || hit.strong || hit.full)) return { entry: null, doc: toDocAnswer(hit.passage) };
  return { entry, doc: null };
}
