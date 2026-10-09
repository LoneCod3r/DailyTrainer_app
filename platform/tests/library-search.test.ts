import { describe, it, expect, vi, afterEach } from 'vitest';
import {
  librarySearchHref,
  normalizeSearchText,
  practiceSearchText,
  resultNumberStarts,
  searchLibrary,
  resultsCountKey,
  type LibrarySearchInput,
} from '@/modules/kuko-way/search';
import { getTopLevelPractices, getSubPractices, getHandbookSections } from '@/modules/kuko-way/service';
import type { Practice } from '@/modules/kuko-way/types';
import { getVisiblePrograms } from '@/modules/programs/service';
import { getT } from '@/lib/i18n/dictionaries';

// The same inputs the Library page passes to LibraryBrowser.
const input: LibrarySearchInput = {
  practices: getTopLevelPractices(),
  subPractices: getSubPractices(),
  sections: getHandbookSections(),
  programs: getVisiblePrograms(),
};

const practiceSlugs = (q: string) => searchLibrary(input, q).practices.map((p) => p.slug);
const sectionSlugs = (q: string) => searchLibrary(input, q).sections.map((s) => s.slug);
const programSlugs = (q: string) => searchLibrary(input, q).programs.map((p) => p.slug);

describe('normalizeSearchText', () => {
  it('trims, lower-cases and collapses whitespace', () => {
    expect(normalizeSearchText('   Body \t  SCAN\n ')).toBe('body scan');
    expect(normalizeSearchText('  ПУЛОУВЪР  ')).toBe('пулоувър');
  });

  it('maps hyphen, en dash, em dash and minus to one hyphen', () => {
    const forms = ['Heart-Brain', 'Heart–Brain', 'Heart—Brain', 'Heart‑Brain', 'Heart−Brain'];
    expect(new Set(forms.map(normalizeSearchText))).toEqual(new Set(['heart-brain']));
  });

  it('ignores straight and curly single/double quotes, including Bulgarian low-9 quotes', () => {
    expect(normalizeSearchText('“Pretzel” Squat')).toBe('pretzel squat');
    expect(normalizeSearchText('"Pretzel" Squat')).toBe('pretzel squat');
    expect(normalizeSearchText('Клек „Геврек“')).toBe('клек геврек');
    expect(normalizeSearchText("‘Horns’ 'Twist'")).toBe('horns twist');
  });

  it('keeps Bulgarian letters and digits intact', () => {
    expect(normalizeSearchText('Сканиране на тялото #1')).toBe('сканиране на тялото #1');
    expect(normalizeSearchText('Щитовидна жлеза')).toBe('щитовидна жлеза');
  });
});

describe('searchLibrary — cross-language titles', () => {
  it('finds a practice by its English title whatever the site language', () => {
    expect(practiceSlugs('Pullover')).toEqual(['puloover']);
  });

  it('finds the same practice by its Bulgarian title', () => {
    expect(practiceSlugs('Пулоувър')).toEqual(['puloover']);
  });

  it('matches case-insensitively in both languages', () => {
    expect(practiceSlugs('pULLOVER')).toEqual(['puloover']);
    expect(practiceSlugs('сКАНИРАНЕ')).toEqual(['body-scan-1', 'body-scan-2']);
    expect(practiceSlugs('BODY SCAN')).toEqual(['body-scan-1', 'body-scan-2']);
  });

  it('returns one result per item when both localized titles match', () => {
    // "Antigravity" / "Антигравитация" — "a" is in both titles of many items.
    const slugs = practiceSlugs('a');
    expect(slugs.length).toBe(new Set(slugs).size);
    const sections = sectionSlugs('kuko way');
    expect(sections.length).toBe(new Set(sections).size);
  });

  it('matches Heart–Brain Coherence whichever dash the visitor types', () => {
    for (const q of ['Heart-Brain', 'Heart–Brain', 'heart—brain', 'сърце-мозък', 'Кохерентност сърце–мозък']) {
      expect(practiceSlugs(q)).toEqual(['koherentnost-sartse-mozak']);
    }
  });

  it('matches titles with quotes even when the query has none or different ones', () => {
    expect(practiceSlugs('Pretzel Squat')).toEqual(['klek-gevrek']);
    // Cheek Release's steps also mention the "Horns" Twist, so it matches too.
    expect(practiceSlugs('"Horns" Twist')).toContain('usukvane-roga');
    expect(practiceSlugs('Клек Геврек')).toEqual(['klek-gevrek']);
  });

  it('handles surrounding and repeated whitespace', () => {
    expect(practiceSlugs('   body    scan  ')).toEqual(['body-scan-1', 'body-scan-2']);
  });

  it('finds handbook chapters by either language', () => {
    expect(sectionSlugs('What Is Fascia?')).toEqual(['kakvo-e-fastsiya']);
    expect(sectionSlugs('Какво е фасция?')).toEqual(['kakvo-e-fastsiya']);
  });

  it('finds programs by either language (titles are the same in both)', () => {
    expect(programSlugs('7 Day Reset')).toEqual(['7-days']);
  });

  it('returns nothing for a query that matches no title', () => {
    const r = searchLibrary(input, 'zzqqxx');
    expect(r.practices).toEqual([]);
    expect(r.sections).toEqual([]);
    expect(r.programs).toEqual([]);
  });
});

describe('searchLibrary — Organ Reset sub-practices', () => {
  it('has the eight sub-practices, all children of Organ Reset', () => {
    expect(input.subPractices).toHaveLength(8);
    expect(new Set(input.subPractices.map((p) => p.parentId))).toEqual(new Set(['organ-reset']));
  });

  it.each([
    ['Stomach', 'Стомах', 'stomah'],
    ['Kidneys', 'Бъбреци', 'babretsi'],
    ['Ileocecal Valve', 'Илеоцекална клапа', 'ileotsekalna-klapa'],
    ['Gallbladder and Liver', 'Жлъчен мехур и черен дроб', 'zhlachen-mehur-i-cheren-drob'],
    ['Pancreas', 'Панкреас', 'pankreas'],
    ['Bladder', 'Пикочен мехур', 'pikochen-mehur'],
    ['Spleen', 'Далак', 'dalak'],
    ['Thyroid Gland', 'Щитовидна жлеза', 'shtitovidna-zhleza'],
  ])('finds %s / %s', (en, bg, slug) => {
    expect(practiceSlugs(en)).toContain(slug);
    expect(practiceSlugs(bg)).toContain(slug);
  });

  it('never lists sub-practices while browsing (empty query)', () => {
    const browsing = searchLibrary(input, '').practices.map((p) => p.slug);
    expect(browsing).toEqual(getTopLevelPractices().map((p) => p.slug));
    for (const sub of input.subPractices) expect(browsing).not.toContain(sub.slug);
    expect(searchLibrary(input, '   ').practices).toEqual(input.practices);
  });
});

describe('searchLibrary — handbook sub-section titles', () => {
  // The handbook's 19 second-level headings outside the maneuvers live on the
  // site as 17 chapter sub-sections plus two chapters of their own
  // ("What Is a Fascial Maneuver?", "Body Zones").
  it('finds the two handbook headings that are chapters of their own', () => {
    expect(sectionSlugs('What Is a Fascial Maneuver?')).toEqual(['kakvo-e-fastsialna-manevra']);
    expect(sectionSlugs('Зони на тялото')).toEqual(['zoni-na-tyaloto']);
  });

  it('covers all 17 chapter sub-sections in both languages', () => {
    const subs = input.sections.flatMap((s) => (s.subsections ?? []).map((sub) => ({ chapter: s.slug, sub })));
    expect(subs).toHaveLength(17);
    for (const { chapter, sub } of subs) {
      expect(sectionSlugs(sub.title.bg)).toContain(chapter);
      if (sub.title.en) expect(sectionSlugs(sub.title.en)).toContain(chapter);
    }
  });

  it('finds the parent chapter by a sub-section title in either language', () => {
    expect(sectionSlugs('Breathing')).toEqual(['osnovi-na-fastsiyata']);
    expect(sectionSlugs('Дишане')).toEqual(['osnovi-na-fastsiyata']);
    expect(sectionSlugs('Fetal Position')).toEqual(['osnovi-na-tyaloto']);
  });

  it('returns the chapter once when its title and a sub-section both match', () => {
    // "Foundations of Fascia" chapter has no sub-section named the same, but
    // "fascia" hits the chapter title; it must still appear only once.
    const slugs = sectionSlugs('fascia');
    expect(slugs.filter((s) => s === 'osnovi-na-fastsiyata')).toHaveLength(1);
  });
});

describe('searchLibrary — practice content (Phase 2)', () => {
  // Each query below appears in exactly one practice's body and in no title.
  it.each([
    ['intro (EN)', 'establish', 'body-scan-1'],
    ['intro (BG)', 'отделете', 'body-scan-1'],
    ['benefits (EN)', 'relieve', 'plazgane-po-nebtseto'],
    ['benefits (BG)', 'индиректна', 'plazgane-po-nebtseto'],
    ['steps (EN)', 'hard palate', 'plazgane-po-nebtseto'],
    ['steps (BG)', 'твърдото небце', 'plazgane-po-nebtseto'],
    ['safety note (EN)', 'repositioned', 'piikabu'],
    ['safety note (BG)', 'костите', 'piikabu'],
    ['parent intro / safety note (EN)', 'surgery', 'restart-na-organite'],
  ])('finds a practice by its %s', (_field, q, slug) => {
    expect(practiceSlugs(q)).toEqual([slug]);
  });

  it('searches sub-practice bodies too', () => {
    // Every sub-practice step text is reachable, e.g. a Kidneys step.
    const kidneys = input.subPractices.find((p) => p.slug === 'babretsi')!;
    const step = kidneys.instructions![0].steps[2];
    expect(practiceSlugs(step.bg)).toContain('babretsi');
    expect(practiceSlugs(step.en!)).toContain('babretsi');
  });

  it('returns one result even when the title and several body fields match', () => {
    const slugs = practiceSlugs('сканиране');
    expect(slugs.filter((s) => s === 'body-scan-1')).toHaveLength(1);
  });

  it('does not index slugs, ids, categories, summary or group labels', () => {
    expect(practiceSlugs('puloover')).toEqual([]); // slug only — the titles are Pullover / Пулоувър
    // (No live query for the category: "full-body" also occurs in real step text.)
    const synthetic: Practice = {
      id: 'zzid',
      slug: 'zzslug',
      category: 'reset',
      order: 1,
      title: { bg: 'Заглавие', en: 'Title' },
      summary: { bg: 'zzsummary', en: 'zzsummary' },
      instructions: [{ label: { bg: 'zzlabel', en: 'zzlabel' }, steps: [{ bg: 'стъпка', en: 'step' }] }],
    };
    const text = practiceSearchText(synthetic);
    for (const hidden of ['zzid', 'zzslug', 'reset', 'zzsummary', 'zzlabel']) expect(text).not.toContain(hidden);
    for (const shown of ['заглавие', 'title', 'стъпка', 'step']) expect(text).toContain(shown);
  });

  it('does not search handbook chapter bodies (titles and sub-section titles only)', () => {
    // A phrase from the "What Is Fascia?" chapter body.
    const body = input.sections.find((s) => s.slug === 'kakvo-e-fastsiya')!.paragraphs![0].en!;
    expect(sectionSlugs(body.slice(0, 40))).toEqual([]);
  });
});

describe('result-count wording', () => {
  for (const [locale, zero, one, many] of [
    ['en', '0 results', '1 result', '5 results'],
    ['bg', '0 резултата', '1 резултат', '5 резултата'],
  ] as const) {
    it(`uses natural ${locale.toUpperCase()} wording for 0, 1 and many`, () => {
      const t = getT(locale);
      expect(t(resultsCountKey(0), { count: 0 })).toBe(zero);
      expect(t(resultsCountKey(1), { count: 1 })).toBe(one);
      expect(t(resultsCountKey(5), { count: 5 })).toBe(many);
    });
  }
});

describe('visibility rules are respected', () => {
  afterEach(() => {
    vi.unstubAllEnvs();
    vi.resetModules();
  });

  it('cannot surface unpublished programs when preview is off', async () => {
    vi.stubEnv('NODE_ENV', 'production');
    vi.stubEnv('NEXT_PUBLIC_FEATURE_PROGRAMS_PREVIEW', '');
    vi.resetModules();
    const { getVisiblePrograms: visibleInProd } = await import('@/modules/programs/service');
    const { searchLibrary: search } = await import('@/modules/kuko-way/search');
    const programs = visibleInProd();
    // All four programs are unpublished in the content manifests today.
    expect(programs).toEqual([]);
    expect(search({ ...input, programs }, 'Reset').programs).toEqual([]);
  });

  it('only searches the programs it is given', () => {
    const only7 = input.programs.filter((p) => p.slug === '7-days');
    expect(searchLibrary({ ...input, programs: only7 }, 'Day Reset').programs.map((p) => p.slug)).toEqual(['7-days']);
  });
});

describe('resetting the search', () => {
  it('an empty or whitespace-only query has no ?q= at all', () => {
    expect(librarySearchHref('')).toBe('/practices/library');
    expect(librarySearchHref('   ')).toBe('/practices/library');
    expect(librarySearchHref('\t\n ')).toBe('/practices/library');
  });

  it('a real query is trimmed and safely encoded', () => {
    expect(librarySearchHref('  kidney  ')).toBe('/practices/library?q=kidney');
    expect(librarySearchHref('body scan')).toBe('/practices/library?q=body%20scan');
    expect(librarySearchHref('Бъбреци')).toBe(`/practices/library?q=${encodeURIComponent('Бъбреци')}`);
    expect(librarySearchHref('a&b=c#d')).toBe('/practices/library?q=a%26b%3Dc%23d');
  });

  it('search, then clear: previous results and excerpts are gone, browsing is back', () => {
    const searched = searchLibrary(input, 'kidney', 'en');
    expect(searched.practices.map((p) => p.slug)).toContain('puloover');
    expect(Object.keys(searched.excerpts).length).toBeGreaterThan(0);
    for (const cleared of ['', '   ']) {
      const r = searchLibrary(input, cleared, 'en');
      expect(r.practices).toEqual(input.practices); // top-level browsing list, no sub-practices
      expect(r.sections).toEqual(input.sections);
      expect(r.programs).toEqual(input.programs);
      expect(r.excerpts).toEqual({}); // no stale excerpts or highlights
    }
  });

  it('a new search after a reset works normally, in either language', () => {
    searchLibrary(input, 'kidney', 'bg');
    searchLibrary(input, '', 'bg');
    const again = searchLibrary(input, 'Стомах', 'bg');
    expect(again.practices.map((p) => p.slug)).toEqual(['stomah']);
    expect(again.excerpts['practice:stomah']!.lang).toBe('bg');
  });

  it('numbering after a reset and a new search starts at 1 again on every tab', () => {
    const r = searchLibrary(input, 'reset', 'en');
    const counts = { sections: r.sections.length, practices: r.practices.length, programs: r.programs.length };
    expect(resultNumberStarts(counts, { learn: false, practices: false, programs: true }).programs).toBe(1);
    expect(resultNumberStarts(counts, { learn: true, practices: true, programs: true }).sections).toBe(1);
  });
});
