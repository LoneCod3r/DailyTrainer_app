import Link from 'next/link';
import { Badge } from '@/components/ui';
import { PriceTag } from '@/components/commerce/PriceTag';
import { features } from '@/lib/features';
import { localize } from '@/modules/kuko-way/types';
import { getProgramProduct } from '@/modules/commerce/catalog';
import type { ResetProgram } from '@/modules/programs/types';
import type { Locale } from '@/lib/i18n/locale';
import type { DictKey } from '@/lib/i18n/dictionaries';

// One Reset Program in a list (programs index, Practice hub). Its price comes
// from the catalog (modules/commerce/catalog.ts) and is shown only while
// `features.pricingPreview` is on; the tile itself only ever links to the
// program overview — never to a checkout.
export function ProgramTile({
  program,
  locale,
  t,
}: {
  program: ResetProgram;
  locale: Locale;
  t: (key: DictKey, vars?: Record<string, string | number>) => string;
}) {
  const length = program.lengthDays === 1 ? t('resetPrograms.oneDay') : t('resetPrograms.days', { count: program.lengthDays });
  const product = getProgramProduct(program.slug);
  return (
    <Link
      href={`/practices/programs/${program.slug}`}
      className="group flex h-full flex-col gap-4 rounded-2xl border border-sand-200 bg-surface p-6 transition-shadow hover:shadow-soft"
      data-testid={`program-tile-${program.slug}`}
    >
      <div className="flex items-center justify-between gap-2">
        <span className="text-sm font-semibold uppercase tracking-wide text-clay">{length}</span>
        {!program.published && <Badge tone="neutral">{t('resetPrograms.previewBadge')}</Badge>}
      </div>
      <span className="font-serif text-3xl leading-tight text-ink-900">{localize(program.title, locale).value}</span>
      {product && <span className="text-sm text-ink-700">{localize(product.tagline, locale).value}</span>}
      {program.phases.length > 1 && (
        <span className="text-sm text-ink-500">
          {program.phases.map((phase) => localize(phase.title, locale).value).join(' · ')}
        </span>
      )}
      <div className="mt-auto flex flex-col gap-3 pt-2">
        {features.pricingPreview && product && <PriceTag product={product} locale={locale} t={t} />}
        <span className="text-sm font-medium text-link motion-safe:transition-transform motion-safe:group-hover:translate-x-1">
          {t('pricing.viewProgram')} →
        </span>
      </div>
    </Link>
  );
}
