import { z } from 'zod';

export const discussionCategorySchema = z.enum([
  'GENERAL',
  'PRACTICES',
  'PROGRAMS',
  'KUKO_WAY',
  'COMMUNITY',
  'QUESTIONS',
]);

export const createDiscussionSchema = z.object({
  title: z.string().trim().min(4, 'Title must be at least 4 characters').max(140),
  body: z.string().trim().min(10, 'Message must be at least 10 characters').max(8000),
  category: discussionCategorySchema,
});

export const createReplySchema = z.object({
  body: z.string().trim().min(2, 'Reply must be at least 2 characters').max(4000),
});
