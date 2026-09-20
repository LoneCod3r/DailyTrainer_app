import { cookies } from 'next/headers';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { syncStripeCustomerLocaleForUser } from '@/modules/payments/billing.service';
import { withErrorHandling, jsonOk, Errors } from '@/lib/api-response';
import { checkRateLimit } from '@/lib/rate-limit';
import { isLocale, LOCALE_COOKIE } from '@/lib/i18n/locale';

// Called by LocaleProvider right after the language switcher writes the
// `ptd_locale` cookie. The cookie stays the single source of truth: this reads
// it (never a client-supplied value) and mirrors it onto the user's EXISTING
// Stripe Customer so invoice/receipt PDFs and emails follow the app language.
// It never creates a Customer and a Stripe failure never surfaces as an error
// (see syncStripeCustomerLocaleForUser), so switching language is never blocked.
export async function POST() {
  return withErrorHandling(async () => {
    const session = await getServerSession(authOptions);
    if (!session?.user) throw Errors.unauthorized();

    if (!checkRateLimit(`account:locale:${session.user.id}`, 30, 60_000)) {
      throw Errors.tooManyRequests();
    }

    const locale = cookies().get(LOCALE_COOKIE)?.value;
    if (!isLocale(locale)) throw Errors.badRequest('Unsupported language');

    await syncStripeCustomerLocaleForUser(session.user.id, locale);
    return jsonOk({ ok: true });
  });
}
