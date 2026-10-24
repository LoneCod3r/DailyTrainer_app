import { describe, it, expect, afterEach, vi } from 'vitest';
import { LEGAL_DOCUMENTS } from '@/modules/legal/documents';
import { validateLegalDocument } from '@/modules/legal/legal.service';
import { TERMS_BG } from '@/modules/legal/content/terms.bg';
import { PRIVACY_BG } from '@/modules/legal/content/privacy.bg';
import { COOKIES_BG } from '@/modules/legal/content/cookies.bg';
import { TERMS_EN } from '@/modules/legal/content/terms.en';
import { PRIVACY_EN } from '@/modules/legal/content/privacy.en';
import { COOKIES_EN } from '@/modules/legal/content/cookies.en';
import {
  LEGAL_DOCUMENT_IDS,
  type LegalContentBlock,
  type LegalDocumentContent,
  type LegalDocumentId,
  type LegalText,
} from '@/modules/legal/types';

// The English files are the English versions of the Bulgarian source
// texts. These checks catch omissions and drift mechanically; they don't
// judge the quality of the translation.
const PAIRS: Record<LegalDocumentId, { bg: LegalDocumentContent; en: LegalDocumentContent }> = {
  terms: { bg: TERMS_BG, en: TERMS_EN },
  privacy: { bg: PRIVACY_BG, en: PRIVACY_EN },
  cookies: { bg: COOKIES_BG, en: COOKIES_EN },
};

// Approved details that stay in Bulgarian in the English text: the company
// name and the address.
const KEPT_IN_BULGARIAN = ['3Д ЛУК ООД', 'ж.к. Хр. Смирненски, блок 31б, вх. Б, ет. 2'];

// Client-confirmed company details. Each appears the same number of times in
// the Bulgarian and English version of every document that uses it.
const CONFIRMED_DETAILS = ['3Д ЛУК ООД', '175172901', '0895720370', 'ж.к. Хр. Смирненски, блок 31б, вх. Б, ет. 2'];

const original = structuredClone(LEGAL_DOCUMENTS);

afterEach(() => {
  for (const id of LEGAL_DOCUMENT_IDS) LEGAL_DOCUMENTS[id] = structuredClone(original[id]);
  vi.unstubAllEnvs();
});

function joined(text: LegalText): string {
  if (typeof text === 'string') return text;
  return text.map((run) => (typeof run === 'string' ? run : 'text' in run ? run.text : '\n')).join('');
}

// Formatting that must survive translation: number of bold runs, monospace
// names, link targets and line breaks.
function shape(text: LegalText) {
  const runs = typeof text === 'string' ? [] : text;
  return {
    strong: runs.filter((r) => typeof r !== 'string' && 'text' in r && r.strong).length,
    code: runs.flatMap((r) => (typeof r !== 'string' && 'text' in r && r.code ? [r.text] : [])),
    hrefs: runs.flatMap((r) => (typeof r !== 'string' && 'text' in r && r.href ? [r.href] : [])),
    breaks: runs.filter((r) => typeof r !== 'string' && 'lineBreak' in r).length,
  };
}

function blockTexts(block: LegalContentBlock): LegalText[] {
  return block.type === 'list' ? block.items : [block.text];
}

// Every text unit in reading order, with where it sits.
function units(content: LegalDocumentContent): { where: string; text: LegalText }[] {
  const out: { where: string; text: LegalText }[] = [];
  if (content.title) out.push({ where: 'title', text: content.title });
  if (content.info) out.push({ where: 'info', text: content.info });
  (content.intro ?? []).forEach((b, i) => blockTexts(b).forEach((t) => out.push({ where: `intro ${i}`, text: t })));
  content.sections.forEach((s, i) => {
    out.push({ where: `section ${i + 1} heading`, text: s.heading });
    s.blocks.forEach((b, j) => blockTexts(b).forEach((t) => out.push({ where: `section ${i + 1} block ${j}`, text: t })));
  });
  (content.closing ?? []).forEach((b, i) => blockTexts(b).forEach((t) => out.push({ where: `closing ${i}`, text: t })));
  return out;
}

const brackets = (c: LegalDocumentContent) => units(c).flatMap((u) => joined(u.text).match(/\[[^\]]*\]/g) ?? []).sort();
// The English text adds the Latin form of the company name once per
// document; its "3" is not a number of the Bulgarian text.
const LATIN_NAME = '3DLOOK LTD';
const numbers = (c: LegalDocumentContent) =>
  units(c).flatMap((u) => joined(u.text).split(LATIN_NAME).join('').match(/\d+/g) ?? []).sort();

describe('Cookie Policy sections (no detailed list, at the owner\'s request)', () => {
  it('has the same six numbered sections in Bulgarian and English, with no detailed list', () => {
    const numbers = (c: LegalDocumentContent) => c.sections.map((s) => s.heading.match(/^\d+\./)?.[0]);
    expect(numbers(COOKIES_BG)).toEqual(['1.', '2.', '3.', '4.', '5.', '6.']);
    expect(numbers(COOKIES_EN)).toEqual(numbers(COOKIES_BG));
    expect(COOKIES_EN.sections.map((s) => s.heading)).toEqual([
      '1. What cookies are',
      '2. Who uses them',
      '3. What we use',
      '4. Third-party services',
      '5. Managing your choice',
      '6. Changes',
    ]);
    expect(JSON.stringify(COOKIES_EN)).not.toMatch(/Detailed list|Necessary and optional technologies|next-auth\.session-token/);
  });
});

describe.each(LEGAL_DOCUMENT_IDS)('English translation of %s', (id) => {
  const { bg, en } = PAIRS[id];

  it('has the same parts, sections, blocks and list lengths as the Bulgarian source', () => {
    expect(Boolean(en.title)).toBe(Boolean(bg.title));
    expect(Boolean(en.info)).toBe(Boolean(bg.info));
    expect(en.intro?.map((b) => b.type)).toEqual(bg.intro?.map((b) => b.type));
    expect(en.closing?.map((b) => b.type)).toEqual(bg.closing?.map((b) => b.type));
    expect(en.sections).toHaveLength(bg.sections.length);
    en.sections.forEach((section, i) => {
      const source = bg.sections[i];
      expect(section.heading.match(/^\d+\./)?.[0]).toBe(source.heading.match(/^\d+\./)?.[0]);
      expect(section.blocks.map((b) => b.type)).toEqual(source.blocks.map((b) => b.type));
      section.blocks.forEach((block, j) => {
        expect(blockTexts(block)).toHaveLength(blockTexts(source.blocks[j]).length);
      });
    });
  });

  it('keeps the clause numbers, bold runs, monospace names, links and line breaks of every text unit', () => {
    const source = units(bg);
    const translation = units(en);
    expect(translation.map((u) => u.where)).toEqual(source.map((u) => u.where));
    translation.forEach((unit, i) => {
      const from = source[i];
      expect(shape(unit.text), unit.where).toEqual(shape(from.text));
      expect(joined(unit.text).match(/^\d+\.\d+\./)?.[0], unit.where).toBe(joined(from.text).match(/^\d+\.\d+\./)?.[0]);
    });
  });

  it('has no pending (bracketed) fields in either language', () => {
    expect(brackets(bg)).toEqual([]);
    expect(brackets(en)).toEqual([]);
  });

  it('keeps every number exactly', () => {
    expect(numbers(en)).toEqual(numbers(bg));
  });

  it('leaves no untranslated Bulgarian, inside or outside brackets, except the approved details', () => {
    for (const unit of units(en)) {
      let text = joined(unit.text);
      for (const name of KEPT_IN_BULGARIAN) text = text.split(name).join('');
      expect(text, unit.where).not.toMatch(/[Ѐ-ӿ]/);
    }
  });
});

describe('confirmed company details', () => {
  const text = (c: LegalDocumentContent) => units(c).map((u) => joined(u.text)).join('\n');

  it('appear the same number of times in the Bulgarian and English version of each document', () => {
    for (const id of LEGAL_DOCUMENT_IDS) {
      const { bg, en } = PAIRS[id];
      for (const detail of CONFIRMED_DETAILS) {
        const count = (c: LegalDocumentContent) => text(c).split(detail).length - 1;
        expect(count(en), `${id}: ${detail}`).toBe(count(bg));
      }
    }
    // The Terms and the Privacy Policy carry the full provider/controller details.
    for (const c of [TERMS_BG, TERMS_EN, PRIVACY_BG, PRIVACY_EN]) {
      for (const detail of CONFIRMED_DETAILS) expect(text(c), detail).toContain(detail);
    }
    expect(text(TERMS_BG)).toContain('BG175172901');
    expect(text(TERMS_EN)).toContain('BG175172901');
  });
});

describe('English translations and publication', () => {
  it('are connected to the registry next to the Bulgarian text', () => {
    for (const id of LEGAL_DOCUMENT_IDS) {
      expect(LEGAL_DOCUMENTS[id].content.en).toEqual(PAIRS[id].en);
      expect(LEGAL_DOCUMENTS[id].content.bg).toEqual(PAIRS[id].bg);
    }
  });

  it('pass every publication check together with the Bulgarian text', () => {
    vi.stubEnv('LEGAL_DOCUMENTS_PUBLISHED', 'true');
    for (const id of LEGAL_DOCUMENT_IDS) expect(validateLegalDocument(LEGAL_DOCUMENTS[id])).toEqual([]);
  });
});
