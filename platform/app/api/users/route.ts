import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { listUsers } from '@/modules/users/users.service';
import { withErrorHandling, jsonOk, Errors } from '@/lib/api-response';
import { isAdmin } from '@/lib/permissions';

export async function GET(req: Request) {
  return withErrorHandling(async () => {
    const session = await getServerSession(authOptions);
    if (!session?.user) throw Errors.unauthorized();
    if (!isAdmin(session.user.role)) throw Errors.forbidden();

    const url = new URL(req.url);
    const page = Number(url.searchParams.get('page') ?? '1');
    const pageSize = Number(url.searchParams.get('pageSize') ?? '20');

    const result = await listUsers({ page, pageSize });
    return jsonOk(result);
  });
}
