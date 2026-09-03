import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { getUserStats } from '@/modules/users/users.service';
import { withErrorHandling, jsonOk, Errors } from '@/lib/api-response';
import { isAdmin } from '@/lib/permissions';

export async function GET() {
  return withErrorHandling(async () => {
    const session = await getServerSession(authOptions);
    if (!session?.user) throw Errors.unauthorized();
    if (!isAdmin(session.user.role)) throw Errors.forbidden();

    const stats = await getUserStats();
    return jsonOk({ stats });
  });
}
