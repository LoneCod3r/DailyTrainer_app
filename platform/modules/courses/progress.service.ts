import { prisma } from '@/lib/prisma';
import { flattenLessons } from './service';
import type { Course } from './types';

// The one real, persisted piece of the Courses module — which lessons a
// signed-in user has actually completed. Course/module/lesson content
// itself stays static demo data (see ./content/courses.ts).

function lessonKey(courseSlug: string, moduleSlug: string, lessonSlug: string) {
  return `${courseSlug}/${moduleSlug}/${lessonSlug}`;
}

export async function getCompletedLessonKeys(userId: string, courseSlug: string): Promise<Set<string>> {
  const rows = await prisma.lessonProgress.findMany({
    where: { userId, courseSlug },
    select: { moduleSlug: true, lessonSlug: true },
  });
  return new Set(rows.map((r) => lessonKey(courseSlug, r.moduleSlug, r.lessonSlug)));
}

export async function markLessonComplete(
  userId: string,
  input: { courseSlug: string; moduleSlug: string; lessonSlug: string },
) {
  return prisma.lessonProgress.upsert({
    where: {
      userId_courseSlug_moduleSlug_lessonSlug: {
        userId,
        courseSlug: input.courseSlug,
        moduleSlug: input.moduleSlug,
        lessonSlug: input.lessonSlug,
      },
    },
    update: {},
    create: { userId, ...input },
  });
}

export function isLessonComplete(
  completed: Set<string>,
  courseSlug: string,
  moduleSlug: string,
  lessonSlug: string,
): boolean {
  return completed.has(lessonKey(courseSlug, moduleSlug, lessonSlug));
}

// Course-wide progress: how many of its lessons are complete.
export function computeCourseProgress(course: Course, completed: Set<string>) {
  const flat = flattenLessons(course);
  const completedCount = flat.filter((f) => completed.has(lessonKey(course.slug, f.module.slug, f.lesson.slug))).length;
  return { completedCount, totalCount: flat.length };
}

// Module-level progress, used on the course detail page's module list.
export function computeModuleProgress(courseSlug: string, moduleSlug: string, lessonSlugs: string[], completed: Set<string>) {
  const completedCount = lessonSlugs.filter((slug) => completed.has(lessonKey(courseSlug, moduleSlug, slug))).length;
  return { completedCount, totalCount: lessonSlugs.length };
}
