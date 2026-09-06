import { ArticleCard } from './ArticleCard';
import type { Locale } from '@/lib/i18n/locale';
import type { ArticleWithRelations } from './types';
import type { DictKey } from '@/lib/i18n/dictionaries';

export function RelatedContent({
  articles,
  locale,
  t,
}: {
  articles: ArticleWithRelations[];
  locale: Locale;
  t: (key: DictKey, vars?: Record<string, string | number>) => string;
}) {
  if (articles.length === 0) return null;

  return (
    <section className="flex flex-col gap-4 border-t border-sand-200 pt-6">
      <h2 className="text-sm font-semibold uppercase tracking-wide text-ink-500">{t('blog.relatedTitle')}</h2>
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
        {articles.map((article) => (
          <ArticleCard key={article.id} article={article} locale={locale} t={t} />
        ))}
      </div>
    </section>
  );
}
