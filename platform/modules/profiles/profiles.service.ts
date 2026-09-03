import { prisma } from '@/lib/prisma';
import type { z } from 'zod';
import type { updateProfileSchema } from '@/lib/validations/users';

type UpdateProfileInput = z.infer<typeof updateProfileSchema>;

export async function getProfileByUserId(userId: string) {
  return prisma.profile.findUnique({ where: { userId } });
}

export async function upsertProfile(userId: string, input: UpdateProfileInput) {
  return prisma.profile.upsert({
    where: { userId },
    create: { userId, ...input },
    update: { ...input },
  });
}

// Applies each viewer's privacy settings: PRIVATE profiles are hidden from
// everyone but the owner, MEMBERS profiles require an authenticated viewer,
// PUBLIC is visible to anyone. This is the single choke point other code
// should call rather than querying Profile directly.
export function isProfileVisibleTo(
  profile: { userId: string; visibility: 'PUBLIC' | 'MEMBERS' | 'PRIVATE' },
  viewer: { id: string } | null,
) {
  if (viewer?.id === profile.userId) return true;
  if (profile.visibility === 'PUBLIC') return true;
  if (profile.visibility === 'MEMBERS') return Boolean(viewer);
  return false;
}
