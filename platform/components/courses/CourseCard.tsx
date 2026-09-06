import Link from 'next/link';
import { Card, Badge } from '@/components/ui';
import { CourseProgress } from './CourseProgress';
import { countLessons } from '@/modules/courses/service';
import { localize } from '@/modules/kuko-way/types';
import type { Locale } from '@/lib/i18n/locale';
import type { Course } from '@/modules/courses/types';
import type { DictKey } from '@/lib/i18n/dictionaries';

export function CourseCard({
  course,
  locale,
  t,
  progress,
}: {
  course: Course;
  locale: Locale;
  t: (key: DictKey, vars?: Record<string, string | number>) => string;
  progress?: { completedCount: number; totalCount: number };
}) {
  const title = localize(course.title, locale);
  const description = localize(course.description, locale);
  const lessonCount = countLessons(course);
  const started = Boolean(progress && progress.completedCount > 0);
  const isComplete = Boolean(progress && progress.totalCount > 0 && progress.completedCount === progress.totalCount);

  return (
    <Link href={`/community/courses/${course.slug}`}>
      <Card className="flex h-full flex-col gap-3 p-5 transition-shadow hover:shadow-soft">
        <div className="flex items-center justify-between gap-2">
          <Badge tone="brand" className="w-fit">
            {t('courses.moduleCount', { count: course.modules.length })}
          </Badge>
          {isComplete && <Badge tone="success">{t('courses.moduleCompleted')}</Badge>}
        </div>
        <h3 className="text-lg font-semibold text-ink-900">{title.value}</h3>
        <p className="text-sm text-ink-500">{description.value}</p>
        <p className="text-xs text-ink-300">{t('courses.lessonCount', { count: lessonCount })}</p>

        <div className="mt-auto flex flex-col gap-2 pt-2">
          {progress && progress.totalCount > 0 && (
            <CourseProgress
              completed={progress.completedCount}
              total={progress.totalCount}
              label={t('courses.progressLabel', { completed: progress.completedCount, total: progress.totalCount })}
            />
          )}
          <span className="text-sm font-medium text-link">
            {started ? t('courses.continueCourse') : t('courses.startCourse')} →
          </span>
        </div>
      </Card>
    </Link>
  );
}
