import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { getUserById, updateUserRole, updateUserStatus } from '@/modules/users/users.service';
import { withErrorHandling, jsonOk, Errors } from '@/lib/api-response';
import { isAdmin } from '@/lib/permissions';
import { updateUserRoleSchema, updateUserStatusSchema } from '@/lib/validations/users';

export async function GET(_req: Request, { params }: { params: { id: string } }) {
  return withErrorHandling(async () => {
    const session = await getServerSession(authOptions);
    if (!session?.user) throw Errors.unauthorized();
    if (!isAdmin(session.user.role) && session.user.id !== params.id) throw Errors.forbidden();

    const user = await getUserById(params.id);
    return jsonOk({ user });
  });
}

// Supports either { role } or { status } in the body — both are admin-only,
// backend-enforced (never trust a role/status change from client state).
export async function PATCH(req: Request, { params }: { params: { id: string } }) {
  return withErrorHandling(async () => {
    const session = await getServerSession(authOptions);
    if (!session?.user) throw Errors.unauthorized();
    if (!isAdmin(session.user.role)) throw Errors.forbidden();

    const body = await req.json();

    if ('role' in body) {
      const { role } = updateUserRoleSchema.parse(body);
      const user = await updateUserRole(session.user.id, params.id, role);
      return jsonOk({ user });
    }

    if ('status' in body) {
      const { status } = updateUserStatusSchema.parse(body);
      const user = await updateUserStatus(session.user.id, params.id, status);
      return jsonOk({ user });
    }

    throw Errors.badRequest('Expected a "role" or "status" field');
  });
}
