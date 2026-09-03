import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { listAllPlans, createPlan } from '@/modules/membership/membership.service';
import { withErrorHandling, jsonOk, Errors } from '@/lib/api-response';
import { isAdmin } from '@/lib/permissions';
import { createMembershipPlanSchema } from '@/lib/validations/membership';

export async function GET() {
  return withErrorHandling(async () => {
    const session = await getServerSession(authOptions);
    if (!session?.user) throw Errors.unauthorized();
    if (!isAdmin(session.user.role)) throw Errors.forbidden();

    const plans = await listAllPlans();
    return jsonOk({ plans });
  });
}

export async function POST(req: Request) {
  return withErrorHandling(async () => {
    const session = await getServerSession(authOptions);
    if (!session?.user) throw Errors.unauthorized();
    if (!isAdmin(session.user.role)) throw Errors.forbidden();

    const body = await req.json();
    const input = createMembershipPlanSchema.parse(body);
    const plan = await createPlan(input);
    return jsonOk({ plan }, 201);
  });
}
