import { prisma } from '@/lib/prisma';
import { isModerator } from '@/lib/permissions';
import type { Discussion, DiscussionCategory, DiscussionReply, Role } from '@prisma/client';

// Discussions are real, persisted data (unlike Courses/Meetings, which are
// static demo content for Day 3) — this is the one Community area where
// members actually create content, so it follows the same
// service-over-Prisma pattern as modules/content.

export const DISCUSSION_CATEGORIES: DiscussionCategory[] = [
  'GENERAL',
  'PRACTICES',
  'PROGRAMS',
  'KUKO_WAY',
  'COMMUNITY',
  'QUESTIONS',
];

type Viewer = { id: string; role: Role } | null;

// PENDING/HIDDEN discussions are only visible to their author or a
// moderator+ — ordinary visitors never see internal moderation state.
// REMOVED is never shown (soft-deleted tombstone, moderators use Prisma
// Studio directly today — no admin UI for this in Day 3 scope).
function canView(discussion: { status: string; authorId: string }, viewer: Viewer): boolean {
  if (discussion.status === 'PUBLISHED') return true;
  if (discussion.status === 'REMOVED') return false;
  return viewer?.id === discussion.authorId || isModerator(viewer?.role);
}

// Note: discussion titles are frequently Bulgarian (Cyrillic), which has no
// Latin transliteration to strip diacritics from — those titles fall
// through to the `|| 'discussion'` fallback and rely entirely on the
// numeric suffix from uniqueSlug for a readable-enough, unique slug.
function slugify(input: string): string {
  return (
    input
      .toLowerCase()
      .normalize('NFKD')
      .replace(/[̀-ͯ]/g, '')
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/^-+|-+$/g, '')
      .slice(0, 60) || 'discussion'
  );
}

async function uniqueSlug(base: string): Promise<string> {
  const root = slugify(base);
  let candidate = root;
  let suffix = 1;
  // Small collision loop — discussion volume is low, this is never a
  // meaningful number of round-trips in practice.
  while (await prisma.discussion.findUnique({ where: { slug: candidate }, select: { id: true } })) {
    suffix += 1;
    candidate = `${root}-${suffix}`;
  }
  return candidate;
}

const authorSelect = {
  select: {
    id: true,
    name: true,
    role: true,
    profile: { select: { avatarUrl: true, bio: true, visibility: true } },
  },
} as const;

export async function listDiscussions(params: { category?: DiscussionCategory; viewer?: Viewer } = {}) {
  const rows = await prisma.discussion.findMany({
    where: { category: params.category, status: { not: 'REMOVED' } },
    orderBy: { lastActivityAt: 'desc' },
    include: { author: authorSelect, _count: { select: { replies: true } } },
  });
  return rows.filter((d) => canView(d, params.viewer ?? null));
}

export async function getDiscussionBySlug(slug: string, viewer: Viewer) {
  const discussion = await prisma.discussion.findUnique({
    where: { slug },
    include: {
      author: authorSelect,
      replies: {
        where: { status: { not: 'REMOVED' } },
        orderBy: { createdAt: 'asc' },
        include: { author: authorSelect },
      },
    },
  });
  if (!discussion) return null;
  if (!canView(discussion, viewer)) return null;
  return {
    ...discussion,
    replies: discussion.replies.filter((r) => canView(r, viewer)),
  };
}

export async function createDiscussion(input: {
  title: string;
  body: string;
  category: DiscussionCategory;
  authorId: string;
}): Promise<Discussion> {
  const slug = await uniqueSlug(input.title);
  return prisma.discussion.create({
    data: {
      slug,
      title: input.title,
      body: input.body,
      category: input.category,
      authorId: input.authorId,
    },
  });
}

export async function createReply(input: {
  discussionSlug: string;
  body: string;
  authorId: string;
}): Promise<DiscussionReply> {
  const discussion = await prisma.discussion.findUnique({ where: { slug: input.discussionSlug } });
  if (!discussion) throw new Error('Discussion not found');
  if (discussion.locked) throw new Error('Discussion is locked');

  const [reply] = await prisma.$transaction([
    prisma.discussionReply.create({
      data: { discussionId: discussion.id, body: input.body, authorId: input.authorId },
    }),
    prisma.discussion.update({ where: { id: discussion.id }, data: { lastActivityAt: new Date() } }),
  ]);
  return reply;
}
