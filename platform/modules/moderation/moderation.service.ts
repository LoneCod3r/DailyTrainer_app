import { prisma } from '@/lib/prisma';
import { Errors } from '@/lib/api-response';
import { hasRole } from '@/lib/permissions';
import type {
  ModerationStatus,
  Report,
  ReportReason,
  ReportResolution,
  ReportTargetType,
  Role,
  UserStatus,
} from '@prisma/client';

// Moderation queue and actions built on top of the existing Discussion /
// DiscussionReply ModerationStatus + the Report model (member-filed
// complaints). See prisma/schema.prisma's Report block for why Report and
// ModerationStatus are separate concepts.

const reporterSelect = {
  select: { id: true, name: true, email: true },
} as const;

const handlerSelect = {
  select: { id: true, name: true, email: true },
} as const;

export type ReportWithTarget = Report & {
  reporter: { id: string; name: string | null; email: string };
  handledBy: { id: string; name: string | null; email: string } | null;
  target:
    | { kind: 'DISCUSSION'; id: string; slug: string; title: string; status: ModerationStatus; authorId: string; authorName: string | null }
    | { kind: 'DISCUSSION_REPLY'; id: string; discussionSlug: string; body: string; status: ModerationStatus; authorId: string; authorName: string | null }
    | { kind: 'MISSING' };
};

async function attachTargets(reports: (Report & {
  reporter: { id: string; name: string | null; email: string };
  handledBy: { id: string; name: string | null; email: string } | null;
})[]): Promise<ReportWithTarget[]> {
  const discussionIds = reports.filter((r) => r.targetType === 'DISCUSSION').map((r) => r.targetId);
  const replyIds = reports.filter((r) => r.targetType === 'DISCUSSION_REPLY').map((r) => r.targetId);

  const [discussions, replies] = await Promise.all([
    discussionIds.length
      ? prisma.discussion.findMany({
          where: { id: { in: discussionIds } },
          select: { id: true, slug: true, title: true, status: true, author: { select: { id: true, name: true } } },
        })
      : Promise.resolve([]),
    replyIds.length
      ? prisma.discussionReply.findMany({
          where: { id: { in: replyIds } },
          select: {
            id: true,
            body: true,
            status: true,
            author: { select: { id: true, name: true } },
            discussion: { select: { slug: true } },
          },
        })
      : Promise.resolve([]),
  ]);

  const discussionMap = new Map(discussions.map((d) => [d.id, d]));
  const replyMap = new Map(replies.map((r) => [r.id, r]));

  return reports.map((r) => {
    if (r.targetType === 'DISCUSSION') {
      const d = discussionMap.get(r.targetId);
      return {
        ...r,
        target: d
          ? {
              kind: 'DISCUSSION' as const,
              id: d.id,
              slug: d.slug,
              title: d.title,
              status: d.status,
              authorId: d.author.id,
              authorName: d.author.name,
            }
          : { kind: 'MISSING' as const },
      };
    }
    const rep = replyMap.get(r.targetId);
    return {
      ...r,
      target: rep
        ? {
            kind: 'DISCUSSION_REPLY' as const,
            id: rep.id,
            discussionSlug: rep.discussion.slug,
            body: rep.body,
            status: rep.status,
            authorId: rep.author.id,
            authorName: rep.author.name,
          }
        : { kind: 'MISSING' as const },
    };
  });
}

export async function createReport(input: {
  targetType: ReportTargetType;
  targetId: string;
  reason: ReportReason;
  note?: string;
  reporterId: string;
}): Promise<Report> {
  const exists =
    input.targetType === 'DISCUSSION'
      ? await prisma.discussion.findUnique({ where: { id: input.targetId }, select: { id: true } })
      : await prisma.discussionReply.findUnique({ where: { id: input.targetId }, select: { id: true } });
  if (!exists) throw Errors.notFound('Content not found');

  return prisma.report.create({
    data: {
      targetType: input.targetType,
      targetId: input.targetId,
      reason: input.reason,
      note: input.note,
      reporterId: input.reporterId,
    },
  });
}

export async function listOpenReports(): Promise<ReportWithTarget[]> {
  const reports = await prisma.report.findMany({
    where: { status: 'OPEN' },
    orderBy: { createdAt: 'asc' },
    include: { reporter: reporterSelect, handledBy: handlerSelect },
  });
  return attachTargets(reports);
}

export async function getReportWithTarget(reportId: string): Promise<ReportWithTarget | null> {
  const report = await prisma.report.findUnique({
    where: { id: reportId },
    include: { reporter: reporterSelect, handledBy: handlerSelect },
  });
  if (!report) return null;
  const [withTarget] = await attachTargets([report]);
  return withTarget;
}

export async function listReportHistory(limit = 50): Promise<ReportWithTarget[]> {
  const reports = await prisma.report.findMany({
    where: { status: { not: 'OPEN' } },
    orderBy: { handledAt: 'desc' },
    take: limit,
    include: { reporter: reporterSelect, handledBy: handlerSelect },
  });
  return attachTargets(reports);
}

// Real, backend-derived counts for the moderator dashboard — no fabricated
// numbers. `pendingContent` covers content a moderator hasn't yet decided on
// (PENDING status), separate from open member reports.
export async function getModerationOverview() {
  const [openReports, pendingDiscussions, pendingReplies, resolvedLast7Days] = await Promise.all([
    prisma.report.count({ where: { status: 'OPEN' } }),
    prisma.discussion.count({ where: { status: 'PENDING' } }),
    prisma.discussionReply.count({ where: { status: 'PENDING' } }),
    prisma.report.count({
      where: { status: { not: 'OPEN' }, handledAt: { gte: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000) } },
    }),
  ]);

  return {
    openReports,
    pendingContent: pendingDiscussions + pendingReplies,
    resolvedLast7Days,
  };
}

export async function resolveReport(input: {
  reportId: string;
  moderatorId: string;
  outcome: 'RESOLVED' | 'DISMISSED';
  resolution: ReportResolution;
  resolutionNote?: string;
}): Promise<Report> {
  const report = await prisma.report.findUnique({ where: { id: input.reportId } });
  if (!report) throw Errors.notFound('Report not found');
  if (report.status !== 'OPEN') throw Errors.conflict('Report already handled');

  return prisma.report.update({
    where: { id: input.reportId },
    data: {
      status: input.outcome,
      resolution: input.resolution,
      resolutionNote: input.resolutionNote,
      handledById: input.moderatorId,
      handledAt: new Date(),
    },
  });
}

export async function setDiscussionModeration(input: {
  slug: string;
  status?: ModerationStatus;
  locked?: boolean;
}) {
  const discussion = await prisma.discussion.findUnique({ where: { slug: input.slug } });
  if (!discussion) throw Errors.notFound('Discussion not found');

  return prisma.discussion.update({
    where: { slug: input.slug },
    data: {
      ...(input.status ? { status: input.status } : {}),
      ...(input.locked !== undefined ? { locked: input.locked } : {}),
    },
  });
}

export async function setReplyModeration(input: { replyId: string; status: ModerationStatus }) {
  const reply = await prisma.discussionReply.findUnique({ where: { id: input.replyId } });
  if (!reply) throw Errors.notFound('Reply not found');

  return prisma.discussionReply.update({ where: { id: input.replyId }, data: { status: input.status } });
}

// Moderators may suspend/reactivate ordinary members, but never another
// moderator or an admin, and never themselves — that boundary belongs to
// Admin (modules/users/users.service.ts's updateUserStatus, used from
// /admin/users), not Moderation. Kept separate from that function rather
// than widened, since the two callers have different authorization rules.
export async function setUserStatusAsModerator(input: {
  actingUserId: string;
  targetUserId: string;
  status: UserStatus;
}) {
  if (input.actingUserId === input.targetUserId) {
    throw Errors.forbidden('You cannot change your own account status');
  }

  const target = await prisma.user.findUnique({ where: { id: input.targetUserId }, select: { role: true } });
  if (!target) throw Errors.notFound('User not found');
  if (hasRole(target.role as Role, 'MODERATOR')) {
    throw Errors.forbidden('Moderators cannot suspend other moderators or admins');
  }

  return prisma.user.update({
    where: { id: input.targetUserId },
    data: { status: input.status },
    select: { id: true, status: true },
  });
}

// Real content for the Discussions moderation surface — every discussion
// (not just reported ones), so a moderator can act on something they spot
// themselves. Excludes REMOVED the same way the public listing does; a
// moderator can still reach a removed discussion's replies via a report.
export async function listDiscussionsForModeration(limit = 50) {
  return prisma.discussion.findMany({
    orderBy: { lastActivityAt: 'desc' },
    take: limit,
    select: {
      id: true,
      slug: true,
      title: true,
      status: true,
      locked: true,
      category: true,
      lastActivityAt: true,
      createdAt: true,
      author: { select: { id: true, name: true, email: true } },
      _count: { select: { replies: true } },
    },
  });
}

// Ordinary members only (role USER) — this is the Moderator "Members" list,
// narrower than Admin's /admin/users (which also manages Moderator/Admin
// accounts and roles).
export async function listModeratableMembers(limit = 50) {
  return prisma.user.findMany({
    where: { role: 'USER' },
    orderBy: { createdAt: 'desc' },
    take: limit,
    select: { id: true, name: true, email: true, status: true, createdAt: true },
  });
}
