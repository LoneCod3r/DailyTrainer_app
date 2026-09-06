import type { Locale } from '@/lib/i18n/locale';

// `amountInCents` follows the same smallest-currency-unit convention used
// across the Prisma billing models (MembershipPlan.amount, Payment.amount, …).
export function formatCurrency(amountInCents: number, currency: string, locale: Locale) {
  return new Intl.NumberFormat(locale === 'bg' ? 'bg-BG' : 'en-US', {
    style: 'currency',
    currency: currency.toUpperCase(),
  }).format(amountInCents / 100);
}
