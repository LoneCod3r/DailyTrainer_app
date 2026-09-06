import { Container, Badge } from '@/components/ui';
import { PageHeader } from '@/components/layout/PageHeader';
import { PracticeCard } from '@/components/practices/PracticeCard';
import { Disclaimer } from '@/components/practices/Disclaimer';
import { getLocale } from '@/lib/i18n/get-locale';
import { getT } from '@/lib/i18n/dictionaries';
import { getTopLevelPractices } from '@/modules/kuko-way/service';

// Quick-access practice discovery: Open → Choose → Start. Shows every
// top-level KUKO WAY practice (organ-reset sub-items live one level down,
// under the "Рестарт на органите" card) — see Prompt2 Day 2 Step 6.
export default function FeelBetterNowPage() {
  const locale = getLocale();
  const t = getT(locale);
  const allPractices = getTopLevelPractices();

  return (
    <Container className="flex flex-col gap-8 py-8">
      <PageHeader eyebrow={t('nav.practices')} title={t('feelBetterNow.title')} description={t('feelBetterNow.subtitle')} />

      <Badge tone="neutral" className="w-fit">
        {t('feelBetterNow.flowLabel')}
      </Badge>

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {allPractices.map((practice) => (
          <PracticeCard key={practice.id} practice={practice} locale={locale} t={t} />
        ))}
      </div>

      <Disclaimer t={t} />
    </Container>
  );
}
