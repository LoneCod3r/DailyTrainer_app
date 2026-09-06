import Link from 'next/link';
import { Card, CardContent, Badge, Button } from '@/components/ui';
import { getCategoryLabel } from './categoryLabel';
import { formatDate } from '@/lib/format-date';
import type { Locale } from '@/lib/i18n/locale';
import type { ArticleWithRelations } from './types';
import type { DictKey } from '@/lib/i18n/dictionaries';

// Large, visually prominent — the entry point into the Blog area, styled to
// feel editorial rather than another dashboard card.
export function FeaturedArticle({
  article,
  locale,
  t,
}: {
  article: ArticleWithRelations;
  locale: Locale;
  t: (key: DictKey, vars?: Record<string, string | number>) => string;
}) {
  const categoryLabel = getCategoryLabel(article.category, t);

  return (
    <Card className="overflow-hidden">
      {article.coverMedia?.url && (
        // eslint-disable-next-line @next/next/no-img-element
        <img src={article.coverMedia.url} alt={article.title} className="h-56 w-full object-cover sm:h-72" />
      )}
      <CardContent className="flex flex-col gap-3 p-6 sm:p-8">
        <div className="flex flex-wrap items-center gap-2">
          <Badge tone="brand">{t('blog.featuredLabel')}</Badge>
          {categoryLabel && <Badge tone="neutral">{categoryLabel}</Badge>}
        </div>
        <h2 className="text-2xl font-semibold text-ink-900 sm:text-3xl">{article.title}</h2>
        {article.excerpt && <p className="max-w-2xl text-[15px] leading-relaxed text-ink-500">{article.excerpt}</p>}
        {article.publishedAt && <p className="text-xs text-ink-300">{formatDate(article.publishedAt, locale)}</p>}
        <div className="pt-2">
          <Link href={`/blog/${article.slug}`}>
            <Button>{t('blog.readMore')}</Button>
          </Link>
        </div>
      </CardContent>
    </Card>
  );
}
