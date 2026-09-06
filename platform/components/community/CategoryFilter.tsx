import Link from 'next/link';
import { clsx } from '@/lib/clsx';
import { DISCUSSION_CATEGORIES } from '@/modules/discussions/discussions.service';
import type { DiscussionCategory } from '@prisma/client';
import type { DictKey } from '@/lib/i18n/dictionaries';

const CATEGORY_KEY: Record<DiscussionCategory, DictKey> = {
  GENERAL: 'discussions.categoryGeneral',
  PRACTICES: 'discussions.categoryPractices',
  PROGRAMS: 'discussions.categoryPrograms',
  KUKO_WAY: 'discussions.categoryKukoWay',
  COMMUNITY: 'discussions.categoryCommunity',
  QUESTIONS: 'discussions.categoryQuestions',
};

// Server-rendered category tabs (plain links with a query param) — no
// client state needed since the page itself re-renders per category.
export function CategoryFilter({
  active,
  t,
}: {
  active?: DiscussionCategory;
  t: (key: DictKey) => string;
}) {
  return (
    <div className="flex flex-wrap gap-1.5" role="tablist" aria-label={t('discussions.fieldCategory')}>
      <Link
        href="/community/discussions"
        role="tab"
        aria-selected={!active}
        className={clsx(
          'rounded-full px-3 py-1.5 text-sm font-medium transition-colors',
          !active ? 'bg-brand-600 text-white' : 'bg-sand-100 text-ink-700 hover:bg-sand-200',
        )}
      >
        {t('discussions.categoryAll')}
      </Link>
      {DISCUSSION_CATEGORIES.map((category) => (
        <Link
          key={category}
          href={`/community/discussions?category=${category}`}
          role="tab"
          aria-selected={active === category}
          className={clsx(
            'rounded-full px-3 py-1.5 text-sm font-medium transition-colors',
            active === category ? 'bg-brand-600 text-white' : 'bg-sand-100 text-ink-700 hover:bg-sand-200',
          )}
        >
          {t(CATEGORY_KEY[category])}
        </Link>
      ))}
    </div>
  );
}
