// Library search: matching rules only, no content imports, so the Library's
// client component and the unit tests share exactly the same logic.
//
// Every searchable item is matched against BOTH languages, whatever the
// current site language — the UI still shows the item in the current
// language. Normalisation is used for matching only; displayed titles and
// stored content are never changed.
import type { LocalizedText, Practice, StartHereSection } from './types';
import type { ResetProgram } from '@/modules/programs/types';
import type { Locale } from '@/lib/i18n/locale';

const DASH = /[‐-―−﹘﹣－]/; // ‐ ‑ ‒ – — ― − and full-width variants
const QUOTE = /["'`‘-‟′″«»‹›]/; // straight, curly, low-9 („‚), guillemets
const SPACE = /\s/;

// Normalises like normalizeSearchText and also records, for every normalised
// character, the index of the original character it came from — so a match
// found in normalised text can be located in the original wording.
function normalizeWithMap(value: string): { source: string; norm: string; map: number[] } {
  const source = value.normalize('NFC');
  let norm = '';
  const map: number[] = [];
  let i = 0;
  for (const ch of source) {
    if (QUOTE.test(ch)) {
      // Quotation marks carry no meaning for matching ("Pretzel" Squat vs Pretzel Squat).
    } else if (SPACE.test(ch)) {
      if (norm && !norm.endsWith(' ')) {
        norm += ' ';
        map.push(i);
      }
    } else {
      const out = DASH.test(ch) ? '-' : ch.toLowerCase();
      for (let k = 0; k < out.length; k++) {
        norm += out[k];
        map.push(i);
      }
    }
    i += ch.length;
  }
  if (norm.endsWith(' ')) {
    norm = norm.slice(0, -1);
    map.pop();
  }
  return { source, norm, map };
}

export function normalizeSearchText(value: string): string {
  return normalizeWithMap(value).norm;
}

function both(text: LocalizedText | undefined): string[] {
  if (!text) return [];
  return text.en ? [text.bg, text.en] : [text.bg];
}

function haystack(parts: string[]): string {
  // A separator no normalised query can contain, so a match never spans two fields.
  return parts.map(normalizeSearchText).join('\u0000');
}

// Title plus the body a visitor actually sees on the practice page — intro,
// benefits, steps and safety note — in both languages, so one practice is one
// result however many fields match. Not indexed: `summary` (never rendered),
// ids/slugs/category, and the generic "Part 1"/"Част 1" group labels (they
// would match every two-part practice).
export function practiceSearchText(practice: Practice): string {
  return haystack([
    ...both(practice.title),
    ...practiceBodyFields(practice).map((f) => f.text),
  ]);
}

// A chapter is one destination: its own title and its sub-section titles all
// lead to the chapter page (sub-sections have no URL of their own).
export function sectionSearchText(section: StartHereSection): string {
  return haystack([...both(section.title), ...(section.subsections ?? []).flatMap((sub) => both(sub.title))]);
}

export function programSearchText(program: ResetProgram): string {
  return haystack(both(program.title));
}

// The Library URL for a query — no `?q=` at all for an empty or whitespace-only
// query, so clearing the search returns to plain browsing.
export const LIBRARY_PATH = '/practices/library';
export function librarySearchHref(query: string): string {
  const q = query.trim();
  return q ? `${LIBRARY_PATH}?q=${encodeURIComponent(q)}` : LIBRARY_PATH;
}

export function matchesQuery(text: string, normalizedQuery: string): boolean {
  return !normalizedQuery || text.includes(normalizedQuery);
}

// "1 result" / "1 резултат" vs "{count} results" / "{count} резултата" (0 uses the plural).
export function resultsCountKey(count: number): 'library.resultsCountOne' | 'library.resultsCount' {
  return count === 1 ? 'library.resultsCountOne' : 'library.resultsCount';
}

// ---------------------------------------------------------------------------
// Excerpts — why a result matched. Built from the original text only; the
// highlighted parts are the exact original characters of each match.
// ---------------------------------------------------------------------------

export type ExcerptField =
  | 'title'
  | 'intro'
  | 'benefits'
  | 'steps'
  | 'safetyNote'
  | 'subsection'
  | 'paragraph'
  | 'phaseSummary';
export type ExcerptSegment = { text: string; match: boolean };
export interface ExcerptPassage {
  field: ExcerptField;
  // Language of the passage itself (shown as written, not translated).
  lang: Locale;
  segments: ExcerptSegment[];
  // True when the passage was cropped at that end ("…").
  croppedStart: boolean;
  croppedEnd: boolean;
}
// What a result card shows under its title: always a passage of the item's
// own content, plus — when the match was on a title the visitor doesn't see
// (the other language's title, or a handbook sub-section title) — that title
// as a heading line above it.
export interface Excerpt extends ExcerptPassage {
  heading?: ExcerptPassage;
}

interface Field {
  field: ExcerptField;
  lang: Locale;
  text: string;
}

function fieldsOf(field: ExcerptField, text: LocalizedText | undefined): Field[] {
  if (!text) return [];
  const out: Field[] = [{ field, lang: 'bg', text: text.bg }];
  if (text.en) out.push({ field, lang: 'en', text: text.en });
  return out;
}

// One passage and its translation, kept together so the excerpt can always
// be shown in the site language whichever language the query matched.
interface Unit {
  field: ExcerptField;
  text: LocalizedText;
}

function unitsOf(field: ExcerptField, texts: (LocalizedText | undefined)[]): Unit[] {
  return texts.filter((t): t is LocalizedText => Boolean(t)).map((text) => ({ field, text }));
}

// Reading order on the practice page.
function practiceBodyUnits(practice: Practice): Unit[] {
  return [
    ...unitsOf('intro', practice.intro ?? []),
    ...unitsOf('benefits', practice.benefits ?? []),
    ...unitsOf('steps', (practice.instructions ?? []).flatMap((group) => group.steps)),
    ...unitsOf('safetyNote', [practice.safetyNote]),
  ];
}

function practiceBodyFields(practice: Practice): Field[] {
  return practiceBodyUnits(practice).flatMap((u) => fieldsOf(u.field, u.text));
}

function inLanguage(text: LocalizedText, locale: Locale): string | undefined {
  return locale === 'en' ? text.en : text.bg;
}

const EXCERPT_MAX = 160; // characters of original text shown at most
const EXCERPT_LEAD = 60; // characters kept before the first match when cropping
const SNAP = 20; // how far to move a crop edge to land on a word boundary

// Every occurrence of the (normalised) query in `text`, as original-text
// ranges. A range is only returned when it maps one-to-one onto the query
// (case and dash differences only); if quotes or collapsed spaces sit inside
// a match, it is left unhighlighted rather than highlighting the wrong text.
function matchRanges(source: string, norm: string, map: number[], q: string): { first: number; ranges: [number, number][] } {
  const ranges: [number, number][] = [];
  let first = -1;
  for (let at = norm.indexOf(q); at !== -1; at = norm.indexOf(q, at + q.length)) {
    const start = map[at];
    const last = map[at + q.length - 1];
    const end = last + ((source.codePointAt(last) ?? 0) > 0xffff ? 2 : 1);
    if (first === -1) first = start;
    if (end - start === q.length) ranges.push([start, end]);
  }
  return { first, ranges };
}

// A short, readable passage of `text` around the first match of the
// normalised query `q`, with every (unambiguous) occurrence marked. Returns
// undefined when `text` doesn't contain the query.
export function buildExcerpt(text: string, q: string): Omit<Excerpt, 'field' | 'lang'> | undefined {
  if (!q) return undefined;
  const { source, norm, map } = normalizeWithMap(text);
  const { first, ranges } = matchRanges(source, norm, map, q);
  if (first === -1) return undefined;

  let start = 0;
  let end = source.length;
  if (source.length > EXCERPT_MAX) {
    start = Math.max(0, first - EXCERPT_LEAD);
    end = Math.min(source.length, start + EXCERPT_MAX);
    start = Math.max(0, end - EXCERPT_MAX);
    if (start > 0) {
      const space = source.indexOf(' ', start);
      if (space !== -1 && space < first && space - start <= SNAP) start = space + 1;
    }
    if (end < source.length) {
      const space = source.lastIndexOf(' ', end);
      const lastMatchEnd = Math.max(first, ...ranges.filter(([s]) => s < end).map(([, e]) => e));
      if (space > lastMatchEnd && end - space <= SNAP) end = space;
    }
  }

  const segments: ExcerptSegment[] = [];
  let cursor = start;
  for (const [s, e] of ranges) {
    if (e <= start || s >= end) continue;
    const from = Math.max(s, start);
    const to = Math.min(e, end);
    if (from > cursor) segments.push({ text: source.slice(cursor, from), match: false });
    segments.push({ text: source.slice(from, to), match: true });
    cursor = to;
  }
  if (cursor < end) segments.push({ text: source.slice(cursor, end), match: false });
  return { segments, croppedStart: start > 0, croppedEnd: end < source.length };
}

// The opening of `text`, used when an item matched by its title and none of
// its content contains the query.
function buildLead(text: string): Omit<ExcerptPassage, 'field' | 'lang'> {
  const source = text.normalize('NFC');
  if (source.length <= EXCERPT_MAX) return { segments: [{ text: source, match: false }], croppedStart: false, croppedEnd: false };
  let end = EXCERPT_MAX;
  const space = source.lastIndexOf(' ', end);
  if (space > EXCERPT_MAX - SNAP) end = space;
  return { segments: [{ text: source.slice(0, end), match: false }], croppedStart: false, croppedEnd: true };
}

function byLocale<T extends { lang: Locale }>(items: T[], locale: Locale): T[] {
  return [...items.filter((f) => f.lang === locale), ...items.filter((f) => f.lang !== locale)];
}

// A passage of the item's own content, always in the site language:
//   1. the first passage (reading order) whose site-language text contains
//      the query — highlighted;
//   2. else the site-language translation of the first passage whose
//      other-language text contains the query — unhighlighted, since the
//      translation doesn't contain the query's wording;
//   3. else the opening of the first passage (an intro or chapter paragraph).
// Passages without a site-language text are never shown in the other
// language; with none at all, there is no excerpt.
function passageFor(units: Unit[], q: string, locale: Locale): ExcerptPassage | undefined {
  const available = units.filter((u) => inLanguage(u.text, locale));
  for (const u of available) {
    const built = buildExcerpt(inLanguage(u.text, locale)!, q);
    if (built) return { field: u.field, lang: locale, ...built };
  }
  const other: Locale = locale === 'en' ? 'bg' : 'en';
  const translated = available.find((u) => {
    const text = inLanguage(u.text, other);
    return text !== undefined && normalizeSearchText(text).includes(q);
  });
  const lead = translated ?? available[0];
  return lead && { field: lead.field, lang: locale, ...buildLead(inLanguage(lead.text, locale)!) };
}

function titleMatches(titles: LocalizedText, q: string): boolean {
  return fieldsOf('title', titles).some((f) => normalizeSearchText(f.text).includes(q));
}

// The other language's title, when only it matched (e.g. "Pullover" on the
// Bulgarian site) — the visitor sees the title in their language, so this
// explains the match. Nothing when the displayed title itself matched.
function otherTitleHeading(titles: LocalizedText, q: string, locale: Locale): ExcerptPassage | undefined {
  const shown = locale === 'en' && titles.en ? titles.en : titles.bg;
  const hits = fieldsOf('title', titles).filter((f) => normalizeSearchText(f.text).includes(q));
  if (hits.length === 0 || hits.some((f) => f.text === shown)) return undefined;
  const built = buildExcerpt(hits[0].text, q);
  return built && { field: 'title', lang: hits[0].lang, ...built };
}

function withHeading(passage: ExcerptPassage | undefined, heading: ExcerptPassage | undefined): Excerpt | undefined {
  if (!passage) return undefined;
  return heading ? { ...passage, heading } : passage;
}

function practiceExcerpt(practice: Practice, q: string, locale: Locale): Excerpt | undefined {
  return withHeading(passageFor(practiceBodyUnits(practice), q, locale), otherTitleHeading(practice.title, q, locale));
}

// Chapters are matched by title and sub-section titles only (see
// sectionSearchText); their paragraphs are used here for display only.
function sectionExcerpt(section: StartHereSection, q: string, locale: Locale): Excerpt | undefined {
  const subs = section.subsections ?? [];
  const paragraphs = (texts: LocalizedText[]) => unitsOf('paragraph', texts);
  if (titleMatches(section.title, q)) {
    const all = [...paragraphs(section.paragraphs ?? []), ...subs.flatMap((sub) => paragraphs(sub.paragraphs))];
    return withHeading(passageFor(all, q, locale), otherTitleHeading(section.title, q, locale));
  }
  // Matched a sub-section title: show that title, then that sub-section's text.
  const candidates = byLocale(
    subs.flatMap((sub) => fieldsOf('subsection', sub.title).map((f) => ({ ...f, sub }))),
    locale,
  );
  const hit = candidates.find((c) => normalizeSearchText(c.text).includes(q));
  if (!hit) return undefined;
  const heading = buildExcerpt(hit.text, q);
  return withHeading(
    passageFor(paragraphs(hit.sub.paragraphs), q, locale),
    heading && { field: 'subsection', lang: hit.lang, ...heading },
  );
}

// Programs have no published text yet except the 28-day phase summaries
// (Bulgarian only); without text in the site language, a program result has
// no excerpt (never an invented or other-language one).
function programExcerpt(program: ResetProgram, q: string, locale: Locale): Excerpt | undefined {
  const summaries = unitsOf('phaseSummary', program.phases.map((phase) => phase.summary));
  return withHeading(passageFor(summaries, q, locale), otherTitleHeading(program.title, q, locale));
}

// Search results are numbered 1, 2, 3… in display order across the visible
// groups (Learn, then Practices, then Programs). Derived from what is shown,
// so it restarts with every query or tab change.
export function resultNumberStarts(
  counts: { sections: number; practices: number; programs: number },
  visible: { learn: boolean; practices: boolean; programs: boolean },
): { sections: number; practices: number; programs: number } {
  const sections = 1;
  const practices = sections + (visible.learn ? counts.sections : 0);
  const programs = practices + (visible.practices ? counts.practices : 0);
  return { sections, practices, programs };
}

export function excerptKey(kind: 'practice' | 'section' | 'program', slug: string): string {
  return `${kind}:${slug}`;
}

export interface LibrarySearchInput {
  // Top-level practices: browsed and searched.
  practices: Practice[];
  // Organ Reset sub-practices: searched only — never listed while browsing.
  subPractices: Practice[];
  sections: StartHereSection[];
  // Already filtered to what the visitor may see (getVisiblePrograms()).
  programs: ResetProgram[];
}

export interface LibrarySearchResult {
  practices: Practice[];
  sections: StartHereSection[];
  programs: ResetProgram[];
  // A passage for each result, keyed by excerptKey(). Absent only when an
  // item has no text of its own (programs without published content), and
  // always empty while browsing.
  excerpts: Record<string, Excerpt>;
}

export function searchLibrary(input: LibrarySearchInput, query: string, locale: Locale = 'bg'): LibrarySearchResult {
  const q = normalizeSearchText(query);
  if (!q) return { practices: input.practices, sections: input.sections, programs: input.programs, excerpts: {} };

  const practices = [...input.practices, ...input.subPractices]
    .filter((p) => matchesQuery(practiceSearchText(p), q))
    .sort((a, b) => a.order - b.order);
  const sections = input.sections.filter((s) => matchesQuery(sectionSearchText(s), q));
  const programs = input.programs.filter((p) => matchesQuery(programSearchText(p), q));

  const excerpts: Record<string, Excerpt> = {};
  const put = (key: string, excerpt: Excerpt | undefined) => {
    if (excerpt) excerpts[key] = excerpt;
  };
  for (const p of practices) put(excerptKey('practice', p.slug), practiceExcerpt(p, q, locale));
  for (const sec of sections) put(excerptKey('section', sec.slug), sectionExcerpt(sec, q, locale));
  for (const p of programs) put(excerptKey('program', p.slug), programExcerpt(p, q, locale));
  return { practices, sections, programs, excerpts };
}
