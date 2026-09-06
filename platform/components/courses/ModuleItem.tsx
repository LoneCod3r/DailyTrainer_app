import Link from 'next/link';
import { Card, Badge } from '@/components/ui';
import { localize } from '@/modules/kuko-way/types';
import type { Locale } from '@/lib/i18n/locale';
import type { CourseModule } from '@/modules/courses/types';
import type { DictKey } from '@/lib/i18n/dictionaries';

export type ModuleState = 'not-started' | 'in-progress' | 'completed';

const STATE_KEY: Record<ModuleState, DictKey> = {
  'not-started': 'courses.moduleNotStarted',
  'in-progress': 'courses.moduleInProgress',
  completed: 'courses.moduleCompleted',
};

export function ModuleItem({
  courseSlug,
  courseModule,
  moduleNumber,
  locale,
  t,
  state,
  completedCount,
}: {
  courseSlug: string;
  courseModule: CourseModule;
  moduleNumber: number;
  locale: Locale;
  t: (key: DictKey, vars?: Record<string, string | number>) => string;
  state: ModuleState;
  completedCount: number;
}) {
  const title = localize(courseModule.title, locale);
  const description = courseModule.description ? localize(courseModule.description, locale) : undefined;

  return (
    <Link href={`/community/courses/${courseSlug}/${courseModule.slug}`}>
      <Card className="flex items-center gap-4 p-4 transition-shadow hover:shadow-soft">
        <div
          aria-hidden="true"
          className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-sand-100 text-sm font-semibold text-ink-700"
        >
          {moduleNumber}
        </div>
        <div className="flex min-w-0 flex-1 flex-col gap-0.5">
          <h3 className="truncate font-medium text-ink-900">{title.value}</h3>
          {description && <p className="line-clamp-1 text-sm text-ink-500">{description.value}</p>}
          <p className="text-xs text-ink-300">
            {t('courses.lessonCount', { count: courseModule.lessons.length })}
            {completedCount > 0 && ` · ${t('courses.progressLabel', { completed: completedCount, total: courseModule.lessons.length })}`}
          </p>
        </div>
        <Badge tone={state === 'completed' ? 'success' : state === 'in-progress' ? 'brand' : 'neutral'} className="shrink-0">
          {t(STATE_KEY[state])}
        </Badge>
      </Card>
    </Link>
  );
}
