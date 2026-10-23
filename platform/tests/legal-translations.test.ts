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

// The English files are unreviewed translations of the Bulgarian source
// texts. These checks catch omissions and drift mechanically; they don't
// judge the quality of the translation.
const PAIRS: Record<LegalDocumentId, { bg: LegalDocumentContent; en: LegalDocumentContent }> = {
  terms: { bg: TERMS_BG, en: TERMS_EN },
  privacy: { bg: PRIVACY_BG, en: PRIVACY_EN },
  cookies: { bg: COOKIES_BG, en: COOKIES_EN },
};

// Approved details that stay in Bulgarian in the English text: the company
// name in 1.2 and the address of the Terms.
const KEPT_IN_BULGARIAN = ['3Д ЛУК ООД', 'ж.к. Хр. Смирненски, блок 31б, вх. Б, ет. 2'];

// Client-confirmed details of the Terms. They appear without brackets in
// both languages, so they are not treated as unfilled fields.
const CONFIRMED_TERMS_DETAILS = [
  '3Д ЛУК ООД',
  '3DLOOK LTD',
  '175172901',
  'BG175172901',
  '0895720370',
  'ж.к. Хр. Смирненски, блок 31б, вх. Б, ет. 2',
];

// Unresolved placeholders: the English text keeps the brackets and
// translates only the descriptive label. `[●]` is the same in both.
const PLACEHOLDER_EN: Record<string, string> = {
  '[●]': '[●]',
  '[ТОЧНО ЮРИДИЧЕСКО ЛИЦЕ]': '[EXACT LEGAL ENTITY]',
  '[●/не е приложимо]': '[●/not applicable]',
  '[имейл за лични данни]': '[personal data email]',
  '[адрес/форма за сигнали]': '[reporting address/form]',
  '[имейл за обслужване]': '[customer service email]',
  '[имейл за контакт]': '[contact email]',
  '[имейл за GDPR]': '[GDPR email]',
  '[имейл]': '[email]',
  '[телефон]': '[phone]',
  '[пощенски адрес]': '[postal address]',
  '[попълнете]': '[to be completed]',
  '[попълнете след технически одит]': '[to be completed after a technical audit]',
  '[дата на действително публикуване]': '[actual publication date]',
  '[действителна дата на публикуване]': '[actual publication date]',
  '[утвърден срок, напр. до 30 дни]': '[approved period, e.g. up to 30 days]',
  '[конкретен технически период]': '[specific technical period]',
  '[период, обоснован с целта и защитата на правни претенции]':
    '[period justified by the purpose and the protection of legal claims]',
  '[срок, обоснован чрез оценка на риска]': '[period justified by a risk assessment]',
  '[Потвърдете дали действително има профилиране или автоматизирани решения със значим ефект.]':
    '[Confirm whether there actually is profiling or automated decision-making with a significant effect.]',
};

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
const numbers = (c: LegalDocumentContent) => units(c).flatMap((u) => joined(u.text).match(/\d+/g) ?? []).sort();

describe('Cookie Policy sections (owner-requested removal of the detailed list)', () => {
  it('has the same six numbered sections in Bulgarian and English, without the former sections 4 and 5', () => {
    const numbers = (c: LegalDocumentContent) => c.sections.map((s) => s.heading.match(/^\d+\./)?.[0]);
    expect(numbers(COOKIES_BG)).toEqual(['1.', '2.', '3.', '4.', '5.', '6.']);
    expect(numbers(COOKIES_EN)).toEqual(numbers(COOKIES_BG));
    expect(COOKIES_EN.sections.map((s) => s.heading)).toEqual([
      '1. What cookies are',
      '2. Who uses these technologies',
      '3. What we use them for',
      '4. How you manage your choice',
      '5. Third-party cookies and embedded content',
      '6. Updates and contact',
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

  it('keeps every unresolved placeholder in brackets, translating only its known label', () => {
    for (const token of brackets(bg)) expect(PLACEHOLDER_EN, `unmapped placeholder ${token}`).toHaveProperty([token]);
    expect(brackets(en)).toEqual(brackets(bg).map((token) => PLACEHOLDER_EN[token]).sort());
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

describe('confirmed Terms details', () => {
  const text = (c: LegalDocumentContent) => units(c).map((u) => joined(u.text)).join('\n');

  it('appear without brackets, the same number of times, in the Bulgarian and English Terms', () => {
    for (const detail of CONFIRMED_TERMS_DETAILS) {
      const count = (c: LegalDocumentContent) => text(c).split(detail).length - 1;
      expect(count(TERMS_BG), detail).toBeGreaterThan(0);
      expect(count(TERMS_EN), detail).toBe(count(TERMS_BG));
      for (const c of [TERMS_BG, TERMS_EN]) {
        expect(text(c), detail).not.toContain(`[${detail}]`);
        expect(text(c), detail).not.toMatch(new RegExp(`\\[\\s*${detail.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}`));
      }
    }
  });

  it('are not flagged as unfilled, while the real placeholders still are', () => {
    const problems = validateLegalDocument({ ...LEGAL_DOCUMENTS.terms, content: { bg: TERMS_BG, en: TERMS_EN } });
    for (const detail of CONFIRMED_TERMS_DETAILS) {
      expect(problems.some((p) => p.includes(detail)), detail).toBe(false);
    }
    expect(problems).toEqual(
      expect.arrayContaining([
        'bg: unresolved field [●]',
        'bg: unresolved field [имейл за лични данни]',
        'bg: unresolved field [адрес/форма за сигнали]',
        'bg: unresolved field [дата на действително публикуване]',
        // A translated placeholder is still a placeholder.
        'en: unresolved field [●]',
        'en: unresolved field [personal data email]',
        'en: unresolved field [reporting address/form]',
        'en: unresolved field [actual publication date]',
      ]),
    );
  });
});

describe('English translations and publication', () => {
  it('are not connected to the registry, so nothing renders them', () => {
    for (const id of LEGAL_DOCUMENT_IDS) expect(LEGAL_DOCUMENTS[id].content.en).toBeNull();
  });

  it('would still be blocked by the safeguards if they were connected', () => {
    vi.stubEnv('LEGAL_DOCUMENTS_PUBLISHED', 'true');
    for (const id of LEGAL_DOCUMENT_IDS) {
      const doc = LEGAL_DOCUMENTS[id];
      doc.content.en = structuredClone(PAIRS[id].en);
      const problems = validateLegalDocument(doc);
      expect(problems).toContain('status is not "published"');
      expect(problems).toEqual(expect.arrayContaining(['en: unresolved field [●]']));
    }
  });
});
