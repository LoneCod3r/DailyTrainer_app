import Link from 'next/link';
import { clsx } from '@/lib/clsx';
import { getCategoryLabel } from './categoryLabel';
import type { DictKey } from '@/lib/i18n/dictionaries';

export function BlogCategoryFilter({
  categories,
  active,
  t,
}: {
  categories: string[];
  active?: string;
  t: (key: DictKey) => string;
}) {
  if (categories.length === 0) return null;

  return (
    <div className="flex flex-wrap gap-1.5" role="tablist" aria-label={t('blog.categoryAll')}>
      <Link
        href="/blog"
        role="tab"
        aria-selected={!active}
        className={clsx(
          'rounded-full px-3 py-1.5 text-sm font-medium transition-colors',
          !active ? 'bg-brand-600 text-white' : 'bg-sand-100 text-ink-700 hover:bg-sand-200',
        )}
      >
        {t('blog.categoryAll')}
      </Link>
      {categories.map((category) => (
        <Link
          key={category}
          href={`/blog?category=${encodeURIComponent(category)}`}
          role="tab"
          aria-selected={active === category}
          className={clsx(
            'rounded-full px-3 py-1.5 text-sm font-medium transition-colors',
            active === category ? 'bg-brand-600 text-white' : 'bg-sand-100 text-ink-700 hover:bg-sand-200',
          )}
        >
          {getCategoryLabel(category, t)}
        </Link>
      ))}
    </div>
  );
}
