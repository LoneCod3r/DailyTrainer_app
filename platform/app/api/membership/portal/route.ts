import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { createCustomerPortalSession } from '@/modules/payments/billing.service';
import { withErrorHandling, jsonOk, Errors } from '@/lib/api-response';
import { forbidModeratorFinancialAccess } from '@/lib/auth-guards';
import { getLocale } from '@/lib/i18n/get-locale';

// Opens Stripe's hosted Customer Portal — this is how a member updates their
// payment method or cancels, rather than a custom cancellation UI. Moderator
// never gets this self-service surface (see auth-guards.ts).
export async function POST() {
  return withErrorHandling(async () => {
    const session = await getServerSession(authOptions);
    if (!session?.user) throw Errors.unauthorized();
    forbidModeratorFinancialAccess(session.user.role);

    const portalSession = await createCustomerPortalSession(session.user.id, getLocale());
    return jsonOk({ url: portalSession.url });
  });
}
