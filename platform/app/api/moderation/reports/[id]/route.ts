import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import {
  getReportWithTarget,
  resolveReport,
  setDiscussionModeration,
  setReplyModeration,
  setUserStatusAsModerator,
} from '@/modules/moderation/moderation.service';
import { resolveReportSchema } from '@/lib/validations/moderation';
import { withErrorHandling, jsonOk, Errors } from '@/lib/api-response';
import { requireRole } from '@/lib/auth-guards';
import { prisma } from '@/lib/prisma';

// Resolves a report and, when the chosen resolution implies a real state
// change (CONTENT_HIDDEN / CONTENT_REMOVED / USER_SUSPENDED), applies it in
// the same request — a moderator shouldn't have to make two separate calls
// for "hide this and close the report". NONE/WARNED only record the
// decision on the report itself (see ReportResolution in the schema for why).
export async function PATCH(req: Request, { params }: { params: { id: string } }) {
  return withErrorHandling(async () => {
    const session = await getServerSession(authOptions);
    if (!session?.user) throw Errors.unauthorized();
    requireRole(session.user.role, 'MODERATOR');

    const body = await req.json();
    const input = resolveReportSchema.parse(body);

    const before = await getReportWithTarget(params.id);
    if (!before) throw Errors.notFound('Report not found');

    const report = await resolveReport({
      reportId: params.id,
      moderatorId: session.user.id,
      outcome: input.outcome,
      resolution: input.resolution,
      resolutionNote: input.resolutionNote,
    });

    if (input.resolution === 'CONTENT_HIDDEN' || input.resolution === 'CONTENT_REMOVED') {
      const status = input.resolution === 'CONTENT_HIDDEN' ? 'HIDDEN' : 'REMOVED';
      if (report.targetType === 'DISCUSSION') {
        const discussion = await prisma.discussion.findUnique({ where: { id: report.targetId }, select: { slug: true } });
        if (discussion) await setDiscussionModeration({ slug: discussion.slug, status });
      } else {
        await setReplyModeration({ replyId: report.targetId, status });
      }
    }

    if (input.resolution === 'USER_SUSPENDED' && before.target.kind !== 'MISSING') {
      await setUserStatusAsModerator({
        actingUserId: session.user.id,
        targetUserId: before.target.authorId,
        status: 'SUSPENDED',
      });
    }

    return jsonOk({ report });
  });
}
