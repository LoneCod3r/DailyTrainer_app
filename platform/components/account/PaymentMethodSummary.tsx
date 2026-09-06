import { getT } from '@/lib/i18n/dictionaries';
import type { Locale } from '@/lib/i18n/locale';
import type { PaymentMethodSummary as PaymentMethodSummaryType } from '@/modules/payments/billing.service';

// Card brand + last 4 + expiry only — never full card numbers, and never
// stored locally (Stripe stays responsible for the payment method itself,
// see billing.service.ts's getPaymentMethodForUser).
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
    <div className="text-sm">
      <p className="text-ink-900">{t('account.billing.cardEndingIn', { brand, last4: paymentMethod.last4 })}</p>
      <p className="text-ink-500">
        {t('account.billing.expires', {
          month: String(paymentMethod.expMonth).padStart(2, '0'),
          year: paymentMethod.expYear,
        })}
      </p>
    </div>
  );
}
