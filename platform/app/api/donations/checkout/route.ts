import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { createDonationCheckout } from '@/modules/payments/billing.service';
import { withErrorHandling, jsonOk, Errors } from '@/lib/api-response';
import { forbidModeratorFinancialAccess } from '@/lib/auth-guards';
import { donationCheckoutRequestSchema } from '@/lib/validations/billing';
import { checkRateLimit } from '@/lib/rate-limit';

// Starts a Stripe Checkout Session (mode: "payment", not "subscription") for
// a one-off donation. The amount is validated server-side regardless of what
// the client sent (Prompt3 §11) and the acting user is always resolved from
// the session — never from the request body — so a donation can never be
// attributed to another member. This never creates or touches a Subscription
// row; membership and donations stay fully separate (Day 4 §12).
export async function POST(req: Request) {
  return withErrorHandling(async () => {
    const session = await getServerSession(authOptions);
    if (!session?.user) throw Errors.unauthorized();
    forbidModeratorFinancialAccess(session.user.role);

    if (!checkRateLimit(`donation:checkout:${session.user.id}`, 10, 60_000)) {
      throw Errors.tooManyRequests();
    }

    const body = await req.json();
    const { amount, currency } = donationCheckoutRequestSchema.parse(body);

    const checkoutSession = await createDonationCheckout({
      userId: session.user.id,
      amount,
      currency,
    });

    return jsonOk({ url: checkoutSession.url });
  });
}
