import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { createSubscriptionCheckout } from '@/modules/payments/billing.service';
import { withErrorHandling, jsonOk, Errors } from '@/lib/api-response';
import { forbidModeratorFinancialAccess } from '@/lib/auth-guards';
import { subscribeToMembershipSchema } from '@/lib/validations/membership';
import { checkRateLimit } from '@/lib/rate-limit';

// Starts a Stripe Checkout Session for the given plan. The redirect back to
// success_url never marks anything paid by itself — only the verified
// customer.subscription.* webhook does (see billing.service.ts). Moderator
// is project staff, not a customer — never gets the self-service membership
// checkout, even by calling this directly (see auth-guards.ts).
export async function POST(req: Request) {
  return withErrorHandling(async () => {
    const session = await getServerSession(authOptions);
    if (!session?.user) throw Errors.unauthorized();
    forbidModeratorFinancialAccess(session.user.role);

    if (!checkRateLimit(`membership:subscribe:${session.user.id}`, 10, 60_000)) {
      throw Errors.tooManyRequests();
    }

    const body = await req.json();
    const { membershipPlanId } = subscribeToMembershipSchema.parse(body);

    const checkoutSession = await createSubscriptionCheckout({
      userId: session.user.id,
      membershipPlanId,
    });

    return jsonOk({ url: checkoutSession.url });
  });
}
