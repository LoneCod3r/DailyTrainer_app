import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { withErrorHandling, jsonOk, Errors, ApiError } from '@/lib/api-response';
import { forbidModeratorFinancialAccess, requireVerifiedUser } from '@/lib/auth-guards';
import { checkRateLimit } from '@/lib/rate-limit';
import { getLocale } from '@/lib/i18n/get-locale';
import { CheckoutError, startProgramCheckout } from '@/modules/commerce/checkout.service';

// Starts a Stripe Checkout Session (mode "payment" — one-time, never a
// subscription) for a Reset Program. Stripe TEST MODE only (see
// isProgramCheckoutAvailable). The body is ignored: the program comes from
// the URL, the price from the server-side catalog, and the buyer from the
// session. Access is granted later, only from verified payment state.
export async function POST(_req: Request, { params }: { params: { slug: string } }) {
  return withErrorHandling(async () => {
    const session = await getServerSession(authOptions);
    if (!session?.user) throw Errors.unauthorized();
    requireVerifiedUser(session.user);
    forbidModeratorFinancialAccess(session.user.role);

    if (!checkRateLimit(`program-checkout:${session.user.id}`, 10, 60_000)) {
      throw Errors.tooManyRequests();
    }

    try {
      const { url } = await startProgramCheckout({ user: session.user, programSlug: params.slug, locale: getLocale() });
      return jsonOk({ url });
    } catch (err) {
      if (err instanceof CheckoutError) {
        if (err.code === 'DISABLED') throw new ApiError(403, 'CHECKOUT_DISABLED', 'Checkout is not available');
        if (err.code === 'ALREADY_OWNED') throw new ApiError(409, 'ALREADY_OWNED', 'You already have this program');
        if (err.code === 'NOT_PURCHASABLE') throw new ApiError(400, 'NOT_PURCHASABLE', 'This product cannot be purchased');
        throw Errors.notFound('Program not found');
      }
      throw err;
    }
  });
}
