// Courses content model (Day 3). Course/module/lesson content is static
// demo/seed data — a real curriculum has not been authorized yet, so this
// exists to prove out the Course → Module → Lesson UX and progress
// architecture without inventing real-world instructors or claims. Reuses
// the generic LocalizedText shape already established by modules/kuko-way.
export type { LocalizedText } from '@/modules/kuko-way/types';
import type { LocalizedText } from '@/modules/kuko-way/types';

export interface Lesson {
  slug: string;
  order: number;
  title: LocalizedText;
  summary?: LocalizedText;
  content: LocalizedText[];
}

export interface CourseModule {
  slug: string;
  order: number;
  title: LocalizedText;
  description?: LocalizedText;
  lessons: Lesson[];
}

export interface Course {
  slug: string;
  title: LocalizedText;
  description: LocalizedText;
  modules: CourseModule[];
}
