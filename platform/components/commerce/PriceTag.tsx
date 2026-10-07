import { clsx } from '@/lib/clsx';
import { formatCurrency } from '@/lib/format-currency';
import type { CatalogProduct } from '@/modules/commerce/catalog';
import type { Locale } from '@/lib/i18n/locale';
import type { DictKey } from '@/lib/i18n/dictionaries';

// A catalog price, worded by kind: one-time programs say so explicitly
// ("€149 · One-time payment"); subscriptions show their periods
// ("€19 / month or €190 / year"). Display only.
export function PriceTag({
  product,
  locale,
  t,
  size = 'md',
}: {
  product: CatalogProduct;
  locale: Locale;
  t: (key: DictKey, vars?: Record<string, string | number>) => string;
  size?: 'md' | 'lg';
}) {
  const money = (amount: number) => formatCurrency(amount, product.prices[0].currency, locale, { trimZeroCents: true });
  const amountClass = clsx('font-semibold text-ink-900', size === 'lg' ? 'text-3xl' : 'text-2xl');

  if (product.kind === 'SUBSCRIPTION') {
    return (
      <p className="flex flex-wrap items-baseline gap-x-2 gap-y-1" data-testid="price-tag" data-price-kind="subscription">
        {product.prices.map((price, i) => (
          <span key={i} className="flex items-baseline gap-1">
            {i > 0 && <span className="pr-1 text-sm text-ink-500">{t('pricing.or')}</span>}
            <span className={amountClass}>{money(price.amount)}</span>
            <span className="text-sm text-ink-500">{t(price.interval === 'year' ? 'pricing.perYear' : 'pricing.perMonth')}</span>
          </span>
        ))}
      </p>
    );
  }

  return (
    <p className="flex flex-wrap items-baseline gap-x-2" data-testid="price-tag" data-price-kind="one-time">
      <span className={amountClass}>{money(product.prices[0].amount)}</span>
      {product.kind === 'PROGRAM' && <span className="text-sm text-ink-500">{t('pricing.oneTime')}</span>}
    </p>
  );
}
