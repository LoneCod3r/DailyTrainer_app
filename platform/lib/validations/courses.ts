import { z } from 'zod';

export const completeLessonSchema = z.object({
  moduleSlug: z.string().min(1),
  lessonSlug: z.string().min(1),
});
