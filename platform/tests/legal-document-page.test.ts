import { describe, it, expect, afterEach, vi } from 'vitest';
import { createElement } from 'react';
import { renderToStaticMarkup } from 'react-dom/server';
import { LEGAL_DOCUMENTS } from '@/modules/legal/documents';
import { COMPANY_INFO } from '@/modules/legal/company';
import {
  LEGAL_DOCUMENT_IDS,
  type LegalContentBlock,
  type LegalDocumentContent,
  type LegalDocumentId,
  type LegalText,
} from '@/modules/legal/types';
import { LegalDocumentPage } from '@/components/legal/LegalDocumentPage';
import { getLocale } from '@/lib/i18n/get-locale';
import TermsPage from '@/app/(app)/terms/page';
import PrivacyPage from '@/app/(app)/privacy/page';
import CookiesPage from '@/app/(app)/cookies/page';

// The page reads the visitor's locale from the request cookies.
vi.mock('@/lib/i18n/get-locale', () => ({ getLocale: vi.fn(() => 'bg') }));

// Test fixture only: obviously-fake text used to exercise the renderer. It is
// NOT legal wording and never ships.
const RICH_FIXTURE: LegalDocumentContent = {
  title: 'FIXTURE TITLE',
  info: [{ text: 'Fixture version:', strong: true }, ' 9', { lineBreak: true }, 'second line'],
  intro: [{ type: 'blockquote', text: [{ text: 'Quoted:', strong: true }, ' fixture note'] }],
  sections: [
    {
      heading: '1. Fixture heading',
      blocks: [
        {
          type: 'paragraph',
          text: ['1.1. See ', { text: 'the fixture link', href: 'https://example.dev/privacy' }, ' and ', { text: 'fixture_key', code: true }, '.'],
        },
        { type: 'list', items: [[{ text: 'Item:', strong: true }, ' {contactEmail}'], 'plain item'] },
      ],
    },
  ],
  closing: [{ type: 'paragraph', text: [{ text: 'Closing:', strong: true }, ' fixture'] }],
};

const original = structuredClone(LEGAL_DOCUMENTS);
const originalCompany = { ...COMPANY_INFO };

function activate(content: LegalDocumentContent) {
  vi.stubEnv('LEGAL_DOCUMENTS_PUBLISHED', 'true');
  Object.assign(LEGAL_DOCUMENTS.terms, {
    status: 'published',
    version: '9.9',
    effectiveDate: '2026-11-01',
    content: { bg: structuredClone(content), en: structuredClone(content) },
  });
  COMPANY_INFO.contactEmail = 'legal@example.dev';
}

function render(id: LegalDocumentId = 'terms', searchParams?: Record<string, string>) {
  return renderToStaticMarkup(createElement(LegalDocumentPage, { id, searchParams }));
}

const PREVIEW = { preview: 'draft' };

// Every piece of text in a document, in reading order, HTML-escaped the way
// React escapes text. Strings are split at placeholders (`{token}`, `[…]`),
// which the preview renders as separately marked elements.
function documentTexts(content: LegalDocumentContent): string[] {
  const text = (t: LegalText) =>
    typeof t === 'string' ? [t] : t.flatMap((run) => (typeof run === 'string' ? [run] : 'text' in run ? [run.text] : []));
  const block = (b: LegalContentBlock) => (b.type === 'list' ? b.items.flatMap(text) : text(b.text));
  return [
    content.title!,
    ...(content.info ? text(content.info) : []),
    ...(content.intro ?? []).flatMap(block),
    ...content.sections.flatMap((s) => [s.heading, ...s.blocks.flatMap(block)]),
    ...(content.closing ?? []).flatMap(block),
  ]
    .flatMap((s) => s.split(/\{\w+\}|\[[^\]]+\]/))
    .filter((s) => s.length > 0)
    .map((s) => s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;').replace(/'/g, '&#x27;'));
}

function expectInOrder(html: string, texts: string[]) {
  let from = 0;
  for (const text of texts) {
    const at = html.indexOf(text, from);
    expect(at, `missing or out of order: ${text.slice(0, 80)}`).toBeGreaterThanOrEqual(0);
    from = at + text.length;
  }
}

afterEach(() => {
  for (const id of LEGAL_DOCUMENT_IDS) LEGAL_DOCUMENTS[id] = structuredClone(original[id]);
  Object.assign(COMPANY_INFO, originalCompany);
  vi.mocked(getLocale).mockReturnValue('bg');
  vi.unstubAllEnvs();
});

describe('LegalDocumentPage', () => {
  it('shows only the "not yet published" notice for the current drafts, never their text', () => {
    for (const id of LEGAL_DOCUMENT_IDS) {
      const html = renderToStaticMarkup(createElement(LegalDocumentPage, { id }));
      expect(html).toContain('data-testid="legal-document-unpublished"');
      expect(html).not.toContain('data-testid="legal-document-content"');
      expect(html).not.toContain(LEGAL_DOCUMENTS[id].content.bg!.title!);
      expect(html).not.toMatch(/проект 1\.0|\[●\]|не за публикуване/);
    }
  });

  it('renders the source formatting of an active document: title, info line, quote, links, monospace, breaks, rule', () => {
    activate(RICH_FIXTURE);
    const html = render();
    expect(html).toContain('data-testid="legal-document-content"');
    // The document's own title replaces the short navigation title, once.
    expect(html).toMatch(/<h1[^>]*>FIXTURE TITLE<\/h1>/);
    expect(html).not.toContain('Общи условия');
    // The source's draft info line is never published; the registry's
    // version/date line is shown instead.
    expect(html).not.toContain('Fixture version:');
    expect(html).toContain('Версия 9.9 · В сила от');
    expect(html).toMatch(/<blockquote[^>]*><strong[^>]*>Quoted:<\/strong> fixture note<\/blockquote>/);
    expect(html).toMatch(/<h2[^>]*>1\. Fixture heading<\/h2>/);
    expect(html).toMatch(/1\.1\. See <a href="https:\/\/example\.dev\/privacy"[^>]*>the fixture link<\/a> and <code[^>]*>fixture_key<\/code>\./);
    expect(html).toMatch(/<li><strong[^>]*>Item:<\/strong> legal@example\.dev<\/li><li>plain item<\/li>/);
    // The closing note comes after a horizontal rule, outside the last section.
    expect(html).toMatch(/<\/section><hr[^>]*\/><div[^>]*><p><strong[^>]*>Closing:<\/strong> fixture<\/p><\/div><\/article>/);
  });

  it('gives an active document its published rendering even when a draft preview is requested in development', () => {
    vi.stubEnv('NODE_ENV', 'development');
    activate(RICH_FIXTURE);
    const html = render('terms', PREVIEW);
    expect(html).toContain('data-testid="legal-document-content"');
    expect(html).not.toContain('legal-document-draft-preview');
    expect(html).not.toContain('id="section-1"');
  });

  it('leaves the draft info line and every internal block out of a published page', () => {
    activate({
      title: 'FIXTURE TITLE',
      info: [{ text: 'Status:', strong: true }, ' fixture draft line'],
      intro: [{ type: 'blockquote', internal: true, text: 'Fixture team note' }],
      sections: [
        {
          heading: '1. Fixture heading',
          blocks: [
            { type: 'paragraph', text: '1.1. Public fixture clause.' },
            { type: 'paragraph', internal: true, text: 'Fixture internal paragraph' },
          ],
        },
      ],
      closing: [{ type: 'paragraph', internal: true, text: 'Fixture closing checklist' }],
    });
    const html = render();
    expect(html).toContain('data-testid="legal-document-content"');
    expect(html).toContain('1.1. Public fixture clause.');
    for (const hidden of ['fixture draft line', 'Fixture team note', 'Fixture internal paragraph', 'Fixture closing checklist']) {
      expect(html).not.toContain(hidden);
    }
    expect(html).not.toContain('legal-internal-note');
    expect(html).not.toContain('<blockquote');
    // Nothing public after the closing rule, so no rule either.
    expect(html).not.toContain('<hr');
    expect(html).toContain('Версия 9.9 · В сила от');
  });

  it('keeps the generated title and version line for content without its own', () => {
    activate({ sections: [{ heading: 'Fixture', blocks: [{ type: 'paragraph', text: 'Plain fixture text.' }] }] });
    const html = render();
    expect(html).toMatch(/<h1[^>]*>Общи условия<\/h1>/);
    expect(html).toContain('Версия 9.9 · В сила от');
    expect(html).not.toContain('<hr');
  });
});

describe('LegalDocumentPage draft preview', () => {
  it('in development, ?preview=draft renders the complete Bulgarian draft, in source order, marked as a draft', () => {
    vi.stubEnv('NODE_ENV', 'development');
    for (const id of LEGAL_DOCUMENT_IDS) {
      const draft = LEGAL_DOCUMENTS[id].content.bg!;
      const html = render(id, PREVIEW);
      expect(html).toContain('data-testid="legal-draft-preview-notice"');
      expect(html).toContain('Непубликувана чернова (локален преглед)');
      expect(html).toContain('data-testid="legal-document-draft-preview"');
      expect(html).toMatch(/<article data-testid="legal-document-draft-preview" lang="bg"/);
      // Not the published rendering, and nothing claims a version/date.
      expect(html).not.toContain('data-testid="legal-document-content"');
      expect(html).not.toContain('legal-document-unpublished');
      expect(html).not.toMatch(/В сила от/);
      expect(html).toMatch(new RegExp(`<h1[^>]*>${draft.title}</h1>`));

      // The title is the page heading; everything else is in the article.
      const article = html.slice(html.indexOf('data-testid="legal-document-draft-preview"'));
      const [title, ...body] = documentTexts(draft);
      expect(html).toContain(`>${title}</h1>`);
      expectInOrder(article, body);
      expect(article).toContain('<strong class="font-semibold text-ink-900">');
      // The texts are public-only: no internal note, quote or closing rule.
      expect(article).not.toContain('legal-internal-note');
      expect(article).not.toContain('<blockquote');
      expect(article).not.toContain('<hr');
      expect((article.match(/<h2 /g) ?? []).length).toBe(draft.sections.length);
      // Each section is anchored and listed in the contents.
      draft.sections.forEach((section, i) => {
        expect(html).toContain(`<section id="section-${i + 1}"`);
        expect(html).toContain(`<a href="#section-${i + 1}" class="text-link underline-offset-2 hover:underline">${section.heading}</a>`);
      });
    }
    expect(render('cookies', PREVIEW)).toContain('<code class="font-mono text-[0.92em]">localStorage</code>');
    expect(render('terms', PREVIEW)).toContain(
      '<a href="/privacy" class="text-link underline underline-offset-2 hover:text-ink-900">Политиката за поверителност</a>',
    );
  });

  it('shows no internal note for the current texts, in either interface language', () => {
    vi.stubEnv('NODE_ENV', 'development');
    for (const [locale, label] of [
      ['bg', 'Вътрешна бележка — не се публикува'],
      ['en', 'Internal note — not published'],
    ] as const) {
      vi.mocked(getLocale).mockReturnValue(locale);
      for (const id of LEGAL_DOCUMENT_IDS) {
        const html = render(id, PREVIEW);
        expect(html, `${locale} ${id}`).toContain('data-testid="legal-document-draft-preview"');
        expect(html, `${locale} ${id}`).not.toContain(label);
        expect(html, `${locale} ${id}`).not.toMatch(/не за публикуване|not for publication|\[●\]|проект 1\.0/);
      }
    }
  });

  it('still labels internal parts in the preview if a draft contains any (fixture)', () => {
    vi.stubEnv('NODE_ENV', 'development');
    LEGAL_DOCUMENTS.terms.content.bg = {
      title: 'FIXTURE TITLE',
      info: 'Fixture status line',
      intro: [{ type: 'blockquote', internal: true, text: 'Fixture team note' }],
      sections: [{ heading: '1. Fixture heading', blocks: [{ type: 'paragraph', text: 'Public fixture clause.' }] }],
      closing: [{ type: 'paragraph', internal: true, text: 'Fixture closing checklist' }],
    };
    const html = render('terms', PREVIEW);
    expect(html.match(/<p[^>]*>Вътрешна бележка — не се публикува<\/p>/g)).toHaveLength(3);
    expect(html).toMatch(/legal-internal-note[^>]*><p[^>]*>Вътрешна бележка — не се публикува<\/p><blockquote[^>]*>Fixture team note/);
    expect(html).toMatch(/<hr[^>]*\/><div[^>]*><div data-testid="legal-internal-note"/);
  });

  it('says the Bulgarian preview is the primary version', () => {
    vi.stubEnv('NODE_ENV', 'development');
    for (const id of LEGAL_DOCUMENT_IDS) {
      expect(render(id, PREVIEW)).toMatch(
        /data-testid="legal-draft-preview-language">Показан на български: основната версия на документа\./,
      );
    }
  });

  it('in the English interface, renders the complete English translation of each draft, marked lang="en"', () => {
    vi.stubEnv('NODE_ENV', 'development');
    vi.mocked(getLocale).mockReturnValue('en');
    for (const id of LEGAL_DOCUMENT_IDS) {
      const translation = LEGAL_DOCUMENTS[id].content.en!;
      const html = render(id, PREVIEW);
      expect(html).toContain('Unpublished draft (local preview)');
      expect(html).toMatch(/data-testid="legal-draft-preview-language">Shown in English: the English version of the primary Bulgarian text/);
      expect(html).toMatch(/<article data-testid="legal-document-draft-preview" lang="en"/);
      expect(html).toMatch(/<ul lang="en"/);
      const article = html.slice(html.indexOf('data-testid="legal-document-draft-preview"'));
      const [title, ...body] = documentTexts(translation);
      expect(html).toContain(`>${title}</h1>`);
      expectInOrder(article, body);
      // No Bulgarian document text in the English preview (only approved
      // names and the address stay in Bulgarian).
      expect(html).not.toContain(LEGAL_DOCUMENTS[id].content.bg!.title!);
      for (const section of LEGAL_DOCUMENTS[id].content.bg!.sections) expect(html).not.toContain(section.heading);
    }
  });

  it('falls back to the Bulgarian source, says so, and marks it lang="bg" when a translation is missing', () => {
    vi.stubEnv('NODE_ENV', 'development');
    vi.mocked(getLocale).mockReturnValue('en');
    LEGAL_DOCUMENTS.cookies.content.en = null;
    const html = render('cookies', PREVIEW);
    expect(html).toMatch(
      /data-testid="legal-draft-preview-language">No English translation of this draft is available, so it is shown in Bulgarian, the source language\./,
    );
    expect(html).toMatch(/<article data-testid="legal-document-draft-preview" lang="bg"/);
    expect(html).toMatch(/<ul lang="bg"/);
    expectInOrder(html, documentTexts(LEGAL_DOCUMENTS.cookies.content.bg!));
  });

  it('in development without the request, keeps the "not yet published" page and only offers a link to the preview', () => {
    vi.stubEnv('NODE_ENV', 'development');
    for (const id of LEGAL_DOCUMENT_IDS) {
      const html = render(id, { preview: 'yes' });
      expect(html).toContain('data-testid="legal-document-unpublished"');
      expect(html).toContain('data-testid="legal-draft-preview-link"');
      expect(html).toContain('href="?preview=draft"');
      expect(html).not.toContain('legal-document-draft-preview');
      expect(html).not.toContain(LEGAL_DOCUMENTS[id].content.bg!.title!);
    }
  });

  for (const env of ['production', 'test']) {
    it(`with NODE_ENV=${env}, never renders draft content in either language, even when the preview is requested`, () => {
      vi.stubEnv('NODE_ENV', env);
      for (const locale of ['bg', 'en'] as const) {
        vi.mocked(getLocale).mockReturnValue(locale);
        for (const id of LEGAL_DOCUMENT_IDS) {
          const html = render(id, PREVIEW);
          expect(html).toContain('data-testid="legal-document-unpublished"');
          expect(html).not.toContain('legal-document-draft-preview');
          expect(html).not.toContain('legal-draft-preview-link');
          expect(html).not.toContain('preview=draft');
          expect(html).not.toMatch(/проект 1\.0|draft 1\.0|\[●\]|не за публикуване|not for publication|ТОЧНО ЮРИДИЧЕСКО/);
          for (const content of [LEGAL_DOCUMENTS[id].content.bg!, LEGAL_DOCUMENTS[id].content.en!]) {
            expect(html).not.toContain(content.title!);
            for (const section of content.sections) expect(html).not.toContain(section.heading);
          }
        }
      }
    });
  }
});

describe('LegalDocumentPage placeholders (draft preview)', () => {
  it('has no missing fact left to mark in the current texts, and never shows a raw {token}', () => {
    vi.stubEnv('NODE_ENV', 'development');
    for (const locale of ['bg', 'en'] as const) {
      vi.mocked(getLocale).mockReturnValue(locale);
      for (const id of LEGAL_DOCUMENT_IDS) {
        const html = render(id, PREVIEW);
        expect(html, `${locale} ${id}`).not.toContain('legal-placeholder');
        expect(html, `${locale} ${id}`).not.toMatch(/\{\w+\}/);
      }
    }
  });

  it('keeps §9 in both languages, with the 12-month period for check-ins and notes', () => {
    vi.stubEnv('NODE_ENV', 'development');
    expect(render('privacy', PREVIEW)).toMatch(/<h2[^>]*>9\. Срокове на съхранение<\/h2><ul[^>]*>.*<li>Проверки и бележки: 12 месеца\.<\/li>.*<\/ul>/);
    vi.mocked(getLocale).mockReturnValue('en');
    expect(render('privacy', PREVIEW)).toMatch(/<h2[^>]*>9\. Retention<\/h2><ul[^>]*>.*<li>Check-ins and notes: 12 months\.<\/li>.*<\/ul>/);
  });
});

// What publication will serve: the real texts, activated in a test-only way
// (status, version and date set here). None of this ships.
describe('publication: all six document versions at their routes', () => {
  const ROUTES = { terms: TermsPage, privacy: PrivacyPage, cookies: CookiesPage } as const;

  function activateReal() {
    vi.stubEnv('LEGAL_DOCUMENTS_PUBLISHED', 'true');
    for (const id of LEGAL_DOCUMENT_IDS) {
      Object.assign(LEGAL_DOCUMENTS[id], { status: 'published', version: '1.0', effectiveDate: '2026-11-01' });
    }
  }

  const renderRoute = (id: LegalDocumentId) => renderToStaticMarkup(createElement(ROUTES[id], {}));

  it('serves each document in Bulgarian and in English at the same route, following the interface language', () => {
    activateReal();
    for (const id of LEGAL_DOCUMENT_IDS) {
      const { bg, en } = LEGAL_DOCUMENTS[id].content;
      for (const [locale, content, other, versionLine] of [
        ['bg', bg!, en!, 'Версия 1.0 · В сила от 1 ноември 2026'],
        ['en', en!, bg!, 'Version 1.0 · Effective from November 1, 2026'],
      ] as const) {
        vi.mocked(getLocale).mockReturnValue(locale);
        const html = renderRoute(id);
        expect(html, `${id} ${locale}`).toContain('data-testid="legal-document-content"');
        expect(html, `${id} ${locale}`).not.toContain('legal-document-unpublished');
        expect(html, `${id} ${locale}`).toMatch(new RegExp(`<h1[^>]*>${content.title}</h1>`));
        expect(html, `${id} ${locale}`).toContain(versionLine);
        expectInOrder(html, documentTexts(content));
        expect(html, `${id} ${locale}`).not.toContain(other.title!);
        for (const section of other.sections) expect(html, `${id} ${locale}`).not.toContain(`>${section.heading}</h2>`);
        // Published pages never carry placeholders or a raw token.
        expect(html, `${id} ${locale}`).not.toContain('legal-placeholder');
        expect(html, `${id} ${locale}`).not.toMatch(/\{\w+\}/);
      }
    }
  });

  it('a published Privacy Policy keeps §9 in both languages', () => {
    activateReal();
    vi.mocked(getLocale).mockReturnValue('bg');
    expect(renderRoute('privacy')).toContain('<li>Проверки и бележки: 12 месеца.</li>');
    vi.mocked(getLocale).mockReturnValue('en');
    expect(renderRoute('privacy')).toContain('<li>Check-ins and notes: 12 months.</li>');
  });

  it('with the real texts still in draft, every route stays "not yet published" in both languages, even with the switch on', () => {
    vi.stubEnv('LEGAL_DOCUMENTS_PUBLISHED', 'true');
    for (const [locale, notice] of [
      ['bg', 'Все още не е публикуван'],
      ['en', 'Not yet published'],
    ] as const) {
      vi.mocked(getLocale).mockReturnValue(locale);
      for (const id of LEGAL_DOCUMENT_IDS) {
        const html = renderRoute(id);
        expect(html, `${id} ${locale}`).toContain('data-testid="legal-document-unpublished"');
        expect(html, `${id} ${locale}`).toContain(notice);
        expect(html, `${id} ${locale}`).not.toContain(LEGAL_DOCUMENTS[id].content[locale]!.title!);
      }
    }
  });
});
