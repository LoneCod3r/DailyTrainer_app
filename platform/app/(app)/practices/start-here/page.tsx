import Link from 'next/link';
import { Container, Card, Badge, Button } from '@/components/ui';
import { PageHeader } from '@/components/layout/PageHeader';
import { getLocale } from '@/lib/i18n/get-locale';
import { getT } from '@/lib/i18n/dictionaries';
import { getStartHereSections } from '@/modules/kuko-way/service';
import { localize } from '@/modules/kuko-way/types';
import { START_HERE_PHASES } from '@/modules/kuko-way/handbook';

// Start Here = orientation and first steps only: get to know KUKO WAY, get
// ready for the first practice, then practise. The handbook's background
// chapters (fascia, the body, body zones, …) live in Learn — each chapter has
// exactly one home (modules/kuko-way/handbook.ts), so nothing is duplicated.

export default function StartHerePage() {
  const locale = getLocale();
  const t = getT(locale);
  const sections = getStartHereSections();
  const byId = new Map(sections.map((s) => [s.id, s]));

  return (
    <Container className="flex flex-col gap-10 py-8">
      <PageHeader eyebrow={t('nav.practices')} title={t('startHere.title')} description={t('startHere.subtitle')} />

      <div className="flex flex-col gap-8">
        {START_HERE_PHASES.map((phase, phaseIndex) => (
          <div key={phase.labelKey} className="flex flex-col gap-3">
            <div className="flex items-center gap-2">
              <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-brand-tint text-xs font-semibold text-link">
                {phaseIndex + 1}
              </span>
              <h2 className="text-sm font-semibold uppercase tracking-wide text-ink-500">
                {t(phase.labelKey)}
              </h2>
            </div>
            <div className="grid gap-3 sm:grid-cols-2">
              {phase.sectionIds.map((id) => {
                const section = byId.get(id);
                if (!section) return null;
                const title = localize(section.title, locale);
                const preview = section.paragraphs?.[0] ?? section.subsections?.[0]?.paragraphs[0];
                const previewText = preview ? localize(preview, locale) : undefined;
                return (
                  <Link key={id} href={`/practices/start-here/${section.slug}`}>
                    <Card className="flex h-full flex-col gap-1.5 p-5 transition-shadow hover:shadow-soft">
                      <h3 className="font-medium text-ink-900">{title.value}</h3>
                      {previewText && <p className="line-clamp-2 text-sm text-ink-500">{previewText.value}</p>}
                      <span className="mt-auto pt-1 text-sm font-medium text-link">{t('startHere.readSection')} →</span>
                    </Card>
                  </Link>
                );
              })}
            </div>
          </div>
        ))}
      </div>

      <Card className="flex flex-col items-start gap-3 bg-brand-tint p-6">
        <Badge tone="brand">{t('nav.startHere')}</Badge>
        <p className="text-base font-medium text-ink-900">{t('startHere.startPracticing')}</p>
        <Link href="/practices/body-scan-1">
          <Button>{t('startHere.goToFirstPractice')}</Button>
        </Link>
      </Card>

      <p className="text-sm text-ink-500">
        {t('startHere.learnMore')}{' '}
        <Link href="/learn" className="font-medium text-link hover:underline">
          {t('startHere.learnMoreCta')} →
        </Link>
      </p>
    </Container>
  );
}
