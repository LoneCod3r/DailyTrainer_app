import { describe, it, expect } from 'vitest';
import {
  buildExcerpt,
  resultNumberStarts,
  excerptKey,
  normalizeSearchText,
  resultsCountKey,
  searchLibrary,
  type Excerpt,
  type LibrarySearchInput,
} from '@/modules/kuko-way/search';
import { getTopLevelPractices, getSubPractices, getHandbookSections, getPracticeBySlug } from '@/modules/kuko-way/service';
import { getVisiblePrograms } from '@/modules/programs/service';
import { getT } from '@/lib/i18n/dictionaries';

const input: LibrarySearchInput = {
  practices: getTopLevelPractices(),
  subPractices: getSubPractices(),
  sections: getHandbookSections(),
  programs: getVisiblePrograms(),
};

// What a visitor reads: the passage with its ellipses, and the marked parts.
function shown(e: Pick<Excerpt, 'segments' | 'croppedStart' | 'croppedEnd'> | undefined) {
  if (!e) return undefined;
  return {
    text: `${e.croppedStart ? '…' : ''}${e.segments.map((s) => s.text).join('')}${e.croppedEnd ? '…' : ''}`,
    marked: e.segments.filter((s) => s.match).map((s) => s.text),
  };
}

const practiceExcerpt = (q: string, slug: string, locale: 'en' | 'bg') =>
  searchLibrary(input, q, locale).excerpts[excerptKey('practice', slug)];
const sectionExcerpt = (q: string, slug: string, locale: 'en' | 'bg') =>
  searchLibrary(input, q, locale).excerpts[excerptKey('section', slug)];

describe('excerpts from real content', () => {
  it('"kidney" returns Pullover with its benefits passage', () => {
    const r = searchLibrary(input, 'kidney', 'en');
    expect(r.practices.map((p) => p.slug)).toContain('puloover');
    const e = practiceExcerpt('kidney', 'puloover', 'en')!;
    expect(e.field).toBe('benefits');
    expect(e.lang).toBe('en');
    expect(shown(e)).toEqual({ text: 'Works with the area around the kidneys and posterior diaphragm.', marked: ['kidney'] });
  });

  it('"бъбре" shows the Bulgarian benefits passage on the Bulgarian site', () => {
    const e = practiceExcerpt('бъбре', 'puloover', 'bg')!;
    expect(e).toMatchObject({ field: 'benefits', lang: 'bg' });
    expect(shown(e)).toEqual({ text: 'Работи с областта около бъбреците и задната диафрагма.', marked: ['бъбре'] });
  });

  it('a match found only in English is shown as its Bulgarian translation on the Bulgarian site', () => {
    // "kidney" only occurs in the English benefit; the visitor reads the same benefit in Bulgarian.
    const e = practiceExcerpt('kidney', 'puloover', 'bg')!;
    expect(e).toMatchObject({ field: 'benefits', lang: 'bg' });
    expect(shown(e)).toEqual({ text: 'Работи с областта около бъбреците и задната диафрагма.', marked: [] });
  });

  it('a query matching an instruction step shows that step', () => {
    // "palms facing" occurs only in this Swinger step (not in any intro, benefit or title).
    const e = practiceExcerpt('palms facing', 'suinger', 'en')!;
    expect(e.field).toBe('steps');
    expect(shown(e)).toEqual({
      text: 'Let your arms hang in front of you, with your palms facing your body.',
      marked: ['palms facing'],
    });
    // The same step in Bulgarian, found on the Bulgarian site.
    const step = getPracticeBySlug('suinger')!.instructions![0].steps.find((st) => st.en === 'Let your arms hang in front of you, with your palms facing your body.')!;
    const bg = practiceExcerpt(step.bg, 'suinger', 'bg')!;
    expect(bg).toMatchObject({ field: 'steps', lang: 'bg' });
    expect(shown(bg)!.text).toBe(step.bg);
  });

  it('a phrase in both the intro and a step shows the intro (first in reading order)', () => {
    const e = practiceExcerpt('hard palate', 'plazgane-po-nebtseto', 'en')!;
    expect(e.field).toBe('intro');
    const source = getPracticeBySlug('plazgane-po-nebtseto')!.intro![1].en!;
    const s = shown(e)!;
    // The 218-character paragraph is cropped from its start, on a word boundary.
    expect(s.text.endsWith('…')).toBe(true);
    expect(source.startsWith(s.text.slice(0, -1))).toBe(true);
    expect(source[s.text.length - 1]).toBe(' ');
    expect(s.marked.length).toBeGreaterThan(0);
    expect(s.marked.every((m) => m === 'hard palate')).toBe(true);
  });

  it('a query matching a safety note shows a cropped part of it, around the match', () => {
    const e = practiceExcerpt('repositioned', 'piikabu', 'en')!;
    expect(e.field).toBe('safetyNote');
    const s = shown(e)!;
    expect(s.text.startsWith('The bones of an adult skull are not “repositioned”')).toBe(true);
    expect(s.text.endsWith('…')).toBe(true);
    expect(s.marked).toEqual(['repositioned', 'repositioned']);
    // Every visible character comes from the original note, in order.
    const source = getPracticeBySlug('piikabu')!.safetyNote!.en!;
    expect(source.startsWith(s.text.replace(/…$/, ''))).toBe(true);
  });

  it('a handbook sub-section title shows that title, then that sub-section\'s own text', () => {
    const chapter = getHandbookSections().find((c) => c.slug === 'osnovi-na-fastsiyata')!;
    const breathing = chapter.subsections!.find((sub) => sub.title.en === 'Breathing')!;
    const en = sectionExcerpt('Breathing', 'osnovi-na-fastsiyata', 'en')!;
    expect(en.heading).toMatchObject({ field: 'subsection', lang: 'en' });
    expect(shown(en.heading)).toEqual({ text: 'Breathing', marked: ['Breathing'] });
    expect(en).toMatchObject({ field: 'paragraph', lang: 'en' });
    expect(breathing.paragraphs[0].en!.startsWith(shown(en)!.text.replace(/…$/, ''))).toBe(true);
    expect(shown(en)!.marked[0]).toBe('Breathing');

    const bg = sectionExcerpt('Дишане', 'osnovi-na-fastsiyata', 'bg')!;
    expect(shown(bg.heading)).toEqual({ text: 'Дишане', marked: ['Дишане'] });
    expect(breathing.paragraphs[0].bg.startsWith(shown(bg)!.text.replace(/…$/, ''))).toBe(true);
  });
});

describe('title matches also show the item\'s own content', () => {
  const intro = (slug: string, lang: 'en' | 'bg') => getPracticeBySlug(slug)!.intro![0][lang]!;

  it('Stomach: the sub-practice\'s own intro, with the query highlighted', () => {
    const en = practiceExcerpt('Stomach', 'stomah', 'en')!;
    expect(en.heading).toBeUndefined(); // the visitor already sees "Stomach"
    expect(en).toMatchObject({ field: 'intro', lang: 'en' });
    expect(intro('stomah', 'en').startsWith(shown(en)!.text.replace(/…$/, ''))).toBe(true);
    expect(shown(en)!.marked).toContain('stomach');

    const bg = practiceExcerpt('Стомах', 'stomah', 'bg')!;
    expect(bg.heading).toBeUndefined();
    expect(bg).toMatchObject({ field: 'intro', lang: 'bg' });
    expect(intro('stomah', 'bg').startsWith(shown(bg)!.text.replace(/…$/, ''))).toBe(true);
    expect(shown(bg)!.marked[0]).toBe('Стомах'); // from "Стомахът"
  });

  it('Pullover: no passage contains the word, so the opening of its own intro is shown, unhighlighted', () => {
    const en = practiceExcerpt('Pullover', 'puloover', 'en')!;
    expect(en.heading).toBeUndefined();
    expect(en).toMatchObject({ field: 'intro', lang: 'en', croppedStart: false, croppedEnd: true });
    const text = shown(en)!.text.replace(/…$/, '');
    expect(intro('puloover', 'en').startsWith(text)).toBe(true);
    expect(text.length).toBeLessThanOrEqual(160);
    expect(intro('puloover', 'en')[text.length]).toBe(' '); // cut on a word boundary
    expect(shown(en)!.marked).toEqual([]);
  });

  it('an English query on the Bulgarian site: the English title as heading, then Bulgarian content', () => {
    const e = practiceExcerpt('Pullover', 'puloover', 'bg')!;
    expect(e.heading).toMatchObject({ field: 'title', lang: 'en' });
    expect(shown(e.heading)).toEqual({ text: 'Pullover', marked: ['Pullover'] });
    expect(e).toMatchObject({ field: 'intro', lang: 'bg' });
    expect(intro('puloover', 'bg').startsWith(shown(e)!.text.replace(/…$/, ''))).toBe(true);
  });

  it('a Bulgarian query on the English site: the Bulgarian title as heading, then English content', () => {
    const e = practiceExcerpt('Стомах', 'stomah', 'en')!;
    expect(shown(e.heading)).toEqual({ text: 'Стомах', marked: ['Стомах'] });
    // The English intro is the translation of the Bulgarian passage that matched;
    // it doesn't contain "Стомах", so nothing in it is highlighted.
    expect(e).toMatchObject({ field: 'intro', lang: 'en' });
    expect(intro('stomah', 'en').startsWith(shown(e)!.text.replace(/…$/, ''))).toBe(true);
    expect(shown(e)!.marked).toEqual([]);
  });

  it('prefers a passage that contains the query over the opening text', () => {
    const k = practiceExcerpt('kidney', 'babretsi', 'en')!;
    expect(k.heading).toBeUndefined();
    expect(shown(k)!.marked).toContain('kidney');
    const scan = practiceExcerpt('сканиране', 'body-scan-1', 'bg')!;
    expect(shown(scan)!.marked).toContain('сканиране');
  });

  it('a chapter matched by its displayed title shows its own opening paragraph', () => {
    const e = sectionExcerpt('What Is Fascia?', 'kakvo-e-fastsiya', 'en')!;
    expect(e.heading).toBeUndefined();
    expect(e).toMatchObject({ field: 'paragraph', lang: 'en' });
    const p0 = getHandbookSections().find((c) => c.slug === 'kakvo-e-fastsiya')!.paragraphs![0].en!;
    expect(p0.startsWith(shown(e)!.text.replace(/…$/, ''))).toBe(true);
  });

  it('programs: 28-day phase summaries (Bulgarian only) on the Bulgarian site; no other-language excerpt on the English site', () => {
    const excerptOf = (locale: 'en' | 'bg', slug: string) =>
      searchLibrary(input, 'Day Reset', locale).excerpts[excerptKey('program', slug)];
    expect(excerptOf('bg', '28-days')).toMatchObject({ field: 'phaseSummary', lang: 'bg' });
    expect(excerptOf('en', '28-days')).toBeUndefined(); // no English summaries exist
    for (const locale of ['en', 'bg'] as const) {
      for (const slug of ['1-day', '3-days', '7-days']) expect(excerptOf(locale, slug)).toBeUndefined();
    }
  });
});

describe('every result has an excerpt from its own content', () => {
  it.each(['Stomach', 'Стомах', 'Pullover', 'Пулоувър', 'kidney', 'бъбреци', 'Breathing', 'Дишане', 'a', 'и'])(
    'query %s',
    (query) => {
      for (const locale of ['en', 'bg'] as const) {
        const r = searchLibrary(input, query, locale);
        for (const p of r.practices) {
          expect(r.excerpts[excerptKey('practice', p.slug)]?.lang, `${locale} ${p.slug}`).toBe(locale);
        }
        for (const sec of r.sections) {
          expect(r.excerpts[excerptKey('section', sec.slug)]?.lang, `${locale} ${sec.slug}`).toBe(locale);
        }
        for (const prog of r.programs) {
          const hasText = prog.phases.some((ph) => (locale === 'en' ? ph.summary?.en : ph.summary?.bg));
          const e = r.excerpts[excerptKey('program', prog.slug)];
          expect(Boolean(e), `${locale} ${prog.slug}`).toBe(Boolean(hasText));
          if (e) expect(e.lang).toBe(locale);
        }
      }
    },
  );

  it('never uses another item\'s text', () => {
    for (const locale of ['en', 'bg'] as const) {
      const r = searchLibrary(input, 'a', locale);
      for (const p of r.practices) {
        const e = r.excerpts[excerptKey('practice', p.slug)]!;
        const own = [
          ...(p.intro ?? []),
          ...(p.benefits ?? []),
          ...(p.instructions ?? []).flatMap((g) => g.steps),
          ...(p.safetyNote ? [p.safetyNote] : []),
        ].map((t) => t[e.lang] ?? '');
        const visible = shown(e)!.text.replace(/^…|…$/g, '');
        expect(own.some((t) => t.includes(visible)), `${locale} ${p.slug}`).toBe(true);
      }
    }
  });
});

describe('one result, one excerpt', () => {
  it('several matching passages still give a single result with one excerpt', () => {
    const r = searchLibrary(input, 'breathing', 'en');
    const slugs = r.practices.map((p) => p.slug);
    expect(slugs.length).toBe(new Set(slugs).size);
    // Pullover mentions breathing in a benefit and in several steps; the
    // first passage in reading order (the benefit) is the one shown.
    const e = r.excerpts[excerptKey('practice', 'puloover')]!;
    expect(e.field).toBe('benefits');
    expect(shown(e)).toEqual({ text: 'Creates a feeling of freer breathing in the back of the rib cage.', marked: ['breathing'] });
  });

  it('every excerpt belongs to a returned result, and only matched results have one', () => {
    const r = searchLibrary(input, 'kidney', 'bg');
    const keys = new Set([
      ...r.practices.map((p) => excerptKey('practice', p.slug)),
      ...r.sections.map((s) => excerptKey('section', s.slug)),
      ...r.programs.map((p) => excerptKey('program', p.slug)),
    ]);
    for (const key of Object.keys(r.excerpts)) expect(keys.has(key)).toBe(true);
  });

  it('browsing (empty query) and no-match queries have no excerpts', () => {
    expect(searchLibrary(input, '', 'en').excerpts).toEqual({});
    const none = searchLibrary(input, 'zzqqxx', 'en');
    expect(none.practices.length + none.sections.length + none.programs.length).toBe(0);
    expect(none.excerpts).toEqual({});
  });
});

describe('buildExcerpt', () => {
  const q = (s: string) => normalizeSearchText(s);
  const words = (n: number, w = 'word') => Array.from({ length: n }, (_, i) => `${w}${i}`).join(' ');

  it('shows short text in full', () => {
    expect(shown(buildExcerpt('Maintain the lock.', q('lock')))).toEqual({ text: 'Maintain the lock.', marked: ['lock'] });
  });

  it('crops a long paragraph when the match is near the beginning', () => {
    const text = `Target near the start. ${words(60)}`;
    const s = shown(buildExcerpt(text, q('target')))!;
    expect(s.text.startsWith('Target near the start.')).toBe(true);
    expect(s.text.endsWith('…')).toBe(true);
    expect(s.marked).toEqual(['Target']);
  });

  it('crops around a match in the middle, on word boundaries, with ellipses on both sides', () => {
    const text = `${words(40, 'a')} middle target here ${words(40, 'b')}`;
    const s = shown(buildExcerpt(text, q('target')))!;
    expect(s.text.startsWith('…')).toBe(true);
    expect(s.text.endsWith('…')).toBe(true);
    expect(s.marked).toEqual(['target']);
    // Cropped on spaces: no cut-off fragments at either end.
    const inner = s.text.slice(1, -1);
    expect(text.includes(inner)).toBe(true);
    expect(text.indexOf(inner) === 0 || text[text.indexOf(inner) - 1] === ' ').toBe(true);
  });

  it('crops a long paragraph when the match is near the end', () => {
    const text = `${words(60)} and finally the target.`;
    const s = shown(buildExcerpt(text, q('target')))!;
    expect(s.text.startsWith('…')).toBe(true);
    expect(s.text.endsWith('the target.')).toBe(true);
    expect(s.marked).toEqual(['target']);
  });

  it('keeps original capitalisation and punctuation, matching case-insensitively', () => {
    expect(shown(buildExcerpt('BREATHE deeply: Breathe, breathe.', q('breathe')))!.marked).toEqual(['BREATHE', 'Breathe', 'breathe']);
  });

  it('highlights dash variants as written (hyphen query, en dash text)', () => {
    expect(shown(buildExcerpt('Heart–Brain Coherence', q('heart-brain')))).toEqual({
      text: 'Heart–Brain Coherence',
      marked: ['Heart–Brain'],
    });
    expect(shown(buildExcerpt('Кохерентност сърце—мозък', q('сърце-мозък')))!.marked).toEqual(['сърце—мозък']);
  });

  it('highlights text right next to quotes and punctuation without including them', () => {
    expect(shown(buildExcerpt('Клек „Геврек“, бавно.', q('геврек')))).toEqual({ text: 'Клек „Геврек“, бавно.', marked: ['Геврек'] });
  });

  it('shows the passage unhighlighted when a match spans removed quotes or collapsed spaces', () => {
    // Query "pretzel squat" matches “Pretzel” Squat only after quotes are ignored.
    expect(shown(buildExcerpt('“Pretzel” Squat', q('pretzel squat')))).toEqual({ text: '“Pretzel” Squat', marked: [] });
    expect(shown(buildExcerpt('Body   scan', q('body scan')))).toEqual({ text: 'Body   scan', marked: [] });
  });

  it('treats markup-like text as plain text (nothing is interpreted)', () => {
    const s = shown(buildExcerpt('<b>Lock</b> & hold', q('lock')))!;
    expect(s.text).toBe('<b>Lock</b> & hold');
    expect(s.marked).toEqual(['Lock']);
  });

  it('returns nothing when the text does not contain the query', () => {
    expect(buildExcerpt('Maintain the lock.', q('spleen'))).toBeUndefined();
    expect(buildExcerpt('Maintain the lock.', '')).toBeUndefined();
  });
});

describe('result-count wording is unchanged', () => {
  it('0 / 1 / many in both languages', () => {
    expect(getT('en')(resultsCountKey(1), { count: 1 })).toBe('1 result');
    expect(getT('bg')(resultsCountKey(1), { count: 1 })).toBe('1 резултат');
    expect(getT('en')(resultsCountKey(0), { count: 0 })).toBe('0 results');
    expect(getT('bg')(resultsCountKey(3), { count: 3 })).toBe('3 резултата');
  });
});

describe('result numbering', () => {
  const counts = { sections: 2, practices: 3, programs: 4 };

  it('numbers all visible results 1, 2, 3… in display order (Learn, Practices, Programs)', () => {
    expect(resultNumberStarts(counts, { learn: true, practices: true, programs: true })).toEqual({ sections: 1, practices: 3, programs: 6 });
  });

  it('restarts at 1 for the group shown on its own tab', () => {
    expect(resultNumberStarts(counts, { learn: false, practices: true, programs: false }).practices).toBe(1);
    expect(resultNumberStarts(counts, { learn: false, practices: false, programs: true }).programs).toBe(1);
    expect(resultNumberStarts(counts, { learn: true, practices: false, programs: false }).sections).toBe(1);
  });

  it('skips empty groups without leaving gaps', () => {
    expect(resultNumberStarts({ sections: 0, practices: 3, programs: 1 }, { learn: true, practices: true, programs: true })).toEqual({
      sections: 1,
      practices: 1,
      programs: 4,
    });
  });
});

describe('excerpt language follows the site language', () => {
  const intro = (slug: string, lang: 'en' | 'bg') => getPracticeBySlug(slug)!.intro![0][lang]!;

  it('Bulgarian site + "Стомах": Bulgarian excerpt, highlighted', () => {
    const e = practiceExcerpt('Стомах', 'stomah', 'bg')!;
    expect(e.lang).toBe('bg');
    expect(shown(e)!.marked[0]).toBe('Стомах');
  });

  it('Bulgarian site + "Stomach": same result, English title as heading, Bulgarian excerpt', () => {
    expect(searchLibrary(input, 'Stomach', 'bg').practices.map((p) => p.slug)).toEqual(['stomah']);
    const e = practiceExcerpt('Stomach', 'stomah', 'bg')!;
    expect(e.heading).toMatchObject({ field: 'title', lang: 'en' });
    expect(e).toMatchObject({ field: 'intro', lang: 'bg' });
    expect(intro('stomah', 'bg').startsWith(shown(e)!.text.replace(/…$/, ''))).toBe(true);
    expect(shown(e)!.marked).toEqual([]); // the Bulgarian text doesn't contain "Stomach"
  });

  it('English site + "Бъбреци": same Kidneys result, English excerpt', () => {
    expect(searchLibrary(input, 'Бъбреци', 'en').practices.map((p) => p.slug)).toContain('babretsi');
    const e = practiceExcerpt('Бъбреци', 'babretsi', 'en')!;
    expect(e.heading).toMatchObject({ field: 'title', lang: 'bg' });
    expect(e).toMatchObject({ field: 'intro', lang: 'en' });
    expect(intro('babretsi', 'en').startsWith(shown(e)!.text.replace(/…$/, ''))).toBe(true);
  });

  it('"kidney" finds the same results on both sites; the excerpt language follows the site', () => {
    const en = searchLibrary(input, 'kidney', 'en');
    const bg = searchLibrary(input, 'kidney', 'bg');
    expect(bg.practices.map((p) => p.slug)).toEqual(en.practices.map((p) => p.slug));
    for (const p of en.practices) {
      expect(en.excerpts[excerptKey('practice', p.slug)]!.lang).toBe('en');
      expect(bg.excerpts[excerptKey('practice', p.slug)]!.lang).toBe('bg');
      // Same underlying passage: same field on both sites.
      expect(bg.excerpts[excerptKey('practice', p.slug)]!.field).toBe(en.excerpts[excerptKey('practice', p.slug)]!.field);
    }
  });

  it('a query matching only the other language\'s body shows the translated passage, unhighlighted', () => {
    // "hard palate" is only in English text; on the Bulgarian site the same intro passage is shown in Bulgarian.
    const e = practiceExcerpt('hard palate', 'plazgane-po-nebtseto', 'bg')!;
    expect(e).toMatchObject({ field: 'intro', lang: 'bg' });
    const bgIntro = getPracticeBySlug('plazgane-po-nebtseto')!.intro![1].bg;
    expect(bgIntro.startsWith(shown(e)!.text.replace(/…$/, ''))).toBe(true);
    expect(shown(e)!.marked).toEqual([]);
  });

  it('a sub-section matched in the other language: that title as heading, text in the site language', () => {
    const e = sectionExcerpt('Дишане', 'osnovi-na-fastsiyata', 'en')!;
    expect(shown(e.heading)).toEqual({ text: 'Дишане', marked: ['Дишане'] });
    expect(e).toMatchObject({ field: 'paragraph', lang: 'en' });
  });

  it('highlights only text that really contains the query', () => {
    for (const locale of ['en', 'bg'] as const) {
      for (const q of ['Stomach', 'Стомах', 'kidney', 'Бъбреци', 'Breathing', 'Дишане', 'hard palate']) {
        const r = searchLibrary(input, q, locale);
        for (const e of Object.values(r.excerpts)) {
          for (const part of [e, e.heading].filter(Boolean)) {
            for (const m of shown(part)!.marked) expect(normalizeSearchText(m)).toBe(normalizeSearchText(q));
          }
        }
      }
    }
  });
});
