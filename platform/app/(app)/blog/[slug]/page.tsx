import type { Metadata } from 'next';
import Link from 'next/link';
import { notFound } from 'next/navigation';
import { Container, Badge } from '@/components/ui';
import { RelatedContent } from '@/components/blog/RelatedContent';
import { getCategoryLabel } from '@/components/blog/categoryLabel';
import { getContentBySlug, getRelatedContent } from '@/modules/content/content.service';
import { formatDate } from '@/lib/format-date';
import { getLocale } from '@/lib/i18n/get-locale';
import { getT } from '@/lib/i18n/dictionaries';

export async function generateMetadata({ params }: { params: { slug: string } }): Promise<Metadata> {
  const article = await getContentBySlug(params.slug);
  if (!article) return {};

  return {
    title: article.title,
    description: article.excerpt ?? undefined,
    openGraph: {
      title: article.title,
      description: article.excerpt ?? undefined,
      images: article.coverMedia?.url ? [{ url: article.coverMedia.url }] : undefined,
    },
  };
}

export default async function ArticleDetailPage({ params }: { params: { slug: string } }) {
  const locale = getLocale();
  const t = getT(locale);
  const article = await getContentBySlug(params.slug);
  if (!article) notFound();

  const related = await getRelatedContent(article, 3);
  const categoryLabel = getCategoryLabel(article.category, t);

  return (
    <Container className="flex max-w-2xl flex-col gap-6 py-8">
      <Link href="/blog" className="text-sm font-medium text-link hover:underline">
        {t('blog.backToBlog')}
      </Link>

      <article className="flex flex-col gap-4">
        <div className="flex flex-wrap items-center gap-2">
          {categoryLabel && <Badge tone="brand">{categoryLabel}</Badge>}
          {article.publishedAt && (
            <span className="text-xs text-ink-300">{t('blog.publishedOn', { date: formatDate(article.publishedAt, locale) })}</span>
          )}
        </div>

        <h1 className="text-3xl font-semibold leading-tight text-ink-900">{article.title}</h1>

        {article.coverMedia?.url && (
          // eslint-disable-next-line @next/next/no-img-element
          <img src={article.coverMedia.url} alt={article.title} className="w-full rounded-2xl object-cover" />
        )}

        {article.excerpt && <p className="text-lg leading-relaxed text-ink-500">{article.excerpt}</p>}

        {article.body && (
          <div className="flex flex-col gap-4 text-[17px] leading-relaxed text-ink-700">
            {article.body.split('\n').filter(Boolean).map((paragraph, i) => (
              <p key={i}>{paragraph}</p>
            ))}
          </div>
        )}
      </article>

      <RelatedContent articles={related} locale={locale} t={t} />
    </Container>
  );
}
