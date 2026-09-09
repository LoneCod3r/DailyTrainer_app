import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { setDiscussionModeration } from '@/modules/moderation/moderation.service';
import { setDiscussionModerationSchema } from '@/lib/validations/moderation';
import { withErrorHandling, jsonOk, Errors } from '@/lib/api-response';
import { requireRole } from '@/lib/auth-guards';

// Moderator+ only. Direct content moderation (hide/restore/remove, lock/
// unlock) independent of any report — a moderator can act on content they
// spotted themselves, not only content someone reported.
export async function PATCH(req: Request, { params }: { params: { slug: string } }) {
  return withErrorHandling(async () => {
    const session = await getServerSession(authOptions);
    if (!session?.user) throw Errors.unauthorized();
    requireRole(session.user.role, 'MODERATOR');

    const body = await req.json();
    const input = setDiscussionModerationSchema.parse(body);
    if (input.status === undefined && input.locked === undefined) {
      throw Errors.badRequest('Expected a "status" or "locked" field');
    }

    const discussion = await setDiscussionModeration({ slug: params.slug, ...input });
    return jsonOk({ discussion });
  });
}
