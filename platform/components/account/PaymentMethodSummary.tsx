import { getT } from '@/lib/i18n/dictionaries';
import type { Locale } from '@/lib/i18n/locale';
import type { PaymentMethodSummary as PaymentMethodSummaryType } from '@/modules/payments/billing.service';
import { PaymentMethodCard } from '@/components/account/PaymentMethodCard';

// Composes the payment-method section of the Billing page. The card itself
// (PaymentMethodCard) is purely visual and marked aria-hidden, so the
// sr-only sentence below is what screen readers actually get — both are
// built from the same brand/last4/expiry fields, never a full card number
// (Stripe stays responsible for the payment method itself, see
// billing.service.ts's getPaymentMethodForUser).
export function PaymentMethodSummary({
  paymentMethod,
  locale,
}: {
  paymentMethod: PaymentMethodSummaryType | null;
  locale: Locale;
}) {
  const t = getT(locale);

  if (!paymentMethod) {
    return <p className="text-sm text-ink-500">{t('account.billing.noPaymentMethod')}</p>;
  }

  const brand = paymentMethod.brand.charAt(0).toUpperCase() + paymentMethod.brand.slice(1);

  return (
    <div>
      <p className="sr-only">
        {t('account.billing.cardEndingIn', { brand, last4: paymentMethod.last4 })}
        {', '}
        {t('account.billing.expires', {
          month: String(paymentMethod.expMonth).padStart(2, '0'),
          year: paymentMethod.expYear,
        })}
      </p>
      <PaymentMethodCard paymentMethod={paymentMethod} locale={locale} />
    </div>
  );
}
