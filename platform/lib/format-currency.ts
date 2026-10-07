import type { Locale } from '@/lib/i18n/locale';

// `amountInCents` follows the same smallest-currency-unit convention used
// across the Prisma billing models (MembershipPlan.amount, Payment.amount, …).
// `trimZeroCents` (opt-in, for catalog prices like "€19") drops ".00" from
// whole amounts; billing/invoice UI keeps the default exact formatting.
export function formatCurrency(
  amountInCents: number,
  currency: string,
  locale: Locale,
  { trimZeroCents = false }: { trimZeroCents?: boolean } = {},
) {
  const whole = amountInCents % 100 === 0;
  return new Intl.NumberFormat(locale === 'bg' ? 'bg-BG' : 'en-US', {
    style: 'currency',
    currency: currency.toUpperCase(),
    ...(trimZeroCents && whole ? { minimumFractionDigits: 0, maximumFractionDigits: 0 } : {}),
  }).format(amountInCents / 100);
}
