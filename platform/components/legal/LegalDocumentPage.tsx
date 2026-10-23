import { Fragment, type ReactNode } from 'react';
import type { Metadata } from 'next';
import { Alert, Container, Card, CardContent } from '@/components/ui';
import { PageHeader } from '@/components/layout/PageHeader';
import { clsx } from '@/lib/clsx';
import { getLocale } from '@/lib/i18n/get-locale';
import { getT, type DictKey } from '@/lib/i18n/dictionaries';
import { formatDate } from '@/lib/format-date';
import { getActiveLegalDocument, getLegalDraftPreview, LEGAL_SOURCE_LOCALE } from '@/modules/legal/legal.service';
import type { LegalContentBlock, LegalDocumentContent, LegalDocumentId, LegalText } from '@/modules/legal/types';

const TITLE_KEYS: Record<LegalDocumentId, DictKey> = {
  terms: 'legal.terms',
  privacy: 'legal.privacy',
  cookies: 'legal.cookies',
};

// Until a document is active, its page is kept out of search results, so an
// empty placeholder page is never indexed as the site's legal terms.
export function legalDocumentMetadata(id: LegalDocumentId): Metadata {
  const locale = getLocale();
  const t = getT(locale);
  const active = getActiveLegalDocument(id, locale) !== null;
  return {
    title: t(TITLE_KEYS[id]),
    ...(!active && { robots: { index: false, follow: true } }),
  };
}

function Text({ text }: { text: LegalText }) {
  if (typeof text === 'string') return <>{text}</>;
  return (
    <>
      {text.map((run, i) => {
        if (typeof run === 'string') return <Fragment key={i}>{run}</Fragment>;
        if ('lineBreak' in run) return <br key={i} />;
        let node: ReactNode = run.text;
        if (run.code) node = <code className="font-mono text-[0.92em]">{node}</code>;
        if (run.strong) node = <strong className="font-semibold text-ink-900">{node}</strong>;
        if (run.href) {
          node = (
            <a href={run.href} className="text-link underline underline-offset-2 hover:text-ink-900">
              {node}
            </a>
          );
        }
        return <Fragment key={i}>{node}</Fragment>;
      })}
    </>
  );
}

function Block({ block }: { block: LegalContentBlock }) {
  if (block.type === 'list') {
    return (
      <ul className="ml-5 list-disc space-y-1">
        {block.items.map((item, i) => (
          <li key={i}>
            <Text text={item} />
          </li>
        ))}
      </ul>
    );
  }
  if (block.type === 'blockquote') {
    return (
      <blockquote className="border-l-2 border-sand-200 pl-4">
        <Text text={block.text} />
      </blockquote>
    );
  }
  return (
    <p>
      <Text text={block.text} />
    </p>
  );
}

// Anchor of a section in the draft preview, for its contents list.
function sectionAnchor(index: number) {
  return `section-${index + 1}`;
}

// The document itself: info line, intro, sections, and what follows the
// closing rule. `anchored` gives each section an id to link to (draft
// preview only; the published markup has none).
function DocumentBody({ content, anchored = false }: { content: LegalDocumentContent; anchored?: boolean }) {
  return (
    <>
      {content.info && (
        <p className="text-ink-500">
          <Text text={content.info} />
        </p>
      )}
      {content.intro && (
        <div className="flex flex-col gap-3">
          {content.intro.map((block, i) => (
            <Block key={i} block={block} />
          ))}
        </div>
      )}
      {content.sections.map((section, i) => (
        <section
          key={i}
          id={anchored ? sectionAnchor(i) : undefined}
          className={clsx('flex flex-col gap-3', anchored && 'scroll-mt-24')}
        >
          <h2 className="text-base font-semibold text-ink-900">{section.heading}</h2>
          {section.blocks.map((block, j) => (
            <Block key={j} block={block} />
          ))}
        </section>
      ))}
      {content.closing && (
        <>
          <hr className="border-sand-200" />
          <div className="flex flex-col gap-3">
            {content.closing.map((block, i) => (
              <Block key={i} block={block} />
            ))}
          </div>
        </>
      )}
    </>
  );
}

// Query string that asks for the local draft preview of an unpublished
// document, e.g. /terms?preview=draft. It is only a request: the server
// grants it under `next dev` alone (getLegalDraftPreview).
export const DRAFT_PREVIEW_PARAM = 'preview';
export const DRAFT_PREVIEW_VALUE = 'draft';

type SearchParams = Record<string, string | string[] | undefined>;

// Shared renderer for /terms, /privacy and /cookies. It renders approved,
// active content from modules/legal/documents.ts. Otherwise it shows a
// neutral "not yet published" notice and no legal wording, except in local
// development, where `?preview=draft` shows the unpublished draft in the
// interface language (the Bulgarian source, or its unreviewed translation),
// clearly marked as a draft, for review before approval.
export function LegalDocumentPage({ id, searchParams }: { id: LegalDocumentId; searchParams?: SearchParams }) {
  const locale = getLocale();
  const t = getT(locale);
  const doc = getActiveLegalDocument(id, locale);
  // Server-side guard: null in every environment but `next dev`.
  const preview = doc ? null : getLegalDraftPreview(id, locale);
  const previewRequested = searchParams?.[DRAFT_PREVIEW_PARAM] === DRAFT_PREVIEW_VALUE;

  if (preview && previewRequested) {
    const draft = preview.content;
    const languageNote: DictKey = preview.isFallback
      ? 'legal.draftPreviewFallback'
      : preview.locale === LEGAL_SOURCE_LOCALE
        ? 'legal.draftPreviewSource'
        : 'legal.draftPreviewTranslation';
    return (
      <Container className="flex max-w-3xl flex-col gap-6 py-8">
        <PageHeader title={draft.title ?? t(TITLE_KEYS[id])} />
        <Alert tone="warning" role="note" title={t('legal.draftPreviewTitle')} data-testid="legal-draft-preview-notice">
          <p>{t('legal.draftPreviewDesc')}</p>
          <p className="mt-1 font-medium" data-testid="legal-draft-preview-language">
            {t(languageNote)}
          </p>
        </Alert>
        <nav aria-label={t('legal.draftPreviewContents')} className="rounded-xl border border-sand-200 px-4 py-3 text-sm">
          <p className="mb-2 font-semibold text-ink-900">{t('legal.draftPreviewContents')}</p>
          <ul lang={preview.locale} className="flex flex-col gap-1">
            {draft.sections.map((section, i) => (
              <li key={i}>
                <a href={`#${sectionAnchor(i)}`} className="text-link underline-offset-2 hover:underline">
                  {section.heading}
                </a>
              </li>
            ))}
          </ul>
        </nav>
        <article
          data-testid="legal-document-draft-preview"
          lang={preview.locale}
          className="flex flex-col gap-6 text-sm leading-relaxed text-ink-700"
        >
          <DocumentBody content={draft} anchored />
        </article>
      </Container>
    );
  }

  return (
    <Container className="flex max-w-3xl flex-col gap-6 py-8">
      <PageHeader
        title={doc?.content.title ?? t(TITLE_KEYS[id])}
        description={
          doc && !doc.content.info
            ? `${t('legal.version', { version: doc.version })} · ${t('legal.effectiveFrom', {
                date: formatDate(doc.effectiveDate, locale, { dateStyle: 'long' }),
              })}`
            : undefined
        }
      />

      {doc ? (
        <article data-testid="legal-document-content" className="flex flex-col gap-6 text-sm leading-relaxed text-ink-700">
          <DocumentBody content={doc.content} />
        </article>
      ) : (
        <Card data-testid="legal-document-unpublished">
          <CardContent className="flex flex-col gap-1">
            <h2 className="text-base font-semibold text-ink-900">{t('legal.notPublishedTitle')}</h2>
            <p className="text-sm text-ink-500">{t('legal.notPublishedDesc')}</p>
            {preview && (
              <p className="mt-2 text-sm">
                <a
                  href={`?${DRAFT_PREVIEW_PARAM}=${DRAFT_PREVIEW_VALUE}`}
                  data-testid="legal-draft-preview-link"
                  className="text-link underline underline-offset-2 hover:text-ink-900"
                >
                  {t('legal.draftPreviewLink')}
                </a>
              </p>
            )}
          </CardContent>
        </Card>
      )}
    </Container>
  );
}
