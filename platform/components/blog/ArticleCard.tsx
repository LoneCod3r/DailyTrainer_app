import Link from 'next/link';
import { Card, CardContent, Badge } from '@/components/ui';
import { getCategoryLabel } from './categoryLabel';
import { formatDate } from '@/lib/format-date';
import type { Locale } from '@/lib/i18n/locale';
import type { ArticleWithRelations } from './types';
import type { DictKey } from '@/lib/i18n/dictionaries';

export function ArticleCard({
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
    <Link href={`/blog/${article.slug}`}>
      <Card className="flex h-full flex-col gap-2.5 p-5 transition-shadow hover:shadow-soft">
        <div className="flex flex-wrap items-center gap-2">
          {categoryLabel && (
            <Badge tone="brand" className="w-fit">
              {categoryLabel}
            </Badge>
          )}
          {article.featured && <Badge tone="success">{t('home.featured')}</Badge>}
        </div>
        <h3 className="text-base font-semibold text-ink-900">{article.title}</h3>
        {article.excerpt && <p className="line-clamp-2 text-sm text-ink-500">{article.excerpt}</p>}
        {article.publishedAt && (
          <p className="mt-auto pt-1 text-xs text-ink-300">{formatDate(article.publishedAt, locale)}</p>
        )}
      </Card>
    </Link>
  );
}
