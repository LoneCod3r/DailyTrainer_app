import Link from 'next/link';
import type { Purchase } from '@prisma/client';
import { Badge } from '@/components/ui';
import { PAYMENT_STATUS_TONE, paymentStatusKey } from '@/lib/billing-status';
import { formatCurrency } from '@/lib/format-currency';
import { formatDate } from '@/lib/format-date';
import { localize } from '@/modules/kuko-way/types';
import { getProgramProductBySlug } from '@/modules/commerce/purchases.service';
import type { Locale } from '@/lib/i18n/locale';
import type { DictKey } from '@/lib/i18n/dictionaries';

// Account → one-time Reset Program purchases: what was bought, its payment
// status, and whether access is open (from the Entitlement boundary, not the
// payment row). Deliberately separate from Membership / subscriptions.
export function ProgramPurchases({
  purchases,
  accessibleProgramSlugs,
  locale,
  t,
}: {
  purchases: Purchase[];
  accessibleProgramSlugs: Set<string>;
  locale: Locale;
  t: (key: DictKey, vars?: Record<string, string | number>) => string;
}) {
  if (purchases.length === 0) return null;
  return (
    <section className="flex flex-col gap-3" aria-labelledby="program-purchases" data-testid="program-purchases">
      <div>
        <h2 id="program-purchases" className="font-serif text-2xl text-ink-900">
          {t('purchase.purchasesTitle')}
        </h2>
        <p className="mt-1 text-sm text-ink-500">{t('purchase.purchasesDesc')}</p>
      </div>
      <ul className="flex flex-col divide-y divide-sand-200 rounded-2xl border border-sand-200 bg-surface">
        {purchases.map((purchase) => {
          const product = getProgramProductBySlug(purchase.courseId);
          const programSlug = product?.programSlug;
          const hasAccess = Boolean(programSlug && accessibleProgramSlugs.has(programSlug));
          return (
            <li key={purchase.id} className="flex flex-col gap-2 p-4 sm:flex-row sm:items-center sm:justify-between">
              <div className="flex flex-col">
                <span className="font-medium text-ink-900">{product ? localize(product.title, locale).value : purchase.courseId}</span>
                <span className="text-sm text-ink-500">
                  {formatCurrency(purchase.amount, purchase.currency, locale, { trimZeroCents: true })} · {t('pricing.oneTime')} ·{' '}
                  {formatDate(purchase.purchasedAt ?? purchase.createdAt, locale)}
                </span>
              </div>
              <div className="flex flex-wrap items-center gap-2">
                <Badge tone={PAYMENT_STATUS_TONE[purchase.status] ?? 'neutral'} data-testid="purchase-status">
                  {t(paymentStatusKey(purchase.status))}
                </Badge>
                <Badge tone={hasAccess ? 'success' : 'neutral'} data-testid="purchase-access">
                  {hasAccess ? t('purchase.accessOpen') : t('purchase.accessNone')}
                </Badge>
                {hasAccess && programSlug && (
                  <Link href={`/practices/programs/${programSlug}`} className="text-sm font-medium text-link hover:underline">
                    {t('purchase.openProgram')} →
                  </Link>
                )}
              </div>
            </li>
          );
        })}
      </ul>
    </section>
  );
}
