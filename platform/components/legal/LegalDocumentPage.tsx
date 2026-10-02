import type { Metadata } from 'next';
import { Container, Card, CardContent } from '@/components/ui';
import { PageHeader } from '@/components/layout/PageHeader';
import { getLocale } from '@/lib/i18n/get-locale';
import { getT, type DictKey } from '@/lib/i18n/dictionaries';
import { formatDate } from '@/lib/format-date';
import { getActiveLegalDocument } from '@/modules/legal/legal.service';
import type { LegalContentBlock, LegalDocumentId } from '@/modules/legal/types';

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

function Block({ block }: { block: LegalContentBlock }) {
  if (block.type === 'list') {
    return (
      <ul className="ml-5 list-disc space-y-1">
        {block.items.map((item, i) => (
          <li key={i}>{item}</li>
        ))}
      </ul>
    );
  }
  return <p>{block.text}</p>;
}

// Shared renderer for /terms, /privacy and /cookies. It renders ONLY
// approved, active content from modules/legal/documents.ts. Otherwise it
// shows a neutral "not yet published" notice and no legal wording.
export function LegalDocumentPage({ id }: { id: LegalDocumentId }) {
  const locale = getLocale();
  const t = getT(locale);
  const doc = getActiveLegalDocument(id, locale);

  return (
    <Container className="flex max-w-3xl flex-col gap-6 py-8">
      <PageHeader
        title={t(TITLE_KEYS[id])}
        description={
          doc
            ? `${t('legal.version', { version: doc.version })} · ${t('legal.effectiveFrom', {
                date: formatDate(doc.effectiveDate, locale, { dateStyle: 'long' }),
              })}`
            : undefined
        }
      />

      {doc ? (
        <article data-testid="legal-document-content" className="flex flex-col gap-6 text-sm leading-relaxed text-ink-700">
          {doc.content.intro && (
            <div className="flex flex-col gap-3">
              {doc.content.intro.map((block, i) => (
                <Block key={i} block={block} />
              ))}
            </div>
          )}
          {doc.content.sections.map((section, i) => (
            <section key={i} className="flex flex-col gap-3">
              <h2 className="text-base font-semibold text-ink-900">{section.heading}</h2>
              {section.blocks.map((block, j) => (
                <Block key={j} block={block} />
              ))}
            </section>
          ))}
        </article>
      ) : (
        <Card data-testid="legal-document-unpublished">
          <CardContent className="flex flex-col gap-1">
            <h2 className="text-base font-semibold text-ink-900">{t('legal.notPublishedTitle')}</h2>
            <p className="text-sm text-ink-500">{t('legal.notPublishedDesc')}</p>
          </CardContent>
        </Card>
      )}
    </Container>
  );
}
