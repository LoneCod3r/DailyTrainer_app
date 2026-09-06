import Link from 'next/link';
import { Card, Badge } from '@/components/ui';
import { localize } from '@/modules/kuko-way/types';
import type { Locale } from '@/lib/i18n/locale';
import type { Lesson } from '@/modules/courses/types';
import type { DictKey } from '@/lib/i18n/dictionaries';

export function LessonItem({
  courseSlug,
  moduleSlug,
  lesson,
  lessonNumber,
  locale,
  t,
  completed,
}: {
  courseSlug: string;
  moduleSlug: string;
  lesson: Lesson;
  lessonNumber: number;
  locale: Locale;
  t: (key: DictKey) => string;
  completed: boolean;
}) {
  const title = localize(lesson.title, locale);
  const summary = lesson.summary ? localize(lesson.summary, locale) : undefined;

  return (
    <Link href={`/community/courses/${courseSlug}/${moduleSlug}/${lesson.slug}`}>
      <Card className="flex items-center gap-4 p-4 transition-shadow hover:shadow-soft">
        <div
          aria-hidden="true"
          className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-sand-100 text-xs font-semibold text-ink-700"
        >
          {completed ? '✓' : lessonNumber}
        </div>
        <div className="flex min-w-0 flex-1 flex-col gap-0.5">
          <h3 className="truncate font-medium text-ink-900">{title.value}</h3>
          {summary && <p className="line-clamp-1 text-sm text-ink-500">{summary.value}</p>}
        </div>
        {completed && <Badge tone="success">{t('courses.lessonCompleted')}</Badge>}
      </Card>
    </Link>
  );
}
