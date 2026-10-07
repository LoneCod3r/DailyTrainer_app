import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { createSubscriptionCheckout } from '@/modules/payments/billing.service';
import { withErrorHandling, jsonOk, Errors, ApiError } from '@/lib/api-response';
import { features } from '@/lib/features';
import { forbidModeratorFinancialAccess } from '@/lib/auth-guards';
import { subscribeToMembershipSchema } from '@/lib/validations/membership';
import { checkRateLimit } from '@/lib/rate-limit';
import { getLocale } from '@/lib/i18n/get-locale';

// Starts a Stripe Checkout Session for the given plan. The redirect back to
// success_url never marks anything paid by itself — only the verified
// customer.subscription.* webhook does (see billing.service.ts). Moderator
// is project staff, not a customer — never gets the self-service membership
// checkout, even by calling this directly (see auth-guards.ts).
//
// Membership sales are closed in V1 (lib/features.ts): the legacy plan is not
// sold and KUKO WAY Community is a future product, so this refuses before
// any plan lookup or Stripe call. Existing subscribers are unaffected — they manage their
// subscription through the billing portal (/api/membership/portal).
export async function POST(req: Request) {
  return withErrorHandling(async () => {
    const session = await getServerSession(authOptions);
    if (!session?.user) throw Errors.unauthorized();
    forbidModeratorFinancialAccess(session.user.role);

    if (!checkRateLimit(`membership:subscribe:${session.user.id}`, 10, 60_000)) {
      throw Errors.tooManyRequests();
    }

    // Order: sign-in → moderator check → rate limit → sales closed. The
    // rate limit still counts every request; nothing below (plan lookup,
    // Stripe) runs while sales are closed.
    if (!features.membershipSales) {
      throw new ApiError(403, 'MEMBERSHIP_SALES_CLOSED', 'Membership is not offered at the moment');
    }

    const body = await req.json();
    const { membershipPlanId } = subscribeToMembershipSchema.parse(body);

    const checkoutSession = await createSubscriptionCheckout({
      userId: session.user.id,
      membershipPlanId,
      locale: getLocale(),
    });

    return jsonOk({ url: checkoutSession.url });
  });
}
