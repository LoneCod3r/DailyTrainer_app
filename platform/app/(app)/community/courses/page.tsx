import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { Container, EmptyState } from '@/components/ui';
import { PageHeader } from '@/components/layout/PageHeader';
import { CourseCard } from '@/components/courses/CourseCard';
import { getCourses } from '@/modules/courses/service';
import { getCompletedLessonKeys, computeCourseProgress } from '@/modules/courses/progress.service';
import { getLocale } from '@/lib/i18n/get-locale';
import { getT } from '@/lib/i18n/dictionaries';

export default async function CoursesPage() {
  const locale = getLocale();
  const t = getT(locale);
  const session = await getServerSession(authOptions);
  const courses = getCourses();

  const progressByCourse = session?.user
    ? await Promise.all(
        courses.map(async (course) => {
          const completed = await getCompletedLessonKeys(session.user.id, course.slug);
          return [course.slug, computeCourseProgress(course, completed)] as const;
        }),
      )
    : [];
  const progressMap = new Map(progressByCourse);

  return (
    <Container className="flex flex-col gap-8 py-8">
      <PageHeader eyebrow={t('nav.community')} title={t('courses.pageTitle')} description={t('courses.pageSubtitle')} />

      {courses.length === 0 ? (
        <EmptyState title={t('courses.emptyTitle')} description={t('courses.emptyDesc')} />
      ) : (
        <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-3">
          {courses.map((course) => (
            <CourseCard key={course.slug} course={course} locale={locale} t={t} progress={progressMap.get(course.slug)} />
          ))}
        </div>
      )}
    </Container>
  );
}
