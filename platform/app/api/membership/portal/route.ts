import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { createCustomerPortalSession } from '@/modules/payments/billing.service';
import { withErrorHandling, jsonOk, Errors } from '@/lib/api-response';

// Opens Stripe's hosted Customer Portal — this is how a member updates their
// payment method or cancels, rather than a custom cancellation UI.
export async function POST() {
  return withErrorHandling(async () => {
    const session = await getServerSession(authOptions);
    if (!session?.user) throw Errors.unauthorized();

    const portalSession = await createCustomerPortalSession(session.user.id);
    return jsonOk({ url: portalSession.url });
  });
}
