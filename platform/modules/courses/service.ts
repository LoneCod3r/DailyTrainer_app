import { courses } from './content/courses';
import type { Course, CourseModule, Lesson } from './types';

// Static content accessors, mirroring modules/kuko-way/service.ts. See
// modules/courses/README-equivalent note in types.ts for why this content
// isn't in Prisma yet — only completion (LessonProgress) is real.

export function getCourses(): Course[] {
  return courses;
}

export function getCourseBySlug(slug: string): Course | undefined {
  return courses.find((c) => c.slug === slug);
}

export function getModuleBySlug(course: Course, moduleSlug: string): CourseModule | undefined {
  return course.modules.find((m) => m.slug === moduleSlug);
}

export function getLessonBySlug(courseModule: CourseModule, lessonSlug: string): Lesson | undefined {
  return courseModule.lessons.find((l) => l.slug === lessonSlug);
}

export function countLessons(course: Course): number {
  return course.modules.reduce((n, m) => n + m.lessons.length, 0);
}

// Flat, ordered list of every lesson in a course with its module context —
// the backbone of previous/next lesson navigation across module boundaries.
export interface FlatLesson {
  lesson: Lesson;
  module: CourseModule;
  index: number;
}

export function flattenLessons(course: Course): FlatLesson[] {
  const sortedModules = [...course.modules].sort((a, b) => a.order - b.order);
  const flat: FlatLesson[] = [];
  for (const courseModule of sortedModules) {
    const sortedLessons = [...courseModule.lessons].sort((a, b) => a.order - b.order);
    for (const lesson of sortedLessons) {
      flat.push({ lesson, module: courseModule, index: flat.length });
    }
  }
  return flat;
}

export function getAdjacentLessons(course: Course, moduleSlug: string, lessonSlug: string) {
  const flat = flattenLessons(course);
  const currentIndex = flat.findIndex((f) => f.module.slug === moduleSlug && f.lesson.slug === lessonSlug);
  return {
    current: currentIndex >= 0 ? flat[currentIndex] : undefined,
    previous: currentIndex > 0 ? flat[currentIndex - 1] : undefined,
    next: currentIndex >= 0 && currentIndex < flat.length - 1 ? flat[currentIndex + 1] : undefined,
    position: currentIndex >= 0 ? currentIndex + 1 : undefined,
    total: flat.length,
  };
}
