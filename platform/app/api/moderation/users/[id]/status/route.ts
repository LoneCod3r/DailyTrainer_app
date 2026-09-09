import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { setUserStatusAsModerator } from '@/modules/moderation/moderation.service';
import { setModeratedUserStatusSchema } from '@/lib/validations/moderation';
import { withErrorHandling, jsonOk, Errors } from '@/lib/api-response';
import { requireRole } from '@/lib/auth-guards';

// Deliberately separate from /api/users/[id] (Admin, which also allows role
// changes and INACTIVE): a Moderator may only suspend/reactivate ordinary
// members, never change roles, never touch another moderator or admin. See
// modules/moderation/moderation.service.ts's setUserStatusAsModerator.
export async function PATCH(req: Request, { params }: { params: { id: string } }) {
  return withErrorHandling(async () => {
    const session = await getServerSession(authOptions);
    if (!session?.user) throw Errors.unauthorized();
    requireRole(session.user.role, 'MODERATOR');

    const body = await req.json();
    const { status } = setModeratedUserStatusSchema.parse(body);
    const user = await setUserStatusAsModerator({
      actingUserId: session.user.id,
      targetUserId: params.id,
      status,
    });
    return jsonOk({ user });
  });
}
