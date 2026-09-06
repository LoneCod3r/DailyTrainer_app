import Link from 'next/link';
import { Container, Card, Badge, Button } from '@/components/ui';
import { PageHeader } from '@/components/layout/PageHeader';
import { getLocale } from '@/lib/i18n/get-locale';
import { getT } from '@/lib/i18n/dictionaries';
import { getStartHereSections } from '@/modules/kuko-way/service';
import { localize } from '@/modules/kuko-way/types';

// Groups the handbook's introductory chapters into one guided journey
// (Learn → Understand → Prepare → Practice) instead of dumping the table of
// contents as a flat list — per Prompt2 Day 2 Step 5.
const PHASES: { titleBg: string; titleEn: string; sectionIds: string[] }[] = [
  { titleBg: 'Учи', titleEn: 'Learn', sectionIds: ['intro', 'what-is-kuko-way', 'our-beliefs', 'evolution-of-training'] },
  { titleBg: 'Разбери', titleEn: 'Understand', sectionIds: ['what-is-fascia', 'what-is-fascial-maneuver', 'body-zones'] },
  { titleBg: 'Подготви се', titleEn: 'Prepare', sectionIds: ['fascia-fundamentals', 'body-fundamentals', 'getting-started-tips'] },
  { titleBg: 'Практикувай', titleEn: 'Practice', sectionIds: ['what-to-expect'] },
];

export default function StartHerePage() {
  const locale = getLocale();
  const t = getT(locale);
  const sections = getStartHereSections();
  const byId = new Map(sections.map((s) => [s.id, s]));

  return (
    <Container className="flex flex-col gap-10 py-8">
      <PageHeader eyebrow={t('nav.practices')} title={t('startHere.title')} description={t('startHere.subtitle')} />

      <div className="flex flex-col gap-8">
        {PHASES.map((phase, phaseIndex) => (
          <div key={phase.titleBg} className="flex flex-col gap-3">
            <div className="flex items-center gap-2">
              <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-brand-tint text-xs font-semibold text-link">
                {phaseIndex + 1}
              </span>
              <h2 className="text-sm font-semibold uppercase tracking-wide text-ink-500">
                {locale === 'en' ? phase.titleEn : phase.titleBg}
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
    </Container>
  );
}
