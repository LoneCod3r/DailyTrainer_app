import Link from 'next/link';
import { notFound } from 'next/navigation';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { Container } from '@/components/ui';
import { LessonNavigation } from '@/components/courses/LessonNavigation';
import { getCourseBySlug, getModuleBySlug, getLessonBySlug, getAdjacentLessons } from '@/modules/courses/service';
import { getCompletedLessonKeys, isLessonComplete } from '@/modules/courses/progress.service';
import { getLocale } from '@/lib/i18n/get-locale';
import { getT } from '@/lib/i18n/dictionaries';
import { localize } from '@/modules/kuko-way/types';

export default async function LessonPage({
  params,
}: {
  params: { slug: string; moduleSlug: string; lessonSlug: string };
}) {
  const locale = getLocale();
  const t = getT(locale);
  const course = getCourseBySlug(params.slug);
  if (!course) notFound();
  const courseModule = getModuleBySlug(course, params.moduleSlug);
  if (!courseModule) notFound();
  const lesson = getLessonBySlug(courseModule, params.lessonSlug);
  if (!lesson) notFound();

  const session = await getServerSession(authOptions);
  const completed = session?.user ? await getCompletedLessonKeys(session.user.id, course.slug) : new Set<string>();
  const isComplete = isLessonComplete(completed, course.slug, courseModule.slug, lesson.slug);

  const { previous, next, position, total } = getAdjacentLessons(course, courseModule.slug, lesson.slug);

  const courseTitle = localize(course.title, locale);
  const moduleTitle = localize(courseModule.title, locale);
  const lessonTitle = localize(lesson.title, locale);

  return (
    <Container className="flex max-w-2xl flex-col gap-6 py-8">
      <nav aria-label="Breadcrumb" className="flex flex-wrap items-center gap-1.5 text-sm text-ink-500">
        <Link href={`/community/courses/${course.slug}`} className="font-medium text-link hover:underline">
          {courseTitle.value}
        </Link>
        <span aria-hidden="true">/</span>
        <Link href={`/community/courses/${course.slug}/${courseModule.slug}`} className="font-medium text-link hover:underline">
          {moduleTitle.value}
        </Link>
      </nav>

      <div className="flex flex-col gap-2">
        {position && total && <p className="text-xs font-semibold uppercase tracking-wide text-ink-300">{t('courses.lessonOf', { current: position, total })}</p>}
        <h1 className="text-2xl font-semibold text-ink-900">{lessonTitle.value}</h1>
      </div>

      <div className="flex flex-col gap-4">
        {lesson.content.map((paragraph, i) => (
          <p key={i} className="text-[15px] leading-relaxed text-ink-700">
            {localize(paragraph, locale).value}
          </p>
        ))}
      </div>

      {!next && isComplete && (
        <p className="rounded-xl bg-brand-tint px-4 py-3 text-sm font-medium text-link">{t('courses.courseComplete')}</p>
      )}

      <LessonNavigation
        courseSlug={course.slug}
        moduleSlug={courseModule.slug}
        lessonSlug={lesson.slug}
        completed={isComplete}
        isSignedIn={Boolean(session?.user)}
        previousHref={
          previous ? `/community/courses/${course.slug}/${previous.module.slug}/${previous.lesson.slug}` : undefined
        }
        nextHref={next ? `/community/courses/${course.slug}/${next.module.slug}/${next.lesson.slug}` : undefined}
      />
    </Container>
  );
}
