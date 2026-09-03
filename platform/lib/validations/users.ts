import { z } from 'zod';

export const updateUserRoleSchema = z.object({
  role: z.enum(['USER', 'MODERATOR', 'ADMIN']),
});

export const updateUserStatusSchema = z.object({
  status: z.enum(['ACTIVE', 'INACTIVE', 'SUSPENDED']),
});

export const updateProfileSchema = z.object({
  bio: z.string().max(1000).optional(),
  avatarUrl: z.string().url().optional().or(z.literal('')),
  interests: z.array(z.string().min(1).max(40)).max(20).optional(),
  visibility: z.enum(['PUBLIC', 'MEMBERS', 'PRIVATE']).optional(),
});
