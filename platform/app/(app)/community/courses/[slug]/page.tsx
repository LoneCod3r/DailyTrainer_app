import Link from 'next/link';
import { notFound } from 'next/navigation';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { Container, Alert } from '@/components/ui';
import { ModuleList } from '@/components/courses/ModuleList';
import { CourseProgress } from '@/components/courses/CourseProgress';
import { getCourseBySlug, getCourses, countLessons } from '@/modules/courses/service';
import { getCompletedLessonKeys, computeCourseProgress } from '@/modules/courses/progress.service';
import { getLocale } from '@/lib/i18n/get-locale';
import { getT } from '@/lib/i18n/dictionaries';
import { localize } from '@/modules/kuko-way/types';

export function generateStaticParams() {
  return getCourses().map((c) => ({ slug: c.slug }));
}

export default async function CourseDetailPage({ params }: { params: { slug: string } }) {
  const locale = getLocale();
  const t = getT(locale);
  const course = getCourseBySlug(params.slug);
  if (!course) notFound();

  const session = await getServerSession(authOptions);
  const completed = session?.user ? await getCompletedLessonKeys(session.user.id, course.slug) : new Set<string>();
  const { completedCount, totalCount } = computeCourseProgress(course, completed);

  const title = localize(course.title, locale);
  const description = localize(course.description, locale);

  return (
    <Container className="flex max-w-3xl flex-col gap-6 py-8">
      <Link href="/community/courses" className="text-sm font-medium text-link hover:underline">
        {t('courses.backToCourses')}
      </Link>

      <div className="flex flex-col gap-2">
        <p className="text-xs font-semibold uppercase tracking-wide text-link">
          {t('courses.moduleCount', { count: course.modules.length })} · {t('courses.lessonCount', { count: countLessons(course) })}
        </p>
        <h1 className="text-2xl font-semibold text-ink-900">{title.value}</h1>
        <p className="text-sm text-ink-500">{description.value}</p>
      </div>

      {totalCount > 0 && (
        <div className="flex flex-col gap-1.5">
          <CourseProgress
            completed={completedCount}
            total={totalCount}
            label={t('courses.progressLabel', { completed: completedCount, total: totalCount })}
          />
          <p className="text-xs text-ink-500">{t('courses.progressLabel', { completed: completedCount, total: totalCount })}</p>
        </div>
      )}

      {!session?.user && (
        <Alert tone="info">
          <Link href={`/login?callbackUrl=/community/courses/${course.slug}`} className="font-medium underline">
            {t('discussions.loginCta')}
          </Link>
        </Alert>
      )}

      <section className="flex flex-col gap-3">
        <h2 className="text-sm font-semibold uppercase tracking-wide text-ink-500">{t('courses.modulesHeading')}</h2>
        <ModuleList course={course} locale={locale} t={t} completed={completed} />
      </section>
    </Container>
  );
}
