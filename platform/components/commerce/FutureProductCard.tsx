import { Badge } from '@/components/ui';
import { localize } from '@/modules/kuko-way/types';
import type { CatalogProduct } from '@/modules/commerce/catalog';
import type { Locale } from '@/lib/i18n/locale';
import type { DictKey } from '@/lib/i18n/dictionaries';
import { PriceTag } from './PriceTag';
import { ComingSoonButton } from './ComingSoonButton';

// An announced product that isn't part of V1 (Community, Trainer Program).
// Visibly secondary to the Reset Programs, marked "Coming soon", with an
// inactive action — no link, no subscription, no checkout.
export function FutureProductCard({
  product,
  locale,
  t,
  showPrice,
}: {
  product: CatalogProduct;
  locale: Locale;
  t: (key: DictKey, vars?: Record<string, string | number>) => string;
  showPrice: boolean;
}) {
  const noteId = `future-note-${product.slug}`;
  return (
    <article
      className="flex h-full flex-col gap-3 rounded-2xl border border-dashed border-sand-300 bg-sand-50 p-6"
      data-testid={`future-product-${product.slug}`}
    >
      <div className="flex flex-wrap items-center justify-between gap-2">
        <span className="text-sm font-semibold uppercase tracking-wide text-ink-500">{t(`pricing.kinds.${product.kind}` as DictKey)}</span>
        <Badge tone="neutral">{t('pricing.laterBadge')}</Badge>
      </div>
      <h3 className="font-serif text-2xl leading-tight text-ink-900">{localize(product.title, locale).value}</h3>
      <p id={noteId} className="text-sm text-ink-700">
        {localize(product.tagline, locale).value}
      </p>
      <div className="mt-auto flex flex-col items-start gap-3 pt-2">
        {showPrice && <PriceTag product={product} locale={locale} t={t} />}
        <ComingSoonButton label={t('pricing.comingSoon')} describedBy={noteId} />
      </div>
    </article>
  );
}
