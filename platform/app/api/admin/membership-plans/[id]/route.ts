import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { updatePlan } from '@/modules/membership/membership.service';
import { withErrorHandling, jsonOk, Errors } from '@/lib/api-response';
import { isAdmin } from '@/lib/permissions';
import { updateMembershipPlanSchema } from '@/lib/validations/membership';

export async function PATCH(req: Request, { params }: { params: { id: string } }) {
  return withErrorHandling(async () => {
    const session = await getServerSession(authOptions);
    if (!session?.user) throw Errors.unauthorized();
    if (!isAdmin(session.user.role)) throw Errors.forbidden();

    const body = await req.json();
    const input = updateMembershipPlanSchema.parse(body);
    const plan = await updatePlan(params.id, input);
    return jsonOk({ plan });
  });
}
