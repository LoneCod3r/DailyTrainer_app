import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { setReplyModeration } from '@/modules/moderation/moderation.service';
import { setReplyModerationSchema } from '@/lib/validations/moderation';
import { withErrorHandling, jsonOk, Errors } from '@/lib/api-response';
import { requireRole } from '@/lib/auth-guards';

export async function PATCH(req: Request, { params }: { params: { replyId: string } }) {
  return withErrorHandling(async () => {
    const session = await getServerSession(authOptions);
    if (!session?.user) throw Errors.unauthorized();
    requireRole(session.user.role, 'MODERATOR');

    const body = await req.json();
    const { status } = setReplyModerationSchema.parse(body);
    const reply = await setReplyModeration({ replyId: params.replyId, status });
    return jsonOk({ reply });
  });
}
