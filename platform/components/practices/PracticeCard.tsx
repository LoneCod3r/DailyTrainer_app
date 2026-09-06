import Link from 'next/link';
import { clsx } from '@/lib/clsx';
import { Card, Badge } from '@/components/ui';
import { localize, type Practice } from '@/modules/kuko-way/types';
import type { Locale } from '@/lib/i18n/locale';
import type { DictKey } from '@/lib/i18n/dictionaries';

export type PracticeCardState = 'available' | 'completed' | 'coming-soon';

// The single reusable practice tile used by Feel Better Now, Library, Home
// and "related practices" — a server component so it drops straight into
// any of those (mostly server-rendered) pages.
export function PracticeCard({
  practice,
  locale,
  t,
  state = 'available',
}: {
  practice: Practice;
  locale: Locale;
  t: (key: DictKey, vars?: Record<string, string | number>) => string;
  state?: PracticeCardState;
}) {
  const title = localize(practice.title, locale);
  const summary = practice.intro?.[0] ? localize(practice.intro[0], locale) : undefined;
  const stepCount = practice.instructions?.reduce((n, group) => n + group.steps.length, 0);

  return (
    <Link href={`/practices/${practice.slug}`}>
      <Card className="flex h-full flex-col gap-2.5 p-5 transition-shadow hover:shadow-soft">
        <div className="flex items-center justify-between gap-2">
          <Badge tone="brand" className="w-fit capitalize">
            {t('library.categoryPractices')}
          </Badge>
          {state === 'completed' && <Badge tone="success">{t('practiceDetail.completed')}</Badge>}
          {state === 'coming-soon' && <Badge tone="neutral">{t('common.comingSoon')}</Badge>}
        </div>

        <h3 className="text-base font-semibold text-ink-900">{title.value}</h3>
        {title.isFallback && <p className="text-xs italic text-ink-300">{t('language.contentInBulgarian')}</p>}

        {summary && <p className="line-clamp-2 text-sm text-ink-500">{summary.value}</p>}

        <div className="mt-auto flex items-center gap-3 pt-1 text-xs text-ink-300">
          {stepCount ? <span>{stepCount} {t('common.steps')}</span> : null}
          {practice.childIds && <span>{practice.childIds.length} {t('practiceDetail.includedResets').toLowerCase()}</span>}
        </div>
      </Card>
    </Link>
  );
}

export function PracticeCardSkeleton({ className }: { className?: string }) {
  return <div className={clsx('h-40 animate-pulse rounded-2xl bg-sand-100', className)} />;
}
