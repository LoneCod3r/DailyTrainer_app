import { z } from 'zod';

export const createReportSchema = z.object({
  targetType: z.enum(['DISCUSSION', 'DISCUSSION_REPLY']),
  targetId: z.string().min(1),
  reason: z.enum(['SPAM', 'HARASSMENT', 'INAPPROPRIATE', 'OTHER']),
  note: z.string().trim().max(1000).optional(),
});

export const resolveReportSchema = z.object({
  outcome: z.enum(['RESOLVED', 'DISMISSED']),
  resolution: z.enum(['NONE', 'WARNED', 'CONTENT_HIDDEN', 'CONTENT_REMOVED', 'USER_SUSPENDED']),
  resolutionNote: z.string().trim().max(1000).optional(),
});

export const setDiscussionModerationSchema = z.object({
  status: z.enum(['PUBLISHED', 'PENDING', 'HIDDEN', 'REMOVED']).optional(),
  locked: z.boolean().optional(),
});

export const setReplyModerationSchema = z.object({
  status: z.enum(['PUBLISHED', 'PENDING', 'HIDDEN', 'REMOVED']),
});

export const setModeratedUserStatusSchema = z.object({
  status: z.enum(['ACTIVE', 'SUSPENDED']),
});
