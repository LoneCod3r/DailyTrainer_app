import type { Metadata } from 'next';
import { Container, EmptyState } from '@/components/ui';
import { PageHeader } from '@/components/layout/PageHeader';
import { ProgramTile } from '@/components/programs/ProgramTile';
import { Disclaimer } from '@/components/practices/Disclaimer';
import { getVisiblePrograms } from '@/modules/programs/service';
import { FutureProductCard } from '@/components/commerce/FutureProductCard';
import { getFutureProducts } from '@/modules/commerce/catalog';
import { features } from '@/lib/features';
import { getLocale } from '@/lib/i18n/get-locale';
import { getT } from '@/lib/i18n/dictionaries';

export function generateMetadata(): Metadata {
  const t = getT(getLocale());
  return { title: t('resetPrograms.pageTitle'), description: t('resetPrograms.pageSubtitle') };
}

// The Reset Programs (1 / 3 / 7 / 28 days) — one-time programs, each opening
// its own overview (access to the days is checked server-side there) — and,
// visibly secondary, the products that come later (Community, Trainer).
// Prices come from the catalog and show only while `pricingPreview` is on;
// nothing on this page can start a checkout.
export default function ProgramsPage() {
  const locale = getLocale();
  const t = getT(locale);
  const programs = getVisiblePrograms();

  return (
    <Container className="flex flex-col gap-8 py-8">
      <PageHeader title={t('resetPrograms.pageTitle')} description={t('resetPrograms.pageSubtitle')} />
      {programs.length > 0 ? (
        <div className="grid gap-5 sm:grid-cols-2">
          {programs.map((program) => (
            <ProgramTile key={program.slug} program={program} locale={locale} t={t} />
          ))}
        </div>
      ) : (
        <EmptyState title={t('resetPrograms.notAvailableTitle')} description={t('resetPrograms.notAvailableDesc')} />
      )}
      {features.pricingPreview && !features.programCheckout && (
        <p className="text-sm text-ink-500" data-testid="pricing-preview-note">
          {t('pricing.previewNote')}
        </p>
      )}

      <section className="flex flex-col gap-4 border-t border-sand-200 pt-8" aria-labelledby="coming-later">
        <div>
          <h2 id="coming-later" className="font-serif text-2xl text-ink-900 sm:text-3xl">
            {t('pricing.laterTitle')}
          </h2>
          <p className="mt-1 text-sm text-ink-500">{t('pricing.laterDesc')}</p>
        </div>
        <div className="grid gap-5 sm:grid-cols-2">
          {getFutureProducts().map((product) => (
            <FutureProductCard
              key={product.slug}
              product={product}
              locale={locale}
              t={t}
              showPrice={features.pricingPreview}
            />
          ))}
        </div>
      </section>
      <Disclaimer t={t} />
    </Container>
  );
}
