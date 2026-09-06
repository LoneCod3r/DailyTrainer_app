import Link from 'next/link';
import { notFound } from 'next/navigation';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { Container } from '@/components/ui';
import { LessonItem } from '@/components/courses/LessonItem';
import { getCourseBySlug, getModuleBySlug } from '@/modules/courses/service';
import { getCompletedLessonKeys, isLessonComplete } from '@/modules/courses/progress.service';
import { getLocale } from '@/lib/i18n/get-locale';
import { getT } from '@/lib/i18n/dictionaries';
import { localize } from '@/modules/kuko-way/types';

export default async function ModuleDetailPage({ params }: { params: { slug: string; moduleSlug: string } }) {
  const locale = getLocale();
  const t = getT(locale);
  const course = getCourseBySlug(params.slug);
  if (!course) notFound();
  const courseModule = getModuleBySlug(course, params.moduleSlug);
  if (!courseModule) notFound();

  const session = await getServerSession(authOptions);
  const completed = session?.user ? await getCompletedLessonKeys(session.user.id, course.slug) : new Set<string>();

  const courseTitle = localize(course.title, locale);
  const moduleTitle = localize(courseModule.title, locale);
  const moduleDescription = courseModule.description ? localize(courseModule.description, locale) : undefined;
  const sortedLessons = [...courseModule.lessons].sort((a, b) => a.order - b.order);

  return (
    <Container className="flex max-w-3xl flex-col gap-6 py-8">
      <Link href={`/community/courses/${course.slug}`} className="text-sm font-medium text-link hover:underline">
        ← {courseTitle.value}
      </Link>

      <div className="flex flex-col gap-2">
        <h1 className="text-2xl font-semibold text-ink-900">{moduleTitle.value}</h1>
        {moduleDescription && <p className="text-sm text-ink-500">{moduleDescription.value}</p>}
        <p className="text-xs text-ink-300">{t('courses.lessonCount', { count: sortedLessons.length })}</p>
      </div>

      <section className="flex flex-col gap-3">
        <h2 className="text-sm font-semibold uppercase tracking-wide text-ink-500">{t('courses.lessonsHeading')}</h2>
        <div className="flex flex-col gap-3">
          {sortedLessons.map((lesson, i) => (
            <LessonItem
              key={lesson.slug}
              courseSlug={course.slug}
              moduleSlug={courseModule.slug}
              lesson={lesson}
              lessonNumber={i + 1}
              locale={locale}
              t={t}
              completed={isLessonComplete(completed, course.slug, courseModule.slug, lesson.slug)}
            />
          ))}
        </div>
      </section>
    </Container>
  );
}
