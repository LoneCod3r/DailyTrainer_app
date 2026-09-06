import { ModuleItem, type ModuleState } from './ModuleItem';
import { computeModuleProgress } from '@/modules/courses/progress.service';
import type { Locale } from '@/lib/i18n/locale';
import type { Course } from '@/modules/courses/types';
import type { DictKey } from '@/lib/i18n/dictionaries';

export function ModuleList({
  course,
  locale,
  t,
  completed,
}: {
  course: Course;
  locale: Locale;
  t: (key: DictKey, vars?: Record<string, string | number>) => string;
  completed: Set<string>;
}) {
  const sortedModules = [...course.modules].sort((a, b) => a.order - b.order);

  return (
    <div className="flex flex-col gap-3">
      {sortedModules.map((courseModule, i) => {
        const { completedCount, totalCount } = computeModuleProgress(
          course.slug,
          courseModule.slug,
          courseModule.lessons.map((l) => l.slug),
          completed,
        );
        const state: ModuleState = completedCount === 0 ? 'not-started' : completedCount === totalCount ? 'completed' : 'in-progress';

        return (
          <ModuleItem
            key={courseModule.slug}
            courseSlug={course.slug}
            courseModule={courseModule}
            moduleNumber={i + 1}
            locale={locale}
            t={t}
            state={state}
            completedCount={completedCount}
          />
        );
      })}
    </div>
  );
}
